import type * as React from "react";

import { cn } from "@/lib/utils.ts";

interface PageShellProps {
  children?: React.ReactNode;
  className?: string;
  title: string;
}

export function PageShell({ children, className, title }: PageShellProps) {
  return (
    <>
      <a
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-foreground focus-visible:text-sm"
        href="#main-content"
      >
        Skip to main content
      </a>
      <main
        className={cn("min-h-screen px-4 py-6 text-foreground", className)}
        id="main-content"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h1 className="font-display text-foreground text-xl leading-tight tracking-[-0.03em] sm:text-2xl">
            {title}
          </h1>
          {children}
        </div>
      </main>
    </>
  );
}
