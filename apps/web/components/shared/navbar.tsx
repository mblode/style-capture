import Link from "next/link";

const navLinks = [
  {
    href: "https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd",
    label: "Extension",
  },
  {
    href: "https://skills.sh/mblode/style-capture/style-capture",
    label: "Skills",
  },
  { href: "https://www.npmjs.com/package/style-capture", label: "CLI" },
];

export const Navbar = (): React.JSX.Element => (
  <header className="border-border border-b">
    <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
      <Link className="font-semibold" href="/">
        Style Capture
      </Link>
      <div className="ml-auto hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
        {navLinks.map((link) => (
          <a
            className="transition-colors hover:text-foreground"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  </header>
);
