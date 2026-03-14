import Link from "next/link";

export const Navbar = (): React.JSX.Element => (
  <header className="border-border border-b">
    <nav className="mx-auto flex max-w-3xl items-center px-4 py-4">
      <Link className="font-semibold" href="/">
        Style Capture
      </Link>
    </nav>
  </header>
);
