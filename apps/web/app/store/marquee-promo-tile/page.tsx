import { BrowserFrame } from "@/components/store/browser-frame";
import { Card } from "@/components/store/card";
import { CodeBlock } from "@/components/store/code-block";

const EXPORT_XML = `<style_capture ...>
<tailwind_hints>
0=rounded-[20px] px-8 py-7
1=text-[2rem] tracking-[-0.05em]
</tailwind_hints>`;

export default function MarqueePromoTile() {
  return (
    <div className="grid size-full place-items-center bg-[#f8f8f8] p-4">
      <div className="relative size-full overflow-hidden rounded-[28px] border border-black/8 bg-white px-[38px] py-[34px] shadow-xl">
        <div className="grid size-full grid-cols-[0.95fr_1.05fr] gap-6">
          <div>
            <h1 className="mt-3.5 mb-3 font-bold text-[64px] leading-[0.92] tracking-[-0.06em]">
              Style Capture
            </h1>
            <p className="max-w-[28ch] text-[22px] text-black/60 leading-[1.45]">
              Point at any UI. Let your agent rebuild it.
            </p>
            <ol className="mt-5 flex flex-col gap-2 text-[15px] text-black/60">
              <li className="flex gap-2.5">
                <span>1.</span> Computed CSS your agent can trust
              </li>
              <li className="flex gap-2.5">
                <span>2.</span> Tailwind mappings it can apply
              </li>
              <li className="flex gap-2.5">
                <span>3.</span> Paste into any AI coding tool
              </li>
            </ol>
          </div>

          <div className="relative h-full">
            <BrowserFrame
              address="https://example.com/card"
              badge=""
              className="h-full rounded-3xl"
            >
              <div className="grid h-[calc(100%-80px)] grid-cols-[0.95fr_1.05fr] gap-[18px] p-[18px]">
                <Card className="p-6">
                  <h2 className="mb-2 font-bold text-[28px] leading-none tracking-[-0.04em]">
                    Hero card
                  </h2>
                  <p className="text-[15px] text-black/60">
                    Layout and spacing from one click.
                  </p>
                  <div
                    className="absolute border border-[rgba(67,137,245,1)] bg-[rgba(67,137,245,0.08)]"
                    style={{ bottom: 16, left: 16, right: 16, top: 16 }}
                  />
                </Card>
                <CodeBlock code={EXPORT_XML} label="Export" lang="xml" />
              </div>
            </BrowserFrame>
            {/* Real toast: bottom-center, dark bg, monospace, blur */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/12 px-4 py-2.5 font-mono text-[13px] text-white shadow-lg backdrop-blur-[12px]"
              style={{ background: "rgba(15, 15, 15, 0.92)" }}
            >
              Copied to clipboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
