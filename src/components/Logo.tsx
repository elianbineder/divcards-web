import Link from "next/link";

/** Card icon and the "DivCards" wordmark between two golden rules. */
export function Logo({ icon }: { icon: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 justify-self-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={32} height={32} className="h-8 w-8" />
      <span aria-hidden className="hidden h-px w-5 bg-gradient-to-r from-transparent to-accent sm:block" />
      <span className="logo-text font-game text-xl tracking-wide sm:text-2xl">DivCards</span>
      <span aria-hidden className="hidden h-px w-5 bg-gradient-to-l from-transparent to-accent sm:block" />
    </Link>
  );
}
