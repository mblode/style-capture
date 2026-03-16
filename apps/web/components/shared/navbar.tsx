"use client";

import {
  BarsThreeIcon,
  CrossLargeIcon,
  GithubIcon,
  StarIcon,
} from "blode-icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    external: true,
    href: "https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd",
    label: "Extension",
  },
  {
    external: true,
    href: "https://www.npmjs.com/package/style-capture",
    label: "CLI",
  },
  { external: false, href: "/skills", label: "Skills" },
];

const linkClassName =
  "text-muted-foreground transition-colors hover:text-foreground";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        className={cn(
          "fixed z-20 w-full bg-background/80 backdrop-blur-lg transition-[border-color,background-color,backdrop-filter] duration-300",
          isScrolled && "border-border/40 border-b"
        )}
        data-state={menuOpen ? "active" : undefined}
      >
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-4 sm:gap-0">
            <div className="flex w-full justify-between gap-6 sm:w-auto sm:flex-1">
              <Link className="font-semibold tracking-[-0.02em]" href="/">
                Style Capture
              </Link>

              <button
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 sm:hidden"
                onClick={toggleMenu}
                type="button"
              >
                <BarsThreeIcon
                  aria-hidden="true"
                  className={cn(
                    "m-auto size-6 transition-[transform,opacity] duration-200",
                    menuOpen && "rotate-180 scale-0 opacity-0"
                  )}
                />
                <CrossLargeIcon
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 transition-[transform,opacity] duration-200",
                    menuOpen && "rotate-0 scale-100 opacity-100"
                  )}
                />
              </button>
            </div>

            <div
              className={cn(
                "mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-background p-6 shadow-2xl shadow-zinc-300/20 dark:shadow-zinc-900/40 sm:m-0 sm:flex sm:w-fit sm:gap-4 sm:space-y-0 sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none",
                menuOpen && "block"
              )}
            >
              <div className="flex w-full flex-col gap-4 text-sm sm:w-fit sm:flex-row sm:items-center">
                {navLinks.map((link) =>
                  link.external ? (
                    <a
                      className={linkClassName}
                      href={link.href}
                      key={link.href}
                      onClick={closeMenu}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      className={linkClassName}
                      href={link.href}
                      key={link.href}
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:justify-end">
              <Button
                render={
                  // eslint-disable-next-line jsx-a11y/anchor-has-content -- content provided by Button children via base-ui render prop
                  <a
                    href="https://github.com/mblode/style-capture"
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                }
                size="sm"
                variant="outline"
                onClick={closeMenu}
              >
                <GithubIcon data-icon="inline-start" />
                Star on GitHub
                <StarIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
