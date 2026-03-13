import type * as React from "react";

import { cn } from "@/lib/utils.ts";

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "group/card flex flex-col gap-4 rounded-lg border border-border/80 bg-card p-5 text-card-foreground",
        className
      )}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-semibold text-[1.05rem] text-foreground tracking-[-0.03em]",
        className
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-sm leading-6", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-3 flex flex-col gap-4", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
