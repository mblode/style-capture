import { Badge, BrowserFrame } from "@/components/store/browser-frame";
import { Card } from "@/components/store/card";
import { CodeBlock } from "@/components/store/code-block";
import { Eyebrow } from "@/components/store/eyebrow";
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
              <Eyebrow>Live page selection</Eyebrow>
              <h1 className="mt-3 mb-2.5 font-bold text-[44px] leading-[0.95] tracking-[-0.05em]">
                Pick the exact subtree you want.
              </h1>
              <p className="max-w-[28ch] text-black/60 text-lg leading-[1.55]">
                Hover to select. Shift for parent, Alt for child.
              </p>
            </div>

            <Card className="p-6">
              <Badge>Sample page</Badge>
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
                className="absolute border border-black/50 bg-black/[0.08]"
                style={{ height: 194, left: 18, top: 82, width: 364 }}
              />
              <div
                className="absolute flex items-center gap-1 rounded-[10px] bg-white px-2 py-1.5 font-medium text-[13px] leading-4"
                style={{
                  filter: "drop-shadow(0px 1px 2px rgba(81, 81, 81, 0.25))",
                  left: 100,
                  top: 42,
                }}
              >
                <span className="text-black/50">
                  section.pricing &gt; article.card
                </span>
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
