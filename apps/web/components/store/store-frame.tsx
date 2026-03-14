import { cn } from "@/lib/utils";

export const StoreFrame = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("size-full bg-[#f8f8f8] p-[34px]", className)}>
    {children}
  </div>
);
