import { BrowserFrame } from "@/components/store/browser-frame";
import { CodeBlock } from "@/components/store/code-block";
import { Eyebrow } from "@/components/store/eyebrow";
import { Panel } from "@/components/store/panel";
import { StoreFrame } from "@/components/store/store-frame";

const COMPUTED_CSS = `[data-lc="0"] {
  display: grid;
  gap: 24px;
  padding: 32px;
  border-radius: 20px;
  background-color: #ffffff;
  box-shadow: 0 16px 32px rgba(0,0,0,.08);
  font-size: 16px;
  line-height: 1.5;
}`;

const TAILWIND_HINTS = `<tailwind_hints>
0=grid gap-6 p-8 rounded-[20px] bg-white
  shadow-[0_16px_32px_rgba(0,0,0,0.08)]
  text-base leading-normal
</tailwind_hints>`;

export default function Screenshot4Tailwind() {
  return (
    <StoreFrame>
      <BrowserFrame address="https://example.com/pricing">
        <div className="grid h-[calc(100%-67px)] grid-cols-[1.2fr_0.8fr] gap-[22px] p-[22px]">
          <div className="grid grid-rows-[auto_1fr] gap-[18px]">
            <div>
              <Eyebrow>Automatic conversion</Eyebrow>
              <h1 className="mt-3 mb-2.5 font-bold text-[44px] leading-[0.95] tracking-[-0.05em]">
                Computed CSS to Tailwind.
              </h1>
              <p className="max-w-[28ch] text-black/60 text-lg leading-[1.55]">
                Each property mapped to the closest Tailwind utility.
              </p>
            </div>

            <CodeBlock code={COMPUTED_CSS} label="Computed CSS" lang="css" />
          </div>

          <div className="grid content-start gap-4">
            <CodeBlock
              code={TAILWIND_HINTS}
              label="Tailwind hints"
              lang="xml"
            />
            <Panel>
              <h3>Confidence levels</h3>
              <ul className="mt-2.5 pl-[18px]">
                <li>Scale match — stock Tailwind tokens</li>
                <li>Arbitrary value — exact value in brackets</li>
                <li>Review needed — layout-derived values</li>
              </ul>
            </Panel>
            <Panel>
              <h3>Open questions</h3>
              <p>Layout-derived values flagged for review.</p>
            </Panel>
          </div>
        </div>
      </BrowserFrame>
    </StoreFrame>
  );
}
