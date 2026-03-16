import Link from "next/link";

export const Footer = (): React.JSX.Element => (
  <footer className="border-border border-t">
    <div className="mx-auto max-w-3xl px-4 py-8 text-center text-muted-foreground text-sm">
      <nav className="mb-4 flex justify-center gap-6">
        <Link
          className="transition-colors hover:text-foreground"
          href="/privacy"
        >
          Privacy
        </Link>
        <Link className="transition-colors hover:text-foreground" href="/terms">
          Terms
        </Link>
        <Link
          className="transition-colors hover:text-foreground"
          href="/support"
        >
          Support
        </Link>
        <a
          className="transition-colors hover:text-foreground"
          href="https://github.com/mblode/style-capture"
        >
          GitHub
        </a>
      </nav>
      <p>
        Created by{" "}
        <a
          className="underline underline-offset-4 transition-colors hover:text-foreground"
          href="https://matthewblode.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Matthew Blode
        </a>
      </p>
    </div>
  </footer>
);
