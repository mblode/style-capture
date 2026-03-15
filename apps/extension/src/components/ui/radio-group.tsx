"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { CirclePlaceholderOnIcon } from "blode-icons-react";
import React from "react";

import { cn } from "@/lib/utils.ts";

type RadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>,
  "defaultValue" | "onValueChange" | "value"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type RadioGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>,
  "value"
> & {
  value: string;
};

const coerceValue = (
  nextValue: unknown,
  onValueChange?: (value: string) => void
) => {
  onValueChange?.(
    typeof nextValue === "string" ? nextValue : String(nextValue ?? "")
  );
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, onValueChange, ...props }, ref) => {
    const handleValueChange = React.useCallback(
      (nextValue: unknown) => coerceValue(nextValue, onValueChange),
      [onValueChange]
    );

    return (
      <RadioGroupPrimitive
        className={cn("grid w-full gap-2", className)}
        data-slot="radio-group"
        onValueChange={handleValueChange}
        ref={ref}
        {...props}
      />
    );
  }
);
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef<HTMLSpanElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <RadioPrimitive.Root
      className={cn(
        "isolate relative inline-flex aspect-square size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input bg-card align-middle text-primary-foreground shadow-input ring-offset-background hover:border-input-hover",
        "data-checked:border-primary data-checked:bg-primary",
        "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      <RadioPrimitive.Indicator className="z-10 pointer-events-none flex items-center justify-center text-current">
        <CirclePlaceholderOnIcon className="size-2.5 fill-current text-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
