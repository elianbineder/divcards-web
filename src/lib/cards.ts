// Card data as the browser needs it: the gallery receives a lean copy of every card and
// filters/sorts it client-side. No server-only imports here.

import type { Area, Card, Line } from "./api";

export interface CardSummary {
  slug: string;
  name: string;
  stackSize: number;
  dropLevel: number;
  stashOrder: number;
  enabled: boolean;
  scryable: boolean;
  art: string | null;
  reward: Line[];
  flavour: Line[];
  rewardKind: string;
  /** Lowercase name + reward + flavour, for the search box. */
  search: string;
  tags: string[];
  areas: { id: string; name: string; tier: Area["tier"]; level: number }[];
  weight: number | null;
}

export function toSummary(card: Card): CardSummary {
  const { text } = card;
  return {
    slug: card.slug,
    name: text.name,
    stackSize: card.stack_size,
    dropLevel: card.drop_level,
    stashOrder: card.stash_order,
    enabled: card.enabled,
    scryable: card.scryable,
    art: card.art,
    reward: text.reward,
    flavour: text.flavour,
    rewardKind: card.reward.kind,
    search: `${text.name}\n${text.reward_text}\n${text.flavour_text}`.toLowerCase(),
    tags: card.tags,
    areas: card.drops.atlas.map((a) => ({ id: a.id, name: a.name, tier: a.tier, level: a.area_level })),
    weight: card.weight?.value ?? null,
  };
}

export const SORTS = {
  stash: "Stash order",
  name: "Name",
  weight_asc: "Rarest first",
  weight_desc: "Most common first",
  stack: "Stack size",
  level: "Drop level",
} as const;

export type SortKey = keyof typeof SORTS;

/** Reward kinds in the order the filter shows them, with readable labels. */
export const REWARD_KINDS: Record<string, string> = {
  unique: "Unique",
  currency: "Currency",
  gem: "Gem",
  rare: "Rare",
  magic: "Magic",
  normal: "Normal",
  divination: "Divination",
  other: "Other",
};

/** Item colour of each reward kind, as in game. */
export const KIND_STYLE: Record<string, string> = {
  unique: "uniqueitem",
  currency: "currencyitem",
  gem: "gemitem",
  rare: "rareitem",
  magic: "magicitem",
  normal: "whiteitem",
  divination: "divination",
  other: "default",
};

/** Readable tag: "unique_jewellery_divination" -> "Unique jewellery". */
export function tagLabel(tag: string): string {
  const words = tag.replace(/_divination$/, "").split("_");
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Weights span 1 to ~100 000; show them with 3 significant digits. */
export function formatWeight(w: number): string {
  if (w >= 1000) return Math.round(w).toLocaleString("en-US");
  return Number(w.toPrecision(3)).toString();
}

/** Rarity bands from the weight, for a quick visual cue. */
export function rarity(weight: number | null): { label: string; tone: string } {
  if (weight == null) return { label: "Unknown", tone: "text-stone-500" };
  if (weight < 20) return { label: "Extremely rare", tone: "text-rose-400" };
  if (weight < 200) return { label: "Very rare", tone: "text-orange-400" };
  if (weight < 2000) return { label: "Rare", tone: "text-amber-300" };
  if (weight < 10000) return { label: "Uncommon", tone: "text-sky-300" };
  return { label: "Common", tone: "text-stone-300" };
}

/** "T14", or "Unique" for unique maps. */
export function tierLabel(tier: Area["tier"]): string {
  return typeof tier === "number" ? `T${tier}` : tier;
}

/** Sort key of a tier: unique maps after T16. */
export function tierOrder(tier: Area["tier"]): number {
  return typeof tier === "number" ? tier : 17;
}

/**
 * Card page on PoEDB: spaces become underscores, apostrophes are dropped and the rest
 * is URL-encoded ("Brush, Paint and Palette" -> "Brush%2C_Paint_and_Palette").
 */
export function poedbUrl(name: string): string {
  const page = encodeURIComponent(name.replace(/'/g, "").replace(/ /g, "_"));
  return `https://poedb.tw/us/${page}`;
}
