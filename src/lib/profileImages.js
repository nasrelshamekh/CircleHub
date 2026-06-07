import avatarPlaceholder from "@/assets/avatar-placeholder.svg";
import coverPlaceholder from "@/assets/cover-placeholder.svg";

export function getAvatarImage(avatar) {
    return avatar || avatarPlaceholder;
}

export function getCoverImage(coverImage) {
    return coverImage || coverPlaceholder;
}
