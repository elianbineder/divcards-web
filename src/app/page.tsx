import { Suspense } from "react";
import { getExport } from "@/lib/api";
import { toSummary } from "@/lib/cards";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { leagueViews } from "@/lib/leagues";
import { Gallery, GalleryView } from "@/components/Gallery";

export const revalidate = 3600;

export default async function Home() {
  const { meta, cards } = await getExport();
  const props = { cards: cards.map(toSummary), frame: meta.assets.frame, leagues: leagueViews(meta, cards) };
  // The filters come from the URL, known only in the browser: the static page shows every card.
  return (
    <Suspense fallback={<GalleryView {...props} filters={DEFAULT_FILTERS} />}>
      <Gallery {...props} />
    </Suspense>
  );
}
