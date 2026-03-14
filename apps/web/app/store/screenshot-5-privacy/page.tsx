import { Badge, BrowserFrame } from "@/components/store/browser-frame";
import { Card } from "@/components/store/card";
import { Eyebrow } from "@/components/store/eyebrow";
import { Panel } from "@/components/store/panel";
import { StoreFrame } from "@/components/store/store-frame";

function PermissionRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-black/10 bg-[#fafafa] px-4 py-3.5">
      <div>
        <strong>{title}</strong>
        <div className="text-[#666] text-sm">{description}</div>
      </div>
      <Badge>Required</Badge>
    </div>
  );
}

export default function Screenshot5Privacy() {
  return (
    <StoreFrame>
      <BrowserFrame
        address="chrome-extension://style-capture"
        badge="Privacy-first design"
      >
        <div className="p-7">
          <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-[18px]">
            <Card className="p-[22px]">
              <Eyebrow>Security</Eyebrow>
              <h2 className="mb-2 font-bold text-2xl tracking-[-0.04em]">
                Minimal permissions, local-only.
              </h2>
              <p className="max-w-[42ch] text-[#666] text-base leading-[1.55]">
                Smallest permission set. No data leaves your device.
              </p>
              <div className="mt-[22px] grid gap-4">
                <PermissionRow
                  description="Current tab only, after you click"
                  title="activeTab"
                />
                <PermissionRow
                  description="Injects picker on demand"
                  title="scripting"
                />
                <PermissionRow
                  description="Local settings storage"
                  title="storage"
                />
              </div>
            </Card>

            <div className="grid content-start gap-4">
              <Panel>
                <h3>Local-only</h3>
                <p>Everything runs on your device. Nothing uploaded.</p>
              </Panel>
              <Panel>
                <h3>No host permissions</h3>
                <p>Only sees a page when you click the toolbar icon.</p>
              </Panel>
              <Panel>
                <h3>Sanitized output</h3>
                <ul className="mt-2.5 pl-[18px]">
                  <li>Form values stripped</li>
                  <li>Event handlers removed</li>
                  <li>URL attributes excluded</li>
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </StoreFrame>
  );
}
