import { BrowserFrame } from "@/components/store/browser-frame";
import { Card } from "@/components/store/card";
import { CodeBlock } from "@/components/store/code-block";
import { Metric } from "@/components/store/metric";
import { StoreFrame } from "@/components/store/store-frame";

const CAPTURE_XML = `<style_capture url="https://example.com/pricing"
mode="curated" root_ref="0" elements="5" pseudos="0">
Recreate or refactor this UI faithfully.

<html_capture>
<article class="card">...</article>
</html_capture>

<css_capture>
[data-lc="0"]{display:grid;gap:24px;border-radius:20px;
padding:32px;box-shadow:0 16px 32px rgba(0,0,0,.08)}
</css_capture>
</style_capture>`;

export default function Screenshot1Capture() {
  return (
    <StoreFrame>
      <BrowserFrame active address="https://example.com/pricing">
        <div className="grid h-[calc(100%-67px)] grid-cols-[1.2fr_0.8fr] gap-[22px] p-[22px]">
          <div className="grid grid-rows-[auto_1fr] gap-[18px]">
            <div>
              <h1 className="mt-3 mb-2.5 font-bold text-[44px] leading-[0.95] tracking-[-0.05em]">
                Click any element. Your agent gets the rest.
              </h1>
              <p className=" text-black/60 text-lg leading-[1.55]">
                Hover to select. Shift for parent, Alt for child.
              </p>
            </div>

            <Card className="p-6">
              <h2 className="mb-2 font-bold text-[28px] leading-none tracking-[-0.04em]">
                Pro plan
              </h2>
              <div className="mt-[18px] flex gap-3">
                <div className="rounded-full border border-black bg-black px-4 py-[11px] font-bold text-[13px] text-white">
                  Start trial
                </div>
                <div className="rounded-full border border-black/10 bg-white px-4 py-[11px] font-bold text-[13px]">
                  Compare plans
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric label="Gap" value="24px" />
                <Metric label="Radius" value="20px" />
                <Metric label="Shadow" value="Soft" />
              </div>
              <div
                className="absolute cursor-crosshair border border-[rgba(67,137,245,1)] bg-[rgba(67,137,245,0.08)]"
                style={{ height: 210, left: 18, right: 18, top: 18 }}
              />
              <div
                className="absolute inline-flex items-center rounded-lg bg-[#232425] px-[10px] py-1.5 font-medium text-[13px] text-white leading-4 -translate-x-1/2"
                style={{
                  filter: "drop-shadow(0px 1px 4px rgba(0, 0, 0, 0.3))",
                  left: "50%",
                  top: -20,
                }}
              >
                Copied to clipboard
              </div>
            </Card>
          </div>

          <CodeBlock
            className="h-full"
            code={CAPTURE_XML}
            label="What gets captured"
            lang="xml"
          />
        </div>
      </BrowserFrame>
    </StoreFrame>
  );
}
