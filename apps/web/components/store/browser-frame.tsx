import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrowserFrame({
  active = false,
  address,
  badge,
  children,
  className,
}: {
  active?: boolean;
  address: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative size-full overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_22px_64px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      <div className="flex items-center gap-4 border-black/10 border-b bg-[#fafafa] px-[22px] py-4">
        <div className="flex gap-2">
          <span className="size-2.5 rounded-full bg-black/15" />
          <span className="size-2.5 rounded-full bg-black/15" />
          <span className="size-2.5 rounded-full bg-black/15" />
        </div>
        <div className="flex-1 rounded-full border border-black/6 bg-black/[0.04] px-4 py-[11px] text-black/60 text-sm">
          {address}
        </div>
        {badge && <Badge>{badge}</Badge>}
        <Image
          alt=""
          className="size-5 shrink-0"
          height={20}
          src={active ? "/store-icon-active.png" : "/store-icon.png"}
          width={20}
        />
      </div>
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-black/5 px-3 py-2 font-bold text-black text-xs",
        className
      )}
    >
      {children}
    </div>
  );
}
