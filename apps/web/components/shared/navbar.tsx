"use client";

import { GithubIcon, StarIcon } from "blode-icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MorphIcon } from "@/components/ui/morph-icon";
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
          (isScrolled || menuOpen) && "border-border/40 border-b"
        )}
        data-state={menuOpen ? "active" : undefined}
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative flex flex-wrap items-center justify-between py-4 sm:gap-0">
            <div className="flex w-full justify-between gap-6 sm:w-auto sm:flex-1">
              <Link
                className="flex items-center gap-2 font-semibold tracking-[-0.02em]"
                href="/"
              >
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 1000 1000"
                >
                  <circle
                    className="fill-black dark:fill-white"
                    cx="500"
                    cy="500"
                    r="500"
                  />
                  <path
                    className="fill-white dark:fill-black"
                    d="M310.096 251.228C350.494 248.062 423.425 278.62 462.204 293.745L576.996 338.648L685.361 381.089C717.228 393.607 750.633 406.591 780.691 422.915C796.281 431.715 812.079 442.489 821.191 458.215C835.514 482.941 826.156 512.102 803.251 527.82C775.792 546.663 740.385 556.66 708.551 565.842C688.264 571.629 667.933 577.274 647.562 582.777C634.909 586.236 608.53 592.254 598.909 600.726C590.261 608.336 584.143 634.361 581.002 645.999C580.456 647.299 578.611 654.551 578.157 656.231L572.284 677.833C562.231 714.226 545.649 780.944 522.27 809.484C512.875 820.953 500.282 829.3 485.278 830.764C470.802 832.177 457.117 827.158 446.062 817.893C432.029 806.134 422.351 789.122 414.13 773.011C400.298 745.906 389.261 717.081 378.129 688.783L338.943 588.671L293.471 472.493C284.737 450.456 276.33 428.291 268.255 406.004C252.285 361.11 227.044 291.019 279.742 259.874C289.12 254.332 299.354 252.094 310.096 251.228Z"
                  />
                </svg>
                Style Capture
              </Link>

              <button
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="relative z-20 -m-2.5 -mr-4 flex min-h-11 min-w-11 cursor-pointer items-center justify-center sm:hidden"
                onClick={toggleMenu}
                type="button"
              >
                <MorphIcon
                  icon={menuOpen ? "cross" : "menu"}
                  size={24}
                  strokeWidth={1.25}
                />
              </button>
            </div>

            <div
              className={cn(
                "grid w-full transition-[grid-template-rows] duration-200 sm:flex sm:w-fit",
                menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-4 pt-4 text-sm sm:flex-row sm:items-center sm:gap-4 sm:pt-0">
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
