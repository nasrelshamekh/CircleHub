// Shared image upload rules for the client.
//
// The API is the real gatekeeper (`UploadService.AllowedExtensions`), but
// checking here avoids a pointless upload round-trip and lets us reject a
// file before it is read into a data URL preview.
//
// Animated GIFs are deliberately excluded: avatars, banners and community
// images are static, and a multi-frame GIF in a small circular crop looks
// broken.

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

/**
 * Returns an error message if the file cannot be uploaded, otherwise null.
 */
export function validateImageFile(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Only ${ALLOWED_TYPES_LABEL} images are allowed.`;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return "Image must be 5MB or smaller.";
    }

    return null;
}