import type * as React from "react";

import { cn } from "@/lib/utils.ts";

interface PageShellProps {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  meta?: React.ReactNode;
  title: string;
  tone?: "compact" | "wide";
}

export function PageShell({
  actions,
  children,
  className,
  description,
  eyebrow,
  meta,
  title,
  tone = "compact",
}: PageShellProps) {
  return (
    <main
      className={cn(
        "min-h-screen px-4 py-4 text-foreground",
        tone === "wide" ? "w-full" : "min-w-[360px]",
        className
      )}
      id="main-content"
    >
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm"
        href="#main-content"
      >
        Skip to main content
      </a>
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4",
          tone === "wide" ? "max-w-6xl" : "max-w-[420px]"
        )}
      >
        <header className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-glass-dim px-5 py-4 shadow-card backdrop-blur-sm">
          <div
            className={cn(
              "flex flex-col gap-4",
              tone === "wide"
                ? "lg:flex-row lg:items-start lg:justify-between"
                : "sm:flex-row sm:items-start sm:justify-between"
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold text-[0.7rem] text-primary uppercase tracking-[0.24em]">
                {eyebrow}
              </p>
              <div className="mt-2.5 space-y-2">
                <h1 className="font-display text-[2rem] text-foreground leading-none tracking-[-0.045em] sm:text-[2.35rem]">
                  {title}
                </h1>
                <p className="max-w-[58ch] text-muted-foreground text-sm leading-6">
                  {description}
                </p>
              </div>
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
          {meta ? (
            <div className="mt-4 border-border/70 border-t pt-4">{meta}</div>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}
