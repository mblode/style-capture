import { cn } from "@/lib/utils";

export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "inline-flex w-fit items-center gap-2.5 rounded-full border border-black/8 bg-black/[0.04] px-3.5 py-2 font-bold text-[11px] text-black uppercase tracking-[0.18em]",
      className
    )}
  >
    {children}
  </div>
);
