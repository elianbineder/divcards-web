import type { Metadata } from "next";
import { getExport } from "@/lib/api";
import { leagueViews } from "@/lib/leagues";
import { HistoryTable, type HistoryCard, type HistoryLeague } from "@/components/HistoryTable";

export const revalidate = 3600;

const LEAGUES_SHOWN = 5;

export const metadata: Metadata = {
  title: "History",
  description: "Drop weights of every divination card in the last Path of Exile leagues.",
};

export default async function HistoryPage() {
  const { meta, cards } = await getExport();
  const leagues: HistoryLeague[] = leagueViews(meta, cards)
    .slice(0, LEAGUES_SHOWN)
    .map(({ id, label, previous, weights, diffs }) => ({ id, label, previous, weights, diffs }));

  // Every card that had a weight in one of these leagues.
  const rows: HistoryCard[] = cards
    .filter((c) => leagues.some((l) => c.slug in l.weights))
    .map((c) => ({ slug: c.slug, name: c.text.name, art: c.art }));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-game text-4xl">Weight history</h1>
        <p className="mt-1 text-sm text-muted">
          Drop weights of every card in the last {leagues.length === 1 ? "league" : `${leagues.length} leagues`},
          estimated from Faustus gold costs. Changes are against the previous league.
        </p>
      </header>
      <HistoryTable leagues={leagues} cards={rows} />
    </div>
  );
}
