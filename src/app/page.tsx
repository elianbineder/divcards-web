import { getExport } from "@/lib/api";
import { toSummary } from "@/lib/cards";
import { leagueViews } from "@/lib/leagues";
import { Gallery } from "@/components/Gallery";

export const revalidate = 3600;

export default async function Home() {
  const { meta, cards } = await getExport();
  return <Gallery cards={cards.map(toSummary)} frame={meta.assets.frame} leagues={leagueViews(meta, cards)} />;
}
