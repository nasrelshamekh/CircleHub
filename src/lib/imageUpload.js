export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Only ${ALLOWED_TYPES_LABEL} images are allowed.`;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return "Image must be 5MB or smaller.";
    }

    return null;
}
