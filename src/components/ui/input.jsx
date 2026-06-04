
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "input-surface type-body-sm h-9 w-full min-w-0 rounded-md px-2.5 py-1 shadow-(--shadow-sm) file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-(--text-primary) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-(--error) aria-invalid:ring-3 aria-invalid:ring-(--error-container)",
        className
      )}
      {...props} />
  );
}

export { Input }
