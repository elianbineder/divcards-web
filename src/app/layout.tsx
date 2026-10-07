import type { Metadata } from "next";
import { Suspense } from "react";
import { API_URL, getExport, type Card, type Meta } from "@/lib/api";
import type { MapArea } from "@/lib/filters";
import { leagueViews } from "@/lib/leagues";
import { NavigationTracker } from "@/components/BackButton";
import { HeaderSearch, HeaderSearchFallback, type FilterOptions } from "@/components/HeaderSearch";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { ScrollTopButton } from "@/components/ScrollTopButton";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DivCards", template: "%s · DivCards" },
  description: "Path of Exile Divination Card Index, estimate drop rates and track weight changes across leagues.",
  icons: { icon: `${API_URL}/images/favicon.png` },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { meta, cards } = await getExport();
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preload" href="/fonts/Fontin-SmallCaps.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60 sticky top-0 z-20">
          {/* Three columns: logo, nav centred on the page, search on the right.
              Phones: logo and nav on top, search below. */}
          <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] gap-x-3 px-4 sm:h-14 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-6">
            <div className="flex h-12 items-center sm:h-auto">
              <Logo icon={meta.assets.favicon} />
            </div>
            <div className="flex h-12 justify-end sm:h-auto sm:justify-center">
              <NavLinks />
            </div>
            <div className="col-span-2 flex items-center pb-2 sm:col-span-1 sm:justify-end sm:pb-0">
              <Suspense fallback={<HeaderSearchFallback />}>
                <HeaderSearch options={filterOptions(meta, cards)} />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <SiteFooter meta={meta} />
        <NavigationTracker />
        <ScrollTopButton />
      </body>
    </html>
  );
}

function filterOptions(meta: Meta, cards: Card[]): FilterOptions {
  const tags = new Map<string, number>();
  const maps = new Map<string, MapArea>();
  for (const c of cards) {
    for (const a of c.drops.atlas) maps.set(a.id, { id: a.id, name: a.name, tier: a.tier, level: a.area_level });
    if (c.enabled) for (const t of c.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  }
  return {
    tags: [...tags].sort((a, b) => b[1] - a[1]),
    maps: [...maps.values()].sort((a, b) => a.name.localeCompare(b.name)),
    leagues: leagueViews(meta, cards).map(({ id, label, current }) => ({ id, label, current })),
  };
}
