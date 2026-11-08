import { LoaderCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ConfirmModal({
    open,
    onOpenChange,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "default",
    onConfirm,
    isLoading = false,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="content-card border-0 bg-(--surface-lowest) text-primary sm:max-w-md shadow-2xl p-6"
            >
                <DialogHeader className="items-start text-left">
                    <DialogTitle className="text-lg font-semibold text-primary">
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription className="type-body-sm text-secondary mt-1">
                            {description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                <DialogFooter className="mt-5 flex flex-row items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => onOpenChange?.(false)}
                        disabled={isLoading}
                        className="rounded-full px-5 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-(--surface-container) transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            await onConfirm?.();
                            onOpenChange?.(false);
                        }}
                        disabled={isLoading}
                        className={`${
                            confirmVariant === "destructive"
                                ? "bg-(--error) text-white hover:opacity-90 cursor-pointer"
                                : "button-primary"
                        } flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        {isLoading && <LoaderCircle size={15} className="animate-spin" />}
                        <span>{confirmText}</span>
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
