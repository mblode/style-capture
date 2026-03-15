import { BrowserFrame } from "@/components/store/browser-frame";
import { Panel } from "@/components/store/panel";
import { StoreFrame } from "@/components/store/store-frame";

export default function Screenshot3Settings() {
  return (
    <StoreFrame>
      <BrowserFrame address="chrome-extension://style-capture/options.html">
        <div className="grid h-[calc(100%-67px)] grid-cols-[1.2fr_0.8fr] gap-[22px] p-[22px]">
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-md flex-col gap-4">
              <h1 className="font-bold text-xl tracking-[-0.03em]">Settings</h1>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-3 rounded-md border border-black/20 bg-black/[0.03] p-4">
                  <span className="font-medium text-sm">Curated</span>
                  <div className="flex size-5 items-center justify-center rounded-full border-2 border-black">
                    <div className="size-2.5 rounded-full bg-black" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border border-black/10 bg-black/[0.02] p-4">
                  <span className="font-medium text-sm">Full dump</span>
                  <div className="size-5 rounded-full border-2 border-black/20" />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-md border border-black/20 bg-black/[0.03] p-4">
                  <span className="font-medium text-sm">Pseudo-elements</span>
                  <div className="relative h-6 w-11 rounded-full bg-black">
                    <span className="absolute top-0.5 left-[22px] size-5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border border-black/20 bg-black/[0.03] p-4">
                  <span className="font-medium text-sm">Hidden elements</span>
                  <div className="relative h-6 w-11 rounded-full bg-black">
                    <span className="absolute top-0.5 left-[22px] size-5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid content-center gap-4">
            <Panel>
              <h3>Predictable</h3>
              <p>Settings apply on next capture.</p>
            </Panel>
            <Panel>
              <ul className="pl-[18px]">
                <li>Curated mode for Tailwind mapping</li>
                <li>Pseudo-elements on</li>
                <li>Hidden elements off</li>
              </ul>
            </Panel>
            <Panel>
              <h3>No account</h3>
              <p>No sign-in required.</p>
            </Panel>
          </div>
        </div>
      </BrowserFrame>
    </StoreFrame>
  );
}
