import type * as React from "react";

import { cn } from "@/lib/utils.ts";

const VARIANT_CLASSES = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground active:bg-muted/80 dark:border-input dark:bg-input/30 dark:active:bg-input/60 dark:hover:bg-input/50",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/85 active:bg-secondary/75",
  ghost:
    "hover:bg-muted hover:text-foreground active:bg-muted/80 dark:active:bg-muted/60 dark:hover:bg-muted/50",
} as const;

const SIZE_CLASSES = {
  default: "h-10 gap-1.5 px-3",
  sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-11 gap-1.5 px-4",
  icon: "size-10",
  "icon-sm": "size-9 rounded-[min(var(--radius-md),12px)]",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;
type ButtonSize = keyof typeof SIZE_CLASSES;

interface ButtonProps extends React.ComponentProps<"button"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium text-sm outline-none transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      data-slot="button"
      {...props}
    />
  );
}

export { Button };
