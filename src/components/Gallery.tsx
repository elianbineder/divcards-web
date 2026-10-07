"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { formatWeight, rarity, type CardSummary, type SortKey } from "@/lib/cards";
import { DEFAULT_FILTERS, activeFilterCount, filtersToQuery, mapAreaLevel, type Filters } from "@/lib/filters";
import type { LeagueView, WeightDiff } from "@/lib/leagues";
import { DivCard } from "./DivCard";
import { HOME_EVENT } from "./Logo";
import { useFilters } from "./useFilters";
import { WeightDiffBadge } from "./WeightDiffBadge";

interface GalleryProps {
  cards: CardSummary[];
  frame: string;
  /** Newest first; the current league is the one with `current`. */
  leagues: LeagueView[];
}

/** The card grid with the filters of the URL (set from the header search and Filters menu). */
export function Gallery(props: GalleryProps) {
  const [filters, setFilters] = useFilters();
  return (
    <GalleryView
      {...props}
      filters={filters}
      onReset={() => setFilters({ ...DEFAULT_FILTERS, q: filters.q, sort: filters.sort, league: filters.league })}
    />
  );
}

/** The grid for given filters; rendered with the defaults before the URL is known. */
export function GalleryView({
  cards: allCards,
  frame,
  leagues,
  filters: f,
  onReset,
}: GalleryProps & { filters: Filters; onReset?: () => void }) {
  const q = useDeferredValue(f.q.trim().toLowerCase());

  // Weights of the chosen league; a past league only lists the cards it had a cost for.
  const league = leagues.find((l) => l.id === f.league) ?? leagues.find((l) => l.current) ?? null;
  const cards = useMemo(() => {
    if (!league || league.current) return allCards;
    return allCards.filter((c) => c.slug in league.weights).map((c) => ({ ...c, weight: league.weights[c.slug] }));
  }, [allCards, league]);

  // A map id the data does not know (edited URL) is ignored, like in the Filters menu.
  const knownMap = useMemo(() => !f.map || allCards.some((c) => c.areas.some((a) => a.id === f.map)), [allCards, f.map]);
  const map = knownMap ? f.map : "";

  const shown = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    const list = cards.filter((c) => {
      if (!f.disabled && !c.enabled) return false;
      if (f.kinds.length && !f.kinds.includes(c.rewardKind)) return false;
      if (f.tag && !c.tags.includes(f.tag)) return false;
      if (map) {
        // Drops in the map, and the map's area level (from its tier) reaches the card's drop level.
        const area = c.areas.find((a) => a.id === map);
        if (!area || c.dropLevel > mapAreaLevel(area, f.tier)) return false;
      }
      return words.every((w) => c.search.includes(w));
    });
    return list.sort(SORTERS[f.sort]);
  }, [cards, q, f.disabled, f.kinds, f.tag, map, f.tier, f.sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1 text-sm text-muted" aria-live="polite">
        {shown.length} card{shown.length === 1 ? "" : "s"}
        {onReset && activeFilterCount({ ...f, map }) > 0 && (
          <button type="button" className="text-accent hover:underline" onClick={onReset}>
            Reset filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-muted">No card matches these filters.</p>
      ) : (
        // Keyed by the filters: a new search or filter starts again from the first batch.
        <CardGrid key={filtersToQuery(f)} cards={shown} frame={frame} league={league} />
      )}
    </div>
  );
}

/** Cards shown at first and added by each "Show more" (a multiple of 2, 3, 4 and 6 columns). */
const BATCH = 48;

/** Key of the shown count in the browser history entry. */
const SHOWN_STATE = "divcardsShown";

/**
 * The cards in batches. How many are shown is kept in the browser history entry, so going
 * back to it (Back, browser back) shows the same cards, while a new visit starts again.
 */
function CardGrid({ cards, frame, league }: { cards: CardSummary[]; frame: string; league: LeagueView | null }) {
  // Read from the current history entry on every render: a navigation to the index (even
  // from the index, through the logo) brings a fresh entry, and with it the first batch.
  const [, rerender] = useState(0);
  const stored = typeof window === "undefined" ? 0 : Number(window.history.state?.[SHOWN_STATE]) || 0;
  const count = Math.max(BATCH, stored);
  const remember = (shown: number) => {
    window.history.replaceState({ ...window.history.state, [SHOWN_STATE]: shown }, "", window.location.href);
    rerender((n) => n + 1);
  };
  const showMore = () => remember(count + BATCH);

  // The logo clicked on the index itself: back to the first batch.
  useEffect(() => {
    const reset = () => remember(BATCH);
    window.addEventListener(HOME_EVENT, reset);
    return () => window.removeEventListener(HOME_EVENT, reset);
  }, []);
  const left = cards.length - count;

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {cards.slice(0, count).map((c, i) => (
          <li key={c.slug}>
            <Link href={`/cards/${c.slug}`} className="group block rounded-md outline-offset-4">
              <div className="transition-transform duration-150 group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
                <DivCard
                  name={c.name}
                  stackSize={c.stackSize}
                  art={c.art}
                  reward={c.reward}
                  flavour={c.flavour}
                  frame={frame}
                  priority={i < 8}
                />
              </div>
              <CardMeta card={c} diff={league?.diffs[c.slug]} previous={league?.previous ?? null} />
            </Link>
          </li>
        ))}
      </ul>
      {left > 0 && (
        <div className="flex items-center gap-4 pt-4">
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <button
            type="button"
            onClick={showMore}
            className="rounded-md border border-border px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Show more <span className="text-muted/70">· {left} left</span>
          </button>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
      )}
    </>
  );
}

function CardMeta({ card, diff, previous }: { card: CardSummary; diff?: WeightDiff; previous: string | null }) {
  const r = rarity(card.weight);
  return (
    <div className="mt-2 flex flex-col gap-1 px-1 text-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className={r.tone}>{card.enabled ? r.label : "Disabled"}</span>
        {card.weight != null && (
          <span className="tabular-nums text-muted" title="Estimated drop weight">
            Weight {formatWeight(card.weight)} <WeightDiffBadge diff={diff} previous={previous} />
          </span>
        )}
      </div>
      {!card.scryable && (
        <span className="self-start rounded border border-border px-1.5 text-[0.7rem] text-muted" title="Drops in no atlas map">
          Non-Scryable
        </span>
      )}
    </div>
  );
}

const byName = (a: CardSummary, b: CardSummary) => a.name.localeCompare(b.name);
/** Cards without a weight always go last. */
const byWeight = (dir: 1 | -1) => (a: CardSummary, b: CardSummary) =>
  (a.weight == null ? 1 : 0) - (b.weight == null ? 1 : 0) || dir * ((a.weight ?? 0) - (b.weight ?? 0)) || byName(a, b);

const SORTERS: Record<SortKey, (a: CardSummary, b: CardSummary) => number> = {
  stash: (a, b) => a.stashOrder - b.stashOrder,
  name: byName,
  weight_asc: byWeight(1),
  weight_desc: byWeight(-1),
  stack: (a, b) => a.stackSize - b.stackSize || byName(a, b),
  level: (a, b) => a.dropLevel - b.dropLevel || byName(a, b),
};
