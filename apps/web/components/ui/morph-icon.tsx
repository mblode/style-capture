import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface MorphIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: "cross" | "menu";
  size?: number;
  strokeWidth?: number;
}

export type MorphIconName = "cross" | "menu";

const barBase =
  "absolute left-0 block w-full rounded-full bg-current transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

export const MorphIcon = ({
  icon,
  size = 32,
  strokeWidth = 1.5,
  className,
  style,
  ...props
}: MorphIconProps) => {
  const open = icon === "cross";
  const barWidth = size * 0.643;
  const barHeight = strokeWidth;
  const gap = size * 0.214;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "morph-icon pointer-events-none relative inline-flex shrink-0 items-center justify-center text-current",
        className
      )}
      style={{ height: size, width: size, ...style }}
      {...props}
    >
      <span
        className={barBase}
        style={{
          height: barHeight,
          left: (size - barWidth) / 2,
          top: size / 2 - gap,
          transform: open
            ? `translateY(${gap}px) rotate(45deg)`
            : "translateY(0) rotate(0)",
          width: barWidth,
        }}
      />
      <span
        className={barBase}
        style={{
          height: barHeight,
          left: (size - barWidth) / 2,
          opacity: open ? 0 : 1,
          top: size / 2,
          transform: open ? "scaleX(0)" : "scaleX(1)",
          width: barWidth,
        }}
      />
      <span
        className={barBase}
        style={{
          height: barHeight,
          left: (size - barWidth) / 2,
          top: size / 2 + gap,
          transform: open
            ? `translateY(${-gap}px) rotate(-45deg)`
            : "translateY(0) rotate(0)",
          width: barWidth,
        }}
      />
    </span>
  );
};
