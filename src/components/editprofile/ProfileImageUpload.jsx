import { useRef, useState } from "react";
import { PencilIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function ProfileImageUpload({ variant, imageSrc, originalImageSrc = imageSrc, alt, onImageChange }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const isCover = variant === "cover";
  const visibleImage = previewUrl || imageSrc;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onImageChange?.(reader.result);
      };

      reader.onerror = () => {
        toast.error(`Could not read the selected ${alt.toLowerCase()} image.`);
      };

      reader.readAsDataURL(file);
    } catch {
      toast.error(`Could not read the selected ${alt.toLowerCase()} image.`);
    }
  }

  function handleRemovePreview() {
    setPreviewUrl(null);
    onImageChange?.(originalImageSrc);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        <img
          src={visibleImage}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      <button
        type="button"
        onClick={openFilePicker}
        className={
          isCover
            ? "button-primary absolute bottom-4 right-4 flex items-center gap-2 p-2 text-sm"
            : "button-primary absolute bottom-0 right-0 flex items-center justify-center p-2 text-sm lg:h-9 lg:w-9"
        }
      >
        <PencilIcon className="h-4 w-4" />
        {isCover && <p className="hidden lg:block">Change Cover Photo</p>}
      </button>

      {previewUrl && (
        <button
          type="button"
          onClick={handleRemovePreview}
          aria-label={`Remove ${alt} preview`}
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
