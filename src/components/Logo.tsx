"use client";

import Link from "next/link";

/** Event telling the index to go back to its first batch of cards (see Gallery). */
export const HOME_EVENT = "divcards:home";

/** Card icon and the "DivCards" wordmark between two golden rules. */
export function Logo({ icon }: { icon: string }) {
  return (
    <Link
      href="/"
      onClick={() => {
        // Already on the index: the link alone changes nothing, so reset the list and go up.
        if (window.location.pathname === "/") {
          window.dispatchEvent(new Event(HOME_EVENT));
          window.scrollTo({ top: 0 });
        }
      }}
      className="flex shrink-0 items-center gap-2 justify-self-start"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={32} height={32} className="h-8 w-8" />
      <span aria-hidden className="hidden h-px w-5 bg-gradient-to-r from-transparent to-accent sm:block" />
      {/* Below 360px the header has no room for the wordmark next to the navigation: icon only. */}
      <span className="logo-text font-game text-xl tracking-wide max-[359px]:sr-only sm:text-2xl">DivCards</span>
      <span aria-hidden className="hidden h-px w-5 bg-gradient-to-l from-transparent to-accent sm:block" />
    </Link>
  );
}
