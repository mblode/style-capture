import Link from "next/link";

const navLinks = [
  { href: "/#extension", label: "Extension" },
  { href: "/#skills", label: "Skills" },
  { href: "/#cli", label: "CLI" },
];

export const Navbar = (): React.JSX.Element => (
  <header className="border-border border-b">
    <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
      <Link className="font-semibold" href="/">
        Style Capture
      </Link>
      <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
        {navLinks.map((link) => (
          <Link
            className="transition-colors hover:text-foreground"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  </header>
);
