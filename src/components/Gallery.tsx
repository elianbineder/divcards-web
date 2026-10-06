"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  KIND_STYLE,
  REWARD_KINDS,
  SORTS,
  formatWeight,
  rarity,
  tagLabel,
  tierLabel,
  type CardSummary,
  type SortKey,
} from "@/lib/cards";
import type { LeagueView, WeightDiff } from "@/lib/leagues";
import { DivCard } from "./DivCard";
import { WeightDiffBadge } from "./WeightDiffBadge";

type Size = "s" | "m" | "l";

interface Filters {
  q: string;
  kinds: string[];
  tag: string;
  map: string;
  /** "": any, "1": drops in atlas maps, "0": Non-Scryable. */
  scryable: "" | "1" | "0";
  disabled: boolean;
  sort: SortKey;
  size: Size;
  /** League id; "" for the current one. */
  league: string;
}

const DEFAULTS: Filters = {
  q: "",
  kinds: [],
  tag: "",
  map: "",
  scryable: "",
  disabled: false,
  sort: "stash",
  size: "m",
  league: "",
};

const GRID: Record<Size, string> = {
  s: "grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]",
  m: "grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]",
  l: "grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]",
};

export function Gallery({
  cards: allCards,
  frame,
  leagues,
}: {
  cards: CardSummary[];
  frame: string;
  /** Newest first; the current league is the first one with `current`. */
  leagues: LeagueView[];
}) {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF((prev) => ({ ...prev, [key]: value }));

  // Filters live in the URL so a view can be shared; read it once after hydration.
  const [urlRead, setUrlRead] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the URL is only known in the browser */
    setF(fromQuery(new URLSearchParams(window.location.search)));
    setUrlRead(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!urlRead) return;
    const query = toQuery(f);
    if (query !== window.location.search.slice(1)) {
      window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    }
  }, [f, urlRead]);

  const q = useDeferredValue(f.q.trim().toLowerCase());

  // Weights of the chosen league; a past league only lists the cards it had a cost for.
  const league = leagues.find((l) => l.id === f.league) ?? leagues.find((l) => l.current) ?? null;
  const cards = useMemo(() => {
    if (!league || league.current) return allCards;
    return allCards.filter((c) => c.slug in league.weights).map((c) => ({ ...c, weight: league.weights[c.slug] }));
  }, [allCards, league]);

  const options = useMemo(() => {
    const tags = new Map<string, number>();
    const maps = new Map<string, { name: string; tier: CardSummary["areas"][number]["tier"] }>();
    for (const c of cards) {
      if (!c.enabled) continue;
      for (const t of c.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
      for (const a of c.areas) maps.set(a.id, { name: a.name, tier: a.tier });
    }
    return {
      tags: [...tags].sort((a, b) => b[1] - a[1]),
      maps: [...maps].sort((a, b) => a[1].name.localeCompare(b[1].name)),
    };
  }, [cards]);

  const shown = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    const list = cards.filter(
      (c) =>
        (f.disabled || c.enabled) &&
        (!f.scryable || c.scryable === (f.scryable === "1")) &&
        (f.kinds.length === 0 || f.kinds.includes(c.rewardKind)) &&
        (!f.tag || c.tags.includes(f.tag)) &&
        (!f.map || c.areas.some((a) => a.id === f.map)) &&
        words.every((w) => c.search.includes(w)),
    );
    return list.sort(SORTERS[f.sort]);
  }, [cards, q, f.disabled, f.scryable, f.kinds, f.tag, f.map, f.sort]);

  const toggleKind = (kind: string) =>
    set("kinds", f.kinds.includes(kind) ? f.kinds.filter((k) => k !== kind) : [...f.kinds, kind]);

  /** Filters narrowing the list (search, sort, size and league are not counted). */
  const activeCount =
    (f.kinds.length > 0 ? 1 : 0) + (f.tag ? 1 : 0) + (f.map ? 1 : 0) + (f.scryable ? 1 : 0) + (f.disabled ? 1 : 0);
  const resetFilters = () => setF({ ...DEFAULTS, q: f.q, sort: f.sort, size: f.size, league: f.league });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={f.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search name, reward or flavour…"
          aria-label="Search cards"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
        />
        <FilterMenu activeCount={activeCount}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Select label="Sort" value={f.sort} onChange={(v) => set("sort", v as SortKey)}>
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
            {leagues.length > 0 && (
              <Select
                label="League"
                value={league?.current ? "" : (league?.id ?? "")}
                onChange={(v) => set("league", v)}
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.current ? "" : l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
            )}
            <Field label="Card size">
              <Segmented
                label="Card size"
                value={f.size}
                onChange={(v) => set("size", v as Size)}
                options={[
                  ["s", "S"],
                  ["m", "M"],
                  ["l", "L"],
                ]}
              />
            </Field>
          </div>

          <Field label="Reward type">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reward type">
              {Object.entries(REWARD_KINDS).map(([kind, label]) => {
                const on = f.kinds.includes(kind);
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleKind(kind)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      on ? "border-accent bg-background" : "border-border hover:border-muted"
                    }`}
                  >
                    <span className={`s-${KIND_STYLE[kind]}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Category" value={f.tag} onChange={(v) => set("tag", v)}>
              <option value="">All categories</option>
              {options.tags.map(([tag, n]) => (
                <option key={tag} value={tag}>
                  {tagLabel(tag)} ({n})
                </option>
              ))}
            </Select>
            <Select label="Map" value={f.map} onChange={(v) => set("map", v)}>
              <option value="">Any map</option>
              {options.maps.map(([id, m]) => (
                <option key={id} value={id}>
                  {m.name} ({tierLabel(m.tier)})
                </option>
              ))}
            </Select>
            <Select label="Scrying" value={f.scryable} onChange={(v) => set("scryable", v as Filters["scryable"])}>
              <option value="">All Cards</option>
              <option value="1">Scryable (drops in maps)</option>
              <option value="0">Non-Scryable</option>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <Check label="Show disabled" checked={f.disabled} onChange={(v) => set("disabled", v)} />
            {activeCount > 0 && (
              <button type="button" className="text-accent hover:underline" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
        </FilterMenu>
      </div>

      <div className="-mt-2 flex items-center gap-3 px-1 text-sm text-muted" aria-live="polite">
        {shown.length} card{shown.length === 1 ? "" : "s"}
        {activeCount > 0 && (
          <button type="button" className="text-accent hover:underline" onClick={resetFilters}>
            Reset filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-muted">No card matches these filters.</p>
      ) : (
        <ul className={`grid gap-x-4 gap-y-6 ${GRID[f.size]}`}>
          {shown.map((c, i) => (
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
      )}
    </div>
  );
}

function CardMeta({ card, diff, previous }: { card: CardSummary; diff?: WeightDiff; previous: string | null }) {
  const r = rarity(card.weight);
  return (
    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 px-1 text-xs">
      <span className={r.tone}>{card.enabled ? r.label : "Disabled"}</span>
      {card.weight != null && (
        <span className="tabular-nums text-muted" title="Estimated drop weight">
          Weight {formatWeight(card.weight)} <WeightDiffBadge diff={diff} previous={previous} />
        </span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

/** "Filters" button opening a panel with every filter; closes on outside click or Escape. */
function FilterMenu({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
          open ? "border-accent text-foreground" : "border-border text-muted hover:text-foreground"
        }`}
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-background">{activeCount}</span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-30 mt-2 flex w-[min(36rem,calc(100vw-2rem))] flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-2xl shadow-black/60"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-accent"
      >
        {children}
      </select>
    </label>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div role="group" aria-label={label} className="flex h-9 overflow-hidden rounded-md border border-border text-sm">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-3 ${value === v ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-muted hover:text-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--accent)]" />
      {label}
    </label>
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

function fromQuery(p: URLSearchParams): Filters {
  const pick = <T extends string>(v: string | null, allowed: readonly T[], fallback: T) =>
    allowed.includes(v as T) ? (v as T) : fallback;
  return {
    q: p.get("q") ?? "",
    kinds: (p.get("kind") ?? "").split(",").filter((k) => k in REWARD_KINDS),
    tag: p.get("tag") ?? "",
    map: p.get("map") ?? "",
    scryable: pick(p.get("scryable"), ["1", "0"] as const, "" as const),
    disabled: p.get("disabled") === "1",
    sort: pick(p.get("sort"), Object.keys(SORTS) as SortKey[], DEFAULTS.sort),
    size: pick(p.get("size"), ["s", "m", "l"] as const, DEFAULTS.size),
    league: p.get("league") ?? "",
  };
}

function toQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.kinds.length) p.set("kind", f.kinds.join(","));
  if (f.tag) p.set("tag", f.tag);
  if (f.map) p.set("map", f.map);
  if (f.scryable) p.set("scryable", f.scryable);
  if (f.disabled) p.set("disabled", "1");
  if (f.sort !== DEFAULTS.sort) p.set("sort", f.sort);
  if (f.size !== DEFAULTS.size) p.set("size", f.size);
  if (f.league) p.set("league", f.league);
  return p.toString();
}
