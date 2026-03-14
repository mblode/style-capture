"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type * as React from "react";

import { cn } from "@/lib/utils.ts";

const Switch = ({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/90 bg-card outline-none transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-checked:border-primary data-checked:bg-primary data-disabled:opacity-50 motion-safe:active:scale-95",
      className
    )}
    data-slot="switch"
    {...props}
  >
    <SwitchPrimitive.Thumb
      className="pointer-events-none block size-5 rounded-full bg-white shadow-switch ring-0 transition-transform data-checked:translate-x-5 data-unchecked:translate-x-0.5"
      data-slot="switch-thumb"
    />
  </SwitchPrimitive.Root>
);

export { Switch };
