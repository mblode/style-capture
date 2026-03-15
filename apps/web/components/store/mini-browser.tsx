import { cn } from "@/lib/utils";

export const MiniBrowser = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "absolute right-[26px] bottom-6 w-[42%] overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-lg",
      className
    )}
  >
    <div className="flex gap-1.5 border-black/6 border-b bg-[#fafafa] px-3.5 py-3">
      <span className="size-2 rounded-full bg-black/15" />
      <span className="size-2 rounded-full bg-black/15" />
      <span className="size-2 rounded-full bg-black/15" />
    </div>
    <div className="relative p-4">{children}</div>
  </div>
);
