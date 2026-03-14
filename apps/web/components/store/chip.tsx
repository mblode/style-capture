import { cn } from "@/lib/utils";

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full border border-black/8 bg-black/[0.04] px-3 py-[9px] font-bold text-xs",
        className
      )}
    >
      {children}
    </div>
  );
}
