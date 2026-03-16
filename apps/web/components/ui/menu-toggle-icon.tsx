import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface MenuToggleIconProps extends HTMLAttributes<HTMLSpanElement> {
  open: boolean;
  size?: number;
  strokeWidth?: number;
}

const barClassName =
  "absolute left-1/2 top-1/2 block h-px w-[18px] -translate-x-1/2 rounded-full bg-current origin-center transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const ICONS = {
  cross: {
    opacity: [1, 1, 0] as const,
    paths: [
      "M9.82843 4.17157L4.17157 9.82843",
      "M4.17157 4.17157L9.82843 9.82843",
      "M7 7L7 7",
    ] as const,
  },
  menu: {
    opacity: [1, 1, 1] as const,
    paths: ["M2.5 4L11.5 4", "M2.5 7L11.5 7", "M2.5 10L11.5 10"] as const,
  },
} as const;

const pathStyle = (d: string, opacity: number): CSSProperties => ({
  d: `path("${d}")`,
  opacity,
});

export const MenuToggleIcon = ({
  open,
  size = 24,
  strokeWidth = 1.25,
  className,
  style,
  ...props
}: MenuToggleIconProps) => {
  const def = open ? ICONS.cross : ICONS.menu;
  const [p0, p1, p2] = def.paths;
  const [o0, o1, o2] = def.opacity;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative inline-flex shrink-0 items-center justify-center text-current",
        className
      )}
      style={{ height: size, width: size, ...style }}
      {...props}
    >
      <svg
        className="menu-toggle-icon__morph absolute inset-0 size-full"
        fill="none"
        shapeRendering="geometricPrecision"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        viewBox="0 0 14 14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={p0} style={pathStyle(p0, o0)} />
        <path d={p1} style={pathStyle(p1, o1)} />
        <path d={p2} style={pathStyle(p2, o2)} />
      </svg>

      <span className="menu-toggle-icon__fallback absolute inset-0 block">
        <span
          className={cn(
            barClassName,
            open ? "translate-y-0 rotate-45" : "-translate-y-[5px]"
          )}
        />
        <span
          className={cn(
            barClassName,
            open ? "translate-y-0 scale-x-0 opacity-0" : "translate-y-0"
          )}
        />
        <span
          className={cn(
            barClassName,
            open ? "translate-y-0 -rotate-45" : "translate-y-[5px]"
          )}
        />
      </span>
    </span>
  );
};
