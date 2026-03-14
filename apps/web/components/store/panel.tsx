import { Card } from "@/components/store/card";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "p-[18px] pb-4 [&_h3]:mb-2 [&_h3]:text-[19px] [&_h3]:leading-tight [&_h3]:tracking-[-0.03em] [&_li]:text-black/60 [&_li]:text-sm [&_p]:text-black/60 [&_p]:text-sm [&_ul]:list-disc",
        className
      )}
    >
      {children}
    </Card>
  );
}
