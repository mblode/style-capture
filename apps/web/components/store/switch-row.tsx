import { Badge } from "@/components/store/browser-frame";

export function SwitchRow({
  title,
  description,
  badge,
  on = true,
}: {
  title: string;
  description: string;
  badge?: string;
  on?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-[#fafafa] px-4 py-3.5">
      <div>
        <strong>{title}</strong>
        <div className="text-[#666] text-sm">{description}</div>
      </div>
      {badge ? (
        <Badge>{badge}</Badge>
      ) : (
        <div
          className="relative h-[30px] w-[54px] shrink-0 rounded-full"
          style={{ background: on ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.1)" }}
        >
          <span
            className="absolute top-1 size-[22px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            style={{ left: on ? 28 : 4 }}
          />
        </div>
      )}
    </div>
  );
}
