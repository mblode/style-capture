import type * as React from "react";

import { cn } from "@/lib/utils.ts";

const VARIANT_CLASSES = {
  outline: "border-border text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white dark:bg-destructive/60",
  success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  warning:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "outline", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 font-medium text-xs [&>svg]:pointer-events-none [&>svg]:size-3",
        VARIANT_CLASSES[variant],
        className
      )}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
