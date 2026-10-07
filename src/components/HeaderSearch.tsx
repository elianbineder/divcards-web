"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { KIND_STYLE, REWARD_KINDS, SORTS, tagLabel, type SortKey } from "@/lib/cards";
import {
  DEFAULT_FILTERS,
  KIND_FILTERS,
  MAX_TIER,
  activeFilterCount,
  type Filters,
  type MapArea,
} from "@/lib/filters";
import { useFilters } from "./useFilters";

export interface FilterOptions {
  /** Card tags with their number of cards, most used first. */
  tags: [string, number][];
  /** Atlas maps by name. */
  maps: MapArea[];
  /** Newest first. */
  leagues: { id: string; label: string; current: boolean }[];
}

const INPUT =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent";

/**
 * Card search in the header. On the index it filters as you type and sits next to the
 * Filters menu; on other pages, Enter opens the index with the search applied.
 */
export function HeaderSearch({ options }: { options: FilterOptions }) {
  const [filters, setFilters] = useFilters();
  const onIndex = usePathname() === "/";
  const [draft, setDraft] = useState("");

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <form
        role="search"
        className="min-w-0 flex-1 sm:w-64 sm:flex-none lg:w-72"
        onSubmit={(e) => {
          e.preventDefault();
          if (!onIndex && draft.trim()) {
            setFilters({ ...DEFAULT_FILTERS, q: draft.trim() });
            setDraft("");
          }
        }}
      >
        <input
          type="search"
          value={onIndex ? filters.q : draft}
          onChange={(e) => (onIndex ? setFilters({ ...filters, q: e.target.value }) : setDraft(e.target.value))}
          placeholder="Search cards…"
          aria-label="Search cards"
          className={INPUT}
        />
      </form>
      {onIndex && <FilterMenu filters={filters} setFilters={setFilters} options={options} />}
    </div>
  );
}

/** Same size as HeaderSearch while the URL is not known yet (static render). */
export function HeaderSearchFallback() {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <input type="search" disabled placeholder="Search cards…" aria-label="Search cards"
        className={`${INPUT} min-w-0 flex-1 sm:w-64 sm:flex-none lg:w-72`} />
    </div>
  );
}

function FilterMenu({
  filters,
  setFilters,
  options,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  options: FilterOptions;
}) {
  // A map id the data does not know (edited URL) is ignored.
  const f = options.maps.some((m) => m.id === filters.map) ? filters : { ...filters, map: "", tier: null };
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters({ ...f, [key]: value });
  const count = activeFilterCount(f);

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

  const map = options.maps.find((m) => m.id === f.map);
  const baseTier = map && typeof map.tier === "number" ? map.tier : null;
  const toggleKind = (kind: string) =>
    set("kinds", f.kinds.includes(kind) ? f.kinds.filter((k) => k !== kind) : [...f.kinds, kind]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
          open ? "border-accent text-foreground" : "border-border text-muted hover:text-foreground"
        }`}
      >
        <FilterIcon />
        Filters
        {count > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-background">{count}</span>}
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-30 mt-2 flex max-h-[calc(100vh-6rem)] w-[min(36rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-2xl shadow-black/60"
        >
          <div className="grid grid-cols-2 gap-3">
            <Select label="Sort" value={f.sort} onChange={(v) => set("sort", v as SortKey)}>
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
            {options.leagues.length > 0 && (
              <Select label="League" value={f.league} onChange={(v) => set("league", v)}>
                {options.leagues.map((l) => (
                  <option key={l.id} value={l.current ? "" : l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Reward type</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reward type">
              {KIND_FILTERS.map((kind) => {
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
                    <span className={`s-${KIND_STYLE[kind]}`}>{REWARD_KINDS[kind]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Select label="Category" value={f.tag} onChange={(v) => set("tag", v)}>
            <option value="">All categories</option>
            {options.tags.map(([tag, n]) => (
              <option key={tag} value={tag}>
                {tagLabel(tag)} ({n})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <Select label="Map" value={f.map} onChange={(v) => setFilters({ ...f, map: v, tier: null })}>
              <option value="">Any map</option>
              {options.maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <TierSelect baseTier={baseTier} tier={f.tier} onChange={(t) => set("tier", t)} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted hover:text-foreground">
              <input
                type="checkbox"
                checked={f.disabled}
                onChange={(e) => set("disabled", e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Show disabled
            </label>
            {count > 0 && (
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, q: f.q, sort: f.sort, league: f.league })}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tier a map is run at, from its base tier up to T16 (a map cannot be run below its base
 * tier). Disabled until a map with tiers is chosen; unique maps have a fixed level.
 */
export function TierSelect({
  baseTier,
  tier,
  onChange,
}: {
  baseTier: number | null;
  tier: number | null;
  onChange: (tier: number | null) => void;
}) {
  const value = baseTier == null ? "" : String(Math.max(baseTier, tier ?? baseTier));
  return (
    <Select
      label="Tier"
      value={value}
      disabled={baseTier == null}
      onChange={(v) => onChange(baseTier != null && Number(v) !== baseTier ? Number(v) : null)}
    >
      {baseTier == null ? (
        <option value="">–</option>
      ) : (
        Array.from({ length: MAX_TIER - baseTier + 1 }, (_, i) => baseTier + i).map((t) => (
          <option key={t} value={t}>
            T{t}
          </option>
        ))
      )}
    </Select>
  );
}

function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs text-muted">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
