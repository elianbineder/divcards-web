import type { Metadata } from "next";
import { Suspense } from "react";
import { getExport } from "@/lib/api";
import { toSummary } from "@/lib/cards";
import { defaultReference, leagueLabel, leagueViews } from "@/lib/leagues";
import { BackButton } from "@/components/BackButton";
import { CalculatorBody, DropCalculator, type WeightedCard } from "@/components/DropCalculator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calculator",
  description: "Estimate the drop rate of every divination card from the rate of one card you farm.",
};

export default async function CalculatorPage() {
  const { meta, cards } = await getExport();
  // Non-Scryable cards drop in no atlas map: a farming method cannot target them.
  const weighted: WeightedCard[] = cards
    .filter((c) => c.enabled && c.weight && c.scryable)
    .map(toSummary)
    .map(({ slug, name, art, areas, dropLevel, weight }) => ({ slug, name, art, areas, dropLevel, weight: weight! }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const league = leagueViews(meta, cards).find((l) => l.current);
  // A default whose card is no longer in the calculator (disabled, no weight) is dropped.
  const reference = defaultReference(meta.costs?.league);
  const initial = reference && weighted.some((c) => c.slug === reference.card) ? reference : null;

  const calculator = { cards: weighted, diffs: league?.diffs ?? {}, previous: league?.previous ?? null, initial };

  return (
    <div className="flex flex-col gap-5">
      <BackButton />
      <header>
        <h1 className="font-game text-4xl">Drop rate calculator</h1>
        <p className="mt-1 text-sm text-muted">
          Weights based on {meta.costs ? leagueLabel(meta.costs.league) : "–"}, estimated from gold cost formula.
        </p>
      </header>

      <details role="note" className="group border-l-2 border-accent/70 pl-3 text-sm text-muted">
        <summary className="flex cursor-pointer list-none items-baseline gap-2 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="text-foreground">Estimates, not official data:</span> weights come from a community
            formula, not from Grinding Gear Games.
          </span>
          <span className="shrink-0 text-accent group-open:hidden">More</span>
          <span className="hidden shrink-0 text-accent group-open:inline">Less</span>
        </summary>
        <p className="mt-2 max-w-3xl leading-relaxed">
          Every calculation on this page is based on drop weights computed with a formula found by the community, so
          the results are not 100% accurate. The weights it produces are close to other community data (such as
          Stacked Deck openings), but they are not verified or provided by Grinding Gear Games: take them as estimates.
        </p>
      </details>

      {/* The inputs come from the URL, known only in the browser: the static page shows the defaults. */}
      <Suspense fallback={<CalculatorBody {...calculator} params={null} />}>
        <DropCalculator {...calculator} />
      </Suspense>
    </div>
  );
}
