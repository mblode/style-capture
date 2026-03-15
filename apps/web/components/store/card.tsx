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
      "relative rounded-3xl border border-black/12 bg-white/82 backdrop-blur-[16px]",
      className
    )}
    style={style}
  >
    {children}
  </div>
);
