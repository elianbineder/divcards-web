"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Index" },
  { href: "/calculator", label: "Calculator" },
  { href: "/history", label: "History" },
];

/** Header navigation; the current page is underlined in gold. Card pages belong to Index. */
export function NavLinks() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/cards/") : path.startsWith(href));
  return (
    <nav className="flex h-full shrink-0 gap-3.5 text-[13px] sm:gap-5 sm:text-sm">
      {LINKS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center border-b-2 pt-0.5 transition-colors ${
              active ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
