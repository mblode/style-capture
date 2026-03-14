import { Card } from "@/components/store/card";
import { cn } from "@/lib/utils";

export const PromptBlock = ({
  label,
  children,
  className,
  style,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Card className={cn("bg-[#111] p-5 text-[#e8e8e8]", className)} style={style}>
    <div className="inline-flex items-center gap-2 font-bold text-[11px] text-white/60 uppercase tracking-[0.18em]">
      {label}
    </div>
    <pre className="mt-3.5 whitespace-pre-wrap font-mono text-[13px] leading-[1.55]">
      {children}
    </pre>
  </Card>
);
