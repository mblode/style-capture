import { BrowserFrame } from "@/components/store/browser-frame";
import { CodeBlock } from "@/components/store/code-block";
import { Panel } from "@/components/store/panel";
import { StoreFrame } from "@/components/store/store-frame";

const CLIPBOARD_XML = `<style_capture url="https://example.com/hero"
mode="curated" root_ref="0" root_selector="#hero"
elements="8" pseudos="2">
Recreate or refactor this UI faithfully.
html_capture + css_capture are ground truth.

<tailwind_hints>
0=rounded-[20px] px-8 py-7 shadow-sm
1=text-[2rem] tracking-[-0.05em]
2=inline-flex items-center gap-3 rounded-full
</tailwind_hints>

<open_questions>
0:Width looks layout-derived. Confirm responsive intent.
</open_questions>
</style_capture>`;

export default function Screenshot2Export() {
  return (
    <StoreFrame>
      <BrowserFrame address="https://example.com/hero">
        <div className="grid h-[calc(100%-67px)] grid-cols-[1.2fr_0.8fr] gap-[22px] p-[22px]">
          <div className="grid grid-rows-[auto_1fr] gap-[18px]">
            <div>
              <h1 className="mt-3 mb-2.5 font-bold text-[44px] leading-[0.95] tracking-[-0.05em]">
                CSS truth, Tailwind hints, fewer guesses.
              </h1>
              <p className="max-w-[28ch] text-black/60 text-lg leading-[1.55]">
                Computed CSS as ground truth. Tailwind suggestions where they
                fit.
              </p>
            </div>

            <div className="grid content-start gap-4">
              <Panel>
                <h3>Every export includes</h3>
                <ul className="mt-2.5 pl-[18px]">
                  <li>Sanitized subtree HTML</li>
                  <li>Computed CSS grouped by element</li>
                  <li>Tailwind mapping hints</li>
                  <li>Open questions for ambiguous values</li>
                </ul>
              </Panel>
              <Panel>
                <h3>Local-only</h3>
                <p>Runs locally. Nothing leaves your device.</p>
              </Panel>
            </div>
          </div>

          <CodeBlock
            className="h-full"
            code={CLIPBOARD_XML}
            label="Clipboard output"
            lang="xml"
          />
        </div>
      </BrowserFrame>
    </StoreFrame>
  );
}
