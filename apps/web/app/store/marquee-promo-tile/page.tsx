import { BrowserFrame } from "@/components/store/browser-frame";
import { Card } from "@/components/store/card";
import { CodeBlock } from "@/components/store/code-block";
import { Eyebrow } from "@/components/store/eyebrow";

const EXPORT_XML = `<style_capture ...>
<tailwind_hints>
0=rounded-[20px] px-8 py-7
1=text-[2rem] tracking-[-0.05em]
</tailwind_hints>`;

export default function MarqueePromoTile() {
  return (
    <div className="grid size-full place-items-center bg-[#f8f8f8] p-6">
      <div className="relative size-full overflow-hidden rounded-[28px] border border-black/8 bg-white px-[38px] py-[34px] shadow-[0_20px_48px_rgba(0,0,0,0.08)]">
        <div className="grid size-full grid-cols-[0.95fr_1.05fr] gap-6">
          <div>
            <Eyebrow>Style Capture</Eyebrow>
            <h1 className="mt-3.5 mb-3 font-bold text-[64px] leading-[0.92] tracking-[-0.06em]">
              Computed CSS from the live page.
            </h1>
            <p className="max-w-[28ch] text-[22px] text-black/60 leading-[1.45]">
              Capture a DOM subtree. Export computed CSS with Tailwind hints.
            </p>
            <ol className="mt-5 flex flex-col gap-2 text-[15px] text-black/60">
              <li className="flex gap-2.5">
                <span className="font-bold text-black">1.</span> Local-only
                processing
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-black">2.</span> Clipboard-first
                flow
              </li>
              <li className="flex gap-2.5">
                <span className="font-bold text-black">3.</span> No persistent
                host permissions
              </li>
            </ol>
          </div>

          <div className="relative h-full">
            <BrowserFrame
              address="https://example.com/card"
              badge=""
              className="h-full rounded-3xl"
            >
              <div className="grid h-[calc(100%-67px)] grid-cols-[0.95fr_1.05fr] gap-[18px] p-[18px]">
                <Card className="p-6">
                  <Eyebrow>Selection</Eyebrow>
                  <h2 className="mb-2 font-bold text-[28px] leading-none tracking-[-0.04em]">
                    Hero card
                  </h2>
                  <p className="text-[15px] text-black/60">
                    Layout and spacing from one click.
                  </p>
                  <div
                    className="absolute border border-[rgba(67,137,245,1)] bg-[rgba(67,137,245,0.08)]"
                    style={{ height: 152, left: 16, right: 16, top: 108 }}
                  />
                </Card>
                <CodeBlock code={EXPORT_XML} label="Export" lang="xml" />
              </div>
            </BrowserFrame>
            {/* Real toast: bottom-center, dark bg, monospace, blur */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/12 px-4 py-2.5 font-mono text-[13px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px]"
              style={{ background: "rgba(15, 15, 15, 0.92)" }}
            >
              Copied prompt to clipboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
