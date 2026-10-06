// Client for the DivCards API (https://api.divcards.app/docs).
//
// The whole site is built from the bulk export (/export/cards.json): a single cached
// request that every page shares, revalidated once per hour.

import "server-only";

export const API_URL = (process.env.DIVCARDS_API_URL ?? "https://api.divcards.app").replace(/\/+$/, "");

const REVALIDATE_SECONDS = 3600;

/** A run of text with one in-game style; `glyph`/`image` replace the text with an icon. */
export interface Segment {
  text: string;
  style?: string;
  size?: number;
  glyph?: string;
  image?: string;
}

export type Line = Segment[];

export interface CardText {
  name: string;
  reward: Line[];
  reward_text: string;
  flavour: Line[];
  flavour_text: string;
}

export interface RewardItem {
  type: string;
  id?: string;
  slug: string;
  name: string;
  icon?: string | null;
}

export interface Reward {
  kind: string;
  /** Missing when the reward is not a single item ("Disabled", generic rewards). */
  name?: string;
  quantity: number;
  corrupted: boolean;
  properties: Record<string, string | number>;
  flags: string[];
  item?: RewardItem | null;
}

export interface Weight {
  gold_cost: number;
  formula: "common" | "uncommon_rare";
  value: number;
  min: number;
  max: number;
}

export interface Area {
  id: string;
  name: string;
  /** 1-16, or "Unique" for unique maps. */
  tier: number | "Unique";
  unique_map: boolean;
  on_atlas: boolean;
  area_level: number;
}

export interface Card {
  slug: string;
  id: string;
  stack_size: number;
  drop_level: number;
  stash_order: number;
  in_game: boolean;
  enabled: boolean;
  tags: string[];
  art: string | null;
  drops: { atlas: Area[] };
  scryable: boolean;
  reward: Reward;
  /** Missing for cards without a gold cost (disabled cards). */
  weight?: Weight;
  overridden?: boolean;
  lang: string;
  text: CardText;
}

export interface Meta {
  label: string;
  version: string;
  built_at: string;
  assets: { frame: string; favicon: string };
  costs: { league: string; updated_at: string } | null;
  counts: { cards: number; areas: number };
  api_version: string;
}

export interface CardsExport {
  meta: Meta;
  cards: Card[];
}

export async function getExport(): Promise<CardsExport> {
  const res = await fetch(`${API_URL}/export/cards.json`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["cards"] },
  });
  if (!res.ok) throw new Error(`DivCards API: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getCard(slug: string): Promise<{ meta: Meta; card: Card; cards: Card[] } | null> {
  const { meta, cards } = await getExport();
  const card = cards.find((c) => c.slug === slug);
  return card ? { meta, card, cards } : null;
}
