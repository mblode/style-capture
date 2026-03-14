import BubbleAlertIcon from "blode-icons-react/icons/bubble-alert";
import React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { getSettings, saveSettings } from "@/lib/storage.ts";
import type { CaptureSettings } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main
    className="min-h-screen bg-background px-4 py-6 text-foreground"
    id="main-content"
  >
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="font-display text-foreground text-xl tracking-[-0.03em]">
        Settings
      </h1>
      {children}
    </div>
  </main>
);

const ToggleRow = ({
  checked,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  id: string;
  label: string;
  onCheckedChange: (value: boolean) => void;
}) => (
  <label
    className={cn(
      "flex cursor-pointer items-center justify-between gap-4 rounded-md border p-4 transition-[background-color,border-color]",
      checked
        ? "border-primary/30 bg-accent/50"
        : "border-border/60 bg-muted/30 hover:bg-muted/50"
    )}
    htmlFor={id}
  >
    <span className="font-medium text-sm">{label}</span>
    <Switch checked={checked} id={id} onCheckedChange={onCheckedChange} />
  </label>
);

const RadioOption = ({ label, value }: { label: string; value: string }) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: RadioGroupItem (Base UI Radio) is an embedded input control
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border p-4 transition-[background-color,border-color] has-data-checked:border-primary/30 has-data-unchecked:border-border/60 has-data-checked:bg-accent/50 has-data-unchecked:bg-muted/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60 has-[:focus-visible]:ring-offset-2 has-data-unchecked:hover:bg-muted/50">
    <span className="font-medium text-sm">{label}</span>
    <RadioGroupItem value={value} />
  </label>
);

export const OptionsApp = (): React.JSX.Element => {
  const [settings, setSettings] = React.useState<CaptureSettings | null>(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const loaded = await getSettings();
        setSettings(loaded);
      } catch {
        setLoadError(true);
      }
    })();
  }, []);

  const updateSetting = React.useCallback(
    async <Key extends keyof CaptureSettings>(
      key: Key,
      value: CaptureSettings[Key]
    ): Promise<void> => {
      if (!settings) {
        return;
      }

      const prev = settings;
      setSettings({ ...settings, [key]: value });

      try {
        await saveSettings({ ...settings, [key]: value });
      } catch {
        setSettings(prev);
      }
    },
    [settings]
  );

  const handleCaptureModeChange = React.useCallback(
    async (v: string) => {
      if (v === "curated" || v === "full") {
        try {
          await updateSetting("captureMode", v);
        } catch {
          // noop
        }
      }
    },
    [updateSetting]
  );

  const handlePseudoChange = React.useCallback(
    async (v: boolean) => {
      try {
        await updateSetting("includePseudoElements", v);
      } catch {
        // noop
      }
    },
    [updateSetting]
  );

  const handleHiddenChange = React.useCallback(
    async (v: boolean) => {
      try {
        await updateSetting("includeHiddenElements", v);
      } catch {
        // noop
      }
    },
    [updateSetting]
  );

  if (!settings) {
    if (!loadError) {
      return <div />;
    }

    return (
      <Shell>
        <Alert variant="destructive">
          <BubbleAlertIcon aria-hidden="true" />
          <AlertDescription>
            Settings could not be loaded. Try reloading the page.
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  return (
    <Shell>
      <RadioGroup
        className="grid gap-3 sm:grid-cols-2"
        onValueChange={handleCaptureModeChange}
        value={settings.captureMode}
      >
        <RadioOption label="Curated" value="curated" />
        <RadioOption label="Full dump" value="full" />
      </RadioGroup>

      <div className="grid gap-3">
        <ToggleRow
          checked={settings.includePseudoElements}
          id="pseudo-elements"
          label="Pseudo-elements"
          onCheckedChange={handlePseudoChange}
        />
        <ToggleRow
          checked={settings.includeHiddenElements}
          id="hidden-elements"
          label="Hidden elements"
          onCheckedChange={handleHiddenChange}
        />
      </div>
    </Shell>
  );
};
