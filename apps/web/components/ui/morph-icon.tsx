import { forwardRef } from "react";
import type { ComponentRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { ICONS } from "./morph-icon-data";
import type { MorphIconName } from "./morph-icon-data";

interface MorphIconProps extends React.SVGAttributes<SVGSVGElement> {
  icon: MorphIconName;
  size?: number;
  strokeWidth?: number;
}

export type { MorphIconName };

const pathStyle = (d: string, opacity: number): CSSProperties => ({
  d: `path("${d}")`,
  opacity,
});

export const MorphIcon = forwardRef<ComponentRef<"svg">, MorphIconProps>(
  ({ icon, size = 32, strokeWidth = 1.5, className, style, ...props }, ref) => {
    const def = ICONS[icon];
    const [p0, p1, p2] = def.paths;
    const [o0, o1, o2] = def.opacity;

    return (
      <svg
        ref={ref}
        className={cn("morph-icon text-foreground", className)}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        style={style}
        viewBox="0 0 14 14"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d={p0} style={pathStyle(p0, o0)} />
        <path d={p1} style={pathStyle(p1, o1)} />
        <path d={p2} style={pathStyle(p2, o2)} />
      </svg>
    );
  }
);

MorphIcon.displayName = "MorphIcon";
