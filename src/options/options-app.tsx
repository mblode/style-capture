import BubbleAlertIcon from "blode-icons-react/icons/bubble-alert";
import CircleCheckFilledIcon from "blode-icons-react/icons/circle-check-filled";
import SettingsSliderThreeIcon from "blode-icons-react/icons/settings-slider-three";
import React from "react";

import { PageShell } from "@/components/page-shell.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { getSettings, saveSettings } from "@/lib/storage.ts";
import type { CaptureSettings } from "@/lib/types.ts";
import { cn } from "@/lib/utils.ts";

type SaveState = "error" | "idle" | "saved" | "saving";

const SAVE_STATE_COPY: Record<SaveState, string> = {
  error: "Settings could not be saved. Try again.",
  idle: "Changes are stored in chrome.storage.local.",
  saved: "Settings saved to chrome.storage.local.",
  saving: "Saving settings...",
};

export function OptionsApp(): React.JSX.Element {
  const [settings, setSettings] = React.useState<CaptureSettings | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = React.useState(SAVE_STATE_COPY.idle);

  React.useEffect(() => {
    getSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        setSaveState("idle");
        setSaveMessage(SAVE_STATE_COPY.idle);
      })
      .catch(() => {
        setSaveState("error");
        setSaveMessage("Settings could not be loaded.");
      });
  }, []);

  async function updateSetting<Key extends keyof CaptureSettings>(
    key: Key,
    value: CaptureSettings[Key]
  ): Promise<void> {
    if (!settings) {
      return;
    }

    const previousSettings = settings;
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(nextSettings);
    setSaveState("saving");
    setSaveMessage(SAVE_STATE_COPY.saving);

    try {
      await saveSettings(nextSettings);
      setSaveState("saved");
      setSaveMessage(SAVE_STATE_COPY.saved);
    } catch {
      setSettings(previousSettings);
      setSaveState("error");
      setSaveMessage(SAVE_STATE_COPY.error);
    }
  }

  function handleCaptureModeChange(mode: CaptureSettings["captureMode"]): void {
    updateSetting("captureMode", mode).catch(() => undefined);
  }

  function handlePseudoElementsChange(value: boolean): void {
    updateSetting("includePseudoElements", value).catch(() => undefined);
  }

  function handleHiddenElementsChange(value: boolean): void {
    updateSetting("includeHiddenElements", value).catch(() => undefined);
  }

  if (!settings) {
    return (
      <PageShell
        description="Loading your extension defaults."
        eyebrow="Settings"
        title="Tune capture defaults."
      >
        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Skeleton className="h-4 w-24" />
                <div className="grid gap-3 lg:grid-cols-2">
                  <Skeleton className="h-28 rounded-[calc(var(--radius)+0.125rem)]" />
                  <Skeleton className="h-28 rounded-[calc(var(--radius)+0.125rem)]" />
                </div>
              </div>
              <div className="grid gap-3">
                <Skeleton className="h-20 rounded-[calc(var(--radius)+0.125rem)]" />
                <Skeleton className="h-20 rounded-[calc(var(--radius)+0.125rem)]" />
                <Skeleton className="h-20 rounded-[calc(var(--radius)+0.125rem)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 rounded-[calc(var(--radius)+0.125rem)]" />
              <Skeleton className="h-20 rounded-[calc(var(--radius)+0.125rem)]" />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      actions={<SaveStateBadge state={saveState} />}
      description="Choose how much CSS to snapshot and how quickly the extension should move you from capture to review."
      eyebrow="Settings"
      meta={
        <div className="grid gap-2 text-muted-foreground text-xs leading-5 sm:grid-cols-2">
          <p>
            Curated mode keeps the payload tighter for Tailwind mapping and
            manual review.
          </p>
          <p>
            Full mode is better when you need every computed property for
            debugging or audits.
          </p>
        </div>
      }
      title="Tune capture defaults."
      tone="wide"
    >
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capture profile</CardTitle>
            <CardDescription>
              Pick the default shape of the payload, then decide how much extra
              context to retain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset className="grid gap-4">
              <legend className="font-semibold text-foreground text-sm">
                Capture mode
              </legend>
              <p className="text-muted-foreground text-sm leading-6">
                Start with the curated profile for everyday mapping work. Switch
                to full only when you need exhaustive debugging detail.
              </p>
              <div
                aria-label="Capture mode"
                className="grid gap-3 lg:grid-cols-2"
                role="radiogroup"
              >
                <CaptureModeOption
                  checked={settings.captureMode === "curated"}
                  description="Longhand properties that map cleanly to spacing, color, typography, and layout utilities."
                  id="capture-mode-curated"
                  label="Curated"
                  name="capture-mode"
                  onChange={() => handleCaptureModeChange("curated")}
                />
                <CaptureModeOption
                  checked={settings.captureMode === "full"}
                  description="Every available computed property for the selected subtree, including noisier detail."
                  id="capture-mode-full"
                  label="Full dump"
                  name="capture-mode"
                  onChange={() => handleCaptureModeChange("full")}
                />
              </div>
            </fieldset>

            <div className="grid gap-3">
              <ToggleRow
                checked={settings.includePseudoElements}
                description="Include ::before and ::after when they render meaningful styles."
                id="include-pseudo-elements"
                label="Pseudo-elements"
                onCheckedChange={handlePseudoElementsChange}
              />
              <ToggleRow
                checked={settings.includeHiddenElements}
                description="Include nodes with display:none or visibility:hidden inside the selected subtree."
                id="include-hidden-elements"
                label="Hidden elements"
                onCheckedChange={handleHiddenElementsChange}
              />
            </div>

            <output
              aria-atomic="true"
              aria-live="polite"
              className={cn(
                "rounded-[calc(var(--radius)+0.125rem)] border p-4 text-sm leading-6",
                saveState === "error"
                  ? "border-amber-200/80 bg-amber-50 text-amber-950"
                  : "border-border/80 bg-muted/50 text-muted-foreground"
              )}
            >
              <div className="flex items-start gap-3">
                {saveState === "error" ? (
                  <BubbleAlertIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-amber-700"
                  />
                ) : (
                  <CircleCheckFilledIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                )}
                <p>{saveMessage}</p>
              </div>
            </output>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow notes</CardTitle>
            <CardDescription>
              Keep the surrounding workflow predictable while you tune the
              capture payload.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-6">
            <div className="rounded-[calc(var(--radius)+0.125rem)] border border-border/80 bg-muted/45 p-4">
              <p className="font-semibold text-[0.68rem] text-primary uppercase tracking-[0.18em]">
                Recommended default
              </p>
              <p className="mt-2">
                Use curated mode with pseudo-elements on. That usually keeps the
                payload reviewable without losing layout or decorative context.
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.125rem)] border border-border/80 bg-glass-dim p-4">
              <p className="font-semibold text-foreground">Quality gates</p>
              <p className="mt-2">
                `npm run lint` checks formatting and import hygiene.
              </p>
              <p>`npm run check-types` verifies every extension entrypoint.</p>
              <p>`npm run build` produces the MV3 bundle for Chrome.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

