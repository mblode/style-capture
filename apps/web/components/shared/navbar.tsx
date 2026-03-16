import { GithubIcon, StarIcon } from "blode-icons-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const navLinks = [
  {
    external: true,
    href: "https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd",
    label: "Extension",
  },
  { external: false, href: "/skills", label: "Skills" },
  {
    external: true,
    href: "https://www.npmjs.com/package/style-capture",
    label: "CLI",
  },
];

const linkClassName = "transition-colors hover:text-foreground";

export const Navbar = (): React.JSX.Element => (
  <header className="border-border border-b">
    <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
      <Link className="font-semibold" href="/">
        Style Capture
      </Link>
      <div className="ml-auto hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
        {navLinks.map((link) =>
          link.external ? (
            <a className={linkClassName} href={link.href} key={link.href}>
              {link.label}
            </a>
          ) : (
            <Link className={linkClassName} href={link.href} key={link.href}>
              {link.label}
            </Link>
          )
        )}
        <Button asChild size="sm" variant="outline">
          <a href="https://github.com/mblode/style-capture">
            <GithubIcon data-icon="inline-start" />
            Star on GitHub
            <StarIcon data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </nav>
  </header>
);
