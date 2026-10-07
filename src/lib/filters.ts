// Index filters, kept in the URL so every view can be shared and navigation (logo, back,
// links to a category or map) always shows what the address says. No React here.

import { REWARD_KINDS, SORTS, type SortKey } from "./cards";

export interface Filters {
  q: string;
  kinds: string[];
  tag: string;
  map: string;
  /** Tier the map is run at; null for its base tier. */
  tier: number | null;
  disabled: boolean;
  sort: SortKey;
  /** League id; "" for the current one. */
  league: string;
}

export const DEFAULT_FILTERS: Filters = {
  q: "",
  kinds: [],
  tag: "",
  map: "",
  tier: null,
  disabled: false,
  sort: "stash",
  league: "",
};

/** Reward kinds offered as filter chips ("other" holds a single card: not worth a chip). */
export const KIND_FILTERS = Object.keys(REWARD_KINDS).filter((k) => k !== "other");

export function filtersFromQuery(p: URLSearchParams): Filters {
  const sort = p.get("sort") as SortKey | null;
  const tier = Number(p.get("tier"));
  return {
    q: p.get("q") ?? "",
    kinds: (p.get("kind") ?? "").split(",").filter((k) => KIND_FILTERS.includes(k)),
    tag: p.get("tag") ?? "",
    map: p.get("map") ?? "",
    tier: Number.isInteger(tier) && tier >= 1 && tier <= MAX_TIER ? tier : null,
    disabled: p.get("disabled") === "1",
    sort: sort && sort in SORTS ? sort : DEFAULT_FILTERS.sort,
    league: p.get("league") ?? "",
  };
}

export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.kinds.length) p.set("kind", f.kinds.join(","));
  if (f.tag) p.set("tag", f.tag);
  if (f.map) p.set("map", f.map);
  if (f.map && f.tier != null) p.set("tier", String(f.tier));
  if (f.disabled) p.set("disabled", "1");
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  if (f.league) p.set("league", f.league);
  return p.toString();
}

/** Filters narrowing the list; search, sort and league are not counted. */
export function activeFilterCount(f: Filters): number {
  return (f.kinds.length > 0 ? 1 : 0) + (f.tag ? 1 : 0) + (f.map ? 1 : 0) + (f.disabled ? 1 : 0);
}

// -- map tiers ----------------------------------------------------------------------

export const MAX_TIER = 16;

/** Area level of a map run at a tier: T1 = 68 … T16 = 83. */
export function tierAreaLevel(tier: number): number {
  return 67 + tier;
}

/** Lowest tier whose area level reaches a card's drop level. */
export function minTierFor(dropLevel: number): number {
  return Math.max(1, dropLevel - 67);
}

export interface MapArea {
  id: string;
  name: string;
  /** Base tier, or "Unique" for unique maps (fixed area level). */
  tier: number | "Unique";
  level: number;
}

/**
 * Area level of a map run at `tier` (clamped to its base tier and T16). Unique maps have no
 * tiers and the area level in the data is not reliable for them (Cortex shows 79 but drops
 * level 81 cards), so they never exclude a card: Infinity.
 */
export function mapAreaLevel(area: MapArea, tier: number | null): number {
  if (typeof area.tier !== "number") return Infinity;
  const t = Math.min(MAX_TIER, Math.max(area.tier, tier ?? area.tier));
  return tierAreaLevel(t);
}
