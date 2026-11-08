import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmModal({
    open,
    onOpenChange,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "destructive",
    onConfirm,
    isLoading = false,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
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

                <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={confirmVariant}
                        onClick={async () => {
                            await onConfirm?.();
                            onOpenChange?.(false);
                        }}
                        disabled={isLoading}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
