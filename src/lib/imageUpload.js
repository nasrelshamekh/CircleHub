export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_DIMENSION = 2048;
export const SHRINK_ABOVE_BYTES = 1024 * 1024; // 1 MB
export const UPLOAD_JPEG_QUALITY = 0.9;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ACCEPTED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES.join(",");

const FRIENDLY_TYPE_NAMES = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
};

const ALLOWED_TYPES_LABEL = ALLOWED_IMAGE_TYPES.map(
    (type) => FRIENDLY_TYPE_NAMES[type]
).join(", ");

export function validateImageFile(file) {
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Only ${ALLOWED_TYPES_LABEL} images are allowed.`;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return "Image must be 5MB or smaller.";
    }

    return null;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read image file."));
        reader.readAsDataURL(file);
    });
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not load image."));
        };
        img.src = objectUrl;
    });
}

/**
 * Client-side downscaler and compressor using HTML Canvas.
 * Matches mobile prepareUploadImage behavior:
 * - Max dimension: 2048px (maintains aspect ratio)
 * - Compression quality: 0.9
 * - Automatically downscales photos > 2048px or > 1MB
 * - Returns { file: File | null, previewUrl: string | null, error: string | null }
 */
export async function prepareUploadImage(file) {
    if (!file) {
        return { file: null, previewUrl: null, error: null };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            file: null,
            previewUrl: null,
            error: `Only ${ALLOWED_TYPES_LABEL} images are allowed.`,
        };
    }

    try {
        const img = await loadImage(file);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
            return {
                file: null,
                previewUrl: null,
                error: "Could not read the selected image.",
            };
        }

        const needsShrink =
            width > MAX_UPLOAD_DIMENSION ||
            height > MAX_UPLOAD_DIMENSION ||
            file.size > SHRINK_ABOVE_BYTES;

        if (!needsShrink) {
            if (file.size > MAX_IMAGE_BYTES) {
                return {
                    file: null,
                    previewUrl: null,
                    error: "Image must be 5MB or smaller.",
                };
            }
            const previewUrl = await readFileAsDataUrl(file);
            return { file, previewUrl, error: null };
        }

        let targetWidth = width;
        let targetHeight = height;

        if (width > MAX_UPLOAD_DIMENSION || height > MAX_UPLOAD_DIMENSION) {
            if (width >= height) {
                targetWidth = MAX_UPLOAD_DIMENSION;
                targetHeight = Math.round((height * MAX_UPLOAD_DIMENSION) / width);
            } else {
                targetHeight = MAX_UPLOAD_DIMENSION;
                targetWidth = Math.round((width * MAX_UPLOAD_DIMENSION) / height);
            }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Could not create canvas context.");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let outputType = file.type;
        const outputQuality = UPLOAD_JPEG_QUALITY;

        if (outputType === "image/jpeg" || outputType === "image/jpg") {
            outputType = "image/jpeg";
        } else if (outputType === "image/webp") {
            outputType = "image/webp";
        }

        let blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, outputType, outputQuality);
        });

        // If a PNG was downscaled but still exceeds 5MB, compress as WebP (preserves alpha)
        if (blob && blob.size > MAX_IMAGE_BYTES && outputType === "image/png") {
            outputType = "image/webp";
            blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, outputType, outputQuality);
            });
        }

        if (!blob) {
            throw new Error("Could not export canvas to blob.");
        }

        if (blob.size > MAX_IMAGE_BYTES) {
            return {
                file: null,
                previewUrl: null,
                error: "Image must be 5MB or smaller.",
            };
        }

        const extension =
            outputType === "image/png"
                ? ".png"
                : outputType === "image/webp"
                  ? ".webp"
                  : ".jpg";

        const baseName = (file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
        const newFileName = `${baseName}${extension}`;

        const processedFile = new File([blob], newFileName, {
            type: outputType,
            lastModified: Date.now(),
        });

        const previewUrl = canvas.toDataURL(outputType, outputQuality);

        return {
            file: processedFile,
            previewUrl,
            error: null,
        };
    } catch (err) {
        console.warn("[imageUpload] Client-side resizing failed, falling back:", err);

        if (file.size > MAX_IMAGE_BYTES) {
            return {
                file: null,
                previewUrl: null,
                error: "Image must be 5MB or smaller.",
            };
        }

        try {
            const previewUrl = await readFileAsDataUrl(file);
            return { file, previewUrl, error: null };
        } catch {
            return {
                file: null,
                previewUrl: null,
                error: "Could not read the selected image.",
            };
        }
    }
}
