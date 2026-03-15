import { MiniBrowser } from "@/components/store/mini-browser";

export default function SmallPromoTile() {
  return (
    <div className="relative size-full p-7 bg-white">
      <h1 className="mt-3.5 mb-2.5 max-w-[16ch] font-bold text-[42px] leading-[0.95] tracking-[-0.06em]">
        Style Capture
      </h1>
      <p className="max-w-[24ch] text-black/60 text-lg">
        Select, capture, paste. AI-ready with Tailwind hints.
      </p>

      <MiniBrowser>
        <h3 className="mt-3 mb-1.5 font-bold text-[22px] tracking-[-0.04em]">
          Pricing card
        </h3>
        <div className="absolute top-[12px] right-[12px] left-[12px] bottom-[12px] border border-[rgba(67,137,245,1)] bg-[rgba(67,137,245,0.08)]" />
      </MiniBrowser>
    </div>
  );
}
