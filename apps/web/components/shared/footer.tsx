import Link from "next/link";

import { version } from "@/package.json";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export const Footer = (): React.JSX.Element => (
  <footer className="flex flex-col items-center justify-center gap-2 pt-16 pb-8 text-muted-foreground text-sm">
    <nav className="flex items-center gap-4">
      {footerLinks.map((link) => (
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
    <div className="flex items-center gap-1">
      Crafted by
      <a
        className="flex items-center gap-2 rounded-full py-1.5 pr-2.5 pl-1.5 transition-colors hover:text-foreground"
        href="https://blode.co"
        rel="author"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted 20px avatar, plain img avoids next/image overhead */}
        <img
          alt="Matthew Blode"
          className="rounded-full"
          height={20}
          loading="lazy"
          src="/style-capture/avatar-sm.png"
          width={20}
        />
        Matthew Blode
      </a>
    </div>
    <div className="flex items-center gap-2 text-muted-foreground/30">
      <span className="text-muted-foreground">v{version}</span> &bull;
      {/* The edge back to the hub: same origin behind a rewrite, so same tab
          and no rel. See blode-co/apps/web/.claude/knowledge/zone-conventions.md. */}
      <a
        className="text-muted-foreground transition-colors hover:text-foreground"
        href="https://blode.co/projects"
      >
        All projects
      </a>{" "}
      &bull;
      <a
        className="text-muted-foreground transition-colors hover:text-foreground"
        href="https://github.com/mblode/style-capture"
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub
      </a>
    </div>
  </footer>
);
