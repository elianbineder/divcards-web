// Weights of past leagues, saved in src/data/league-history.json by `pnpm snapshot`,
// next to the current league's weights served by the API.

import history from "@/data/league-history.json";
import type { Card, Meta } from "./api";

interface LeagueSnapshot {
  league: string;
  name: string;
  game: string;
  costs_updated_at: string | null;
  /** Calculator default: a card and its average drops per map measured in this league. */
  reference?: { card: string; rate: number };
  weights: Record<string, { gold: number; weight: number }>;
}

export interface DefaultReference {
  card: string;
  rate: number;
  /** League it was measured in, e.g. "3.29 - Allflame". */
  measuredIn: string;
  /** false when it comes from an older league than the current one. */
  thisLeague: boolean;
}

/** Weight change from the previous league, or "new" for a card it had no cost for. */
export type WeightDiff = number | "new";

export interface LeagueView {
  id: string;
  /** "3.29 - Allflame" */
  label: string;
  current: boolean;
  weights: Record<string, number>;
  /** League compared with; null when there is no older league in the history. */
  previous: string | null;
  /** Cards whose weight changed or that are new; unchanged cards are left out. */
  diffs: Record<string, WeightDiff>;
}

const snapshots = (history as { leagues: LeagueSnapshot[] }).leagues;

/** "3.29 - Allflame", or just the number when no snapshot names the league. */
export function leagueLabel(id: string): string {
  const name = snapshots.find((s) => s.league === id)?.name;
  return name ? `${id} - ${name}` : id;
}

/**
 * Calculator default for the current league: its own measurement, or else the one of the
 * newest older league that has one.
 */
export function defaultReference(currentLeague: string | undefined): DefaultReference | null {
  if (!currentLeague) return null;
  const measured = snapshots
    .filter((s) => s.reference && compareLeagues(s.league, currentLeague) <= 0)
    .sort((a, b) => compareLeagues(b.league, a.league))[0];
  if (!measured?.reference) return null;
  return {
    ...measured.reference,
    measuredIn: leagueLabel(measured.league),
    thisLeague: measured.league === currentLeague,
  };
}

/** Every league with weights, newest first: the API's current league and the saved ones. */
export function leagueViews(meta: Meta, cards: Card[]): LeagueView[] {
  const current = meta.costs?.league;
  const list = snapshots
    .filter((s) => s.league !== current)
    .map((s) => ({
      id: s.league,
      label: leagueLabel(s.league),
      current: false,
      weights: Object.fromEntries(Object.entries(s.weights).map(([slug, w]) => [slug, w.weight])),
    }));
  if (current) {
    list.push({
      id: current,
      label: leagueLabel(current),
      current: true,
      weights: Object.fromEntries(cards.filter((c) => c.weight).map((c) => [c.slug, c.weight!.value])),
    });
  }
  list.sort((a, b) => compareLeagues(a.id, b.id));

  return list
    .map((league, i) => {
      const prev = list[i - 1];
      const diffs: Record<string, WeightDiff> = {};
      if (prev) {
        for (const [slug, w] of Object.entries(league.weights)) {
          const before = prev.weights[slug];
          if (before == null) diffs[slug] = "new";
          else if (Math.abs(w - before) > 1e-9) diffs[slug] = w - before;
        }
      }
      return { ...league, previous: prev?.id ?? null, diffs };
    })
    .reverse();
}

function compareLeagues(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
