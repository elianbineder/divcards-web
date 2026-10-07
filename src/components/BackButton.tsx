"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Pages visited in this tab since the site was opened (module state survives client navigation). */
let visited = 0;

/** Counts client-side page changes, so BackButton knows whether there is a page to go back to. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visited += 1;
  }, [pathname]);
  return null;
}

/**
 * Goes back to the previous page with its filters as they were; opened directly (no
 * previous page on this site), goes to the index instead.
 */
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (visited > 1 ? router.back() : router.push("/"))}
      className="self-start text-sm text-muted hover:text-foreground"
    >
      ← Back
    </button>
  );
}
