import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Tabs({ className, orientation = "horizontal", ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "flex flex-col gap-5 data-[orientation=vertical]:flex-row",
        className
      )}
      {...props}
    />
  );
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        `
          grid h-auto w-full grid-cols-2 gap-2
          rounded-lg
          bg-(--surface-lowest)
          p-2
          shadow-(--shadow-sm)
          sm:grid-cols-4
        `,
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        `
          inline-flex items-center justify-center gap-2
          rounded-lg
          px-3 py-3
          type-label-md
          text-(--text-secondary)
          transition
          cursor-pointer
          hover:bg-(--hover)
          hover:text-(--primary)

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-(--focus-ring)

          disabled:pointer-events-none
          disabled:opacity-50

          data-[state=active]:bg-(--active)
          data-[state=active]:text-(--primary)
        `,
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