interface ToggleRowProps {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onCheckedChange: (value: boolean) => void;
}

function ToggleRow({
  checked,
  description,
  id,
  label,
  onCheckedChange,
}: ToggleRowProps): React.JSX.Element {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: click delegates to the embedded Switch which provides full keyboard access
    // biome-ignore lint/a11y/noStaticElementInteractions: click delegates to the embedded Switch which provides full keyboard access
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard access is provided by the embedded Switch
    <div
      className={cn(
        "grid cursor-pointer gap-4 rounded-[calc(var(--radius)+0.125rem)] border p-4 transition-colors sm:grid-cols-[1fr_auto] sm:items-start",
        checked
          ? "border-primary/35 bg-accent/55"
          : "border-border/80 bg-glass-dim"
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-sm" id={labelId}>
          {label}
        </p>
        <p
          className="text-muted-foreground text-sm leading-6"
          id={descriptionId}
        >
          {description}
        </p>
      </div>
      <Switch
        aria-describedby={descriptionId}
        aria-labelledby={labelId}
        checked={checked}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

interface CaptureModeOptionProps {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  name: string;
  onChange: () => void;
}

function CaptureModeOption({
  checked,
  description,
  id,
  label,
  name,
  onChange,
}: CaptureModeOptionProps): React.JSX.Element {
  return (
    <label
      className={cn(
        "grid cursor-pointer gap-3 rounded-[calc(var(--radius)+0.125rem)] border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60 has-[:focus-visible]:ring-offset-2",
        checked
          ? "border-primary/35 bg-accent/60"
          : "border-border/80 bg-glass-dim"
      )}
      htmlFor={id}
    >
      <input
        checked={checked}
        className="sr-only"
        id={id}
        name={name}
        onChange={onChange}
        type="radio"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-foreground text-sm">{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            "size-3 rounded-full border transition-colors",
            checked
              ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(65,167,150,0.14)]"
              : "border-border bg-card"
          )}
        />
      </div>
      <p className="text-muted-foreground text-sm leading-6">{description}</p>
    </label>
  );
}

const SAVE_STATE_BADGE_COPY: Record<SaveState, string> = {
  error: "Save issue",
  idle: "Ready",
  saved: "Saved",
  saving: "Saving",
};

const SAVE_STATE_VARIANT: Record<
  SaveState,
  "outline" | "secondary" | "success" | "warning"
> = {
  error: "warning",
  idle: "outline",
  saved: "success",
  saving: "secondary",
};

function SaveStateBadge({ state }: { state: SaveState }): React.JSX.Element {
  return (
    <Badge
      className="gap-2 px-3 py-1 font-semibold text-[0.66rem] uppercase tracking-[0.18em]"
      variant={SAVE_STATE_VARIANT[state]}
    >
      <SettingsSliderThreeIcon data-icon="inline-start" />
      {SAVE_STATE_BADGE_COPY[state]}
    </Badge>
  );
}
