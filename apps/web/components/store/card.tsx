import { cn } from "@/lib/utils";

export const Card = ({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
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
