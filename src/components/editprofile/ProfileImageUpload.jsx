import { useRef, useState } from "react";
import { PencilIcon, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/profileimages/Avatar";
import CoverImage from "@/components/profileimages/CoverImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCEPTED_IMAGE_TYPES, prepareUploadImage } from "@/lib/imageUpload";

export default function ProfileImageUpload({
  variant,
  imageSrc,
  originalImageSrc = imageSrc,
  alt,
  onImageChange,
  onImageRemove,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const isCover = variant === "cover";
  const ImageComponent = isCover ? CoverImage : Avatar;
  const visibleSrc = previewUrl || imageSrc;
  const hasRemovableImage = Boolean(visibleSrc && !visibleSrc.includes("defaults/"));

  const [prevImageSrc, setPrevImageSrc] = useState(imageSrc);
  if (prevImageSrc !== imageSrc) {
    setPrevImageSrc(imageSrc);
    setPreviewUrl(null);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (!file) return;

    const { file: processedFile, previewUrl: processedPreview, error } =
      await prepareUploadImage(file);

    if (error) {
      toast.error(error);
      return;
    }

    setPreviewUrl(processedPreview);
    onImageChange?.(processedPreview, processedFile);
  }

  function handleRemovePreview() {
    setPreviewUrl(null);
    onImageChange?.(originalImageSrc, null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageRemove?.();
    onImageChange?.("", null);
  }

  return (
    <div className={isCover ? "relative" : "relative mx-auto -mt-13 h-26 w-26 lg:-mt-18 lg:h-32 lg:w-32"}>
      <div
        className={
          isCover
            ? "mx-auto h-72 w-full overflow-hidden rounded-lg"
            : "h-full w-full overflow-hidden rounded-full border-4 border-(--surface-lowest)"
        }
      >
        <ImageComponent
          src={visibleSrc}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      <div className={isCover ? "absolute bottom-4 right-4 flex items-center gap-2" : "absolute bottom-0 right-0 flex items-center gap-1"}>
        {hasRemovableImage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={isCover ? "Edit cover photo" : "Edit profile photo"}
                title={isCover ? "Edit cover photo" : "Edit profile photo"}
                className={
                  isCover
                    ? "button-primary flex items-center gap-2 p-2 text-sm cursor-pointer shadow-md"
                    : "button-primary flex items-center justify-center p-2 text-sm lg:h-9 lg:w-9 cursor-pointer shadow-md"
                }
              >
                <PencilIcon className="h-4 w-4" />
                {isCover && <span className="hidden lg:inline">Edit Cover Photo</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-(--surface) text-primary shadow-lg border border-(--border)">
              <DropdownMenuItem
                onClick={openFilePicker}
                className="cursor-pointer gap-2"
              >
                <Upload className="h-4 w-4 text-secondary" />
                <span>Upload photo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRemoveImage}
                className="cursor-pointer gap-2 text-error focus:text-error"
              >
                <Trash2 className="h-4 w-4 text-error" />
                <span>Remove photo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            aria-label={isCover ? "Upload cover photo" : "Upload profile photo"}
            title={isCover ? "Upload cover photo" : "Upload profile photo"}
            className={
              isCover
                ? "button-primary flex items-center gap-2 p-2 text-sm cursor-pointer shadow-md"
                : "button-primary flex items-center justify-center p-2 text-sm lg:h-9 lg:w-9 cursor-pointer shadow-md"
            }
          >
            <PencilIcon className="h-4 w-4" />
            {isCover && <span className="hidden lg:inline">Upload Cover Photo</span>}
          </button>
        )}
      </div>

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemovePreview}
          aria-label={`Cancel ${alt} preview`}
          title={`Cancel ${alt} preview`}
          className={
            isCover
              ? "icon-button-soft absolute right-4 top-4 flex h-9 w-9 items-center justify-center bg-(--surface-lowest) text-(--primary) shadow-sm"
              : "icon-button-soft absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center bg-(--surface-lowest) text-(--primary) shadow-sm"
          }
        >
          <X size={18} />
        </button>
      )}

      <input
        key={imageSrc || "empty"}
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
