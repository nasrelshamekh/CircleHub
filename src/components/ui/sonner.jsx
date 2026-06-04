import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-lowest)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border)",
          "--normal-bg-hover": "var(--surface-low)",
          "--border-radius": "var(--radius-lg)",
          "--success-text": "var(--primary)",
          "--info-text": "var(--tertiary)",
          "--warning-text": "var(--tertiary)",
          "--error-text": "var(--error)",
        }
      }
      toastOptions={{
        classNames: {
          toast: "circlehub-toast",
          title: "circlehub-toast-title",
          description: "circlehub-toast-description",
          icon: "circlehub-toast-icon",
          closeButton: "circlehub-toast-close",
          actionButton: "circlehub-toast-action",
          cancelButton: "circlehub-toast-cancel",
        },
      }}
      {...props} />
  );
}

export { Toaster }
