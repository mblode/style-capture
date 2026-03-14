import { Badge } from "@/components/store/browser-frame";
import { Chip } from "@/components/store/chip";
import { Eyebrow } from "@/components/store/eyebrow";
import { MiniBrowser } from "@/components/store/mini-browser";

export default function SmallPromoTile() {
  return (
    <div className="grid size-full place-items-center bg-[#f8f8f8] p-[22px]">
      <div className="relative size-full overflow-hidden rounded-[28px] border border-black/8 bg-white p-7 shadow-[0_20px_48px_rgba(0,0,0,0.08)]">
        <Eyebrow>Style Capture</Eyebrow>
        <h1 className="mt-3.5 mb-2.5 max-w-[10ch] font-bold text-[42px] leading-[0.95] tracking-[-0.06em]">
          Capture live CSS.
        </h1>
        <p className="max-w-[24ch] text-[#666] text-lg">
          Select, capture, paste. Claude-ready with Tailwind hints.
        </p>
        <div className="mt-[18px] flex flex-wrap gap-2.5">
          <Chip>Local only</Chip>
          <Chip>Tailwind hints</Chip>
          <Chip>activeTab</Chip>
        </div>

        <MiniBrowser>
          <Badge>Clicked</Badge>
          <h3 className="mt-3 mb-1.5 font-bold text-[22px] tracking-[-0.04em]">
            Pricing card
          </h3>
          <div className="absolute top-[54px] right-[18px] left-[18px] h-[86px] border border-black/50 bg-black/[0.08]" />
        </MiniBrowser>
      </div>
    </div>
  );
}
