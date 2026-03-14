import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-black/10 bg-white/82 shadow-[0_18px_36px_rgba(0,0,0,0.04)] backdrop-blur-[16px]",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
