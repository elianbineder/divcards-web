"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatWeight, type CardSummary } from "@/lib/cards";
import { MAX_TIER, mapAreaLevel } from "@/lib/filters";
import type { DefaultReference, WeightDiff } from "@/lib/leagues";
import { CardPicker } from "./CardPicker";
import { WeightDiffBadge } from "./WeightDiffBadge";

/** A card that has a weight: the only ones the calculator can use. */
export type WeightedCard = Pick<CardSummary, "slug" | "name" | "art" | "areas" | "dropLevel"> & { weight: number };

type SortKey = "rate" | "name" | "perCard";

interface CalculatorProps {
  cards: WeightedCard[];
  /** Reference card and rate the page opens with (see defaultReference). */
  initial: DefaultReference | null;
  /** Weight changes from the previous league. */
  diffs: Record<string, WeightDiff>;
  previous: string | null;
}

/** The calculator with its inputs read from the URL, so a calculation can be shared. */
export function DropCalculator(props: CalculatorProps) {
  return <CalculatorBody {...props} params={useSearchParams()} />;
}


/**
 * Drop rates of every card from one observed rate.
 *
 * The player picks a reference card and how many of it drop per map with their farming
 * method. The total weighting of that method is `weight(reference) / rate`, and every
 * other card is expected at `weight(card) / total weighting` per map. The reference card
 * may come from any map: the total weighting applies to every map.
 */
/** The calculator for given URL parameters; with none (static render), its defaults. */
export function CalculatorBody({
  cards,
  diffs,
  previous,
  initial,
  params,
}: CalculatorProps & { params: URLSearchParams | null }) {
  const bySlug = useMemo(() => new Map(cards.map((c) => [c.slug, c])), [cards]);
  const defaultCard = initial?.card ?? "";
  const defaultRate = initial ? String(initial.rate) : "";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "rate", desc: true });

  // Inputs live in the URL; the defaults stay out of it, a cleared rate is kept ("rate=").
  const refSlug = params?.get("ref") ?? defaultCard;
  const rateText = params?.has("rate") ? (params.get("rate") ?? "") : defaultRate;
  const map = params?.get("map") ?? "";
  const tierParam = Number(params?.get("tier"));
  const tier = Number.isInteger(tierParam) && tierParam >= 1 && tierParam <= MAX_TIER ? tierParam : null;
  const update = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value == null) p.delete(key);
      else p.set(key, value);
    }
    const q = p.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  };
  const setRefSlug = (slug: string) => update({ ref: slug === defaultCard ? null : slug });
  const setRateText = (text: string) => update({ rate: text === defaultRate ? null : text });
  const setMap = (id: string) => update({ map: id || null, tier: null });
  const setTier = (t: number | null) => update({ tier: t == null ? null : String(t) });

  const ref = bySlug.get(refSlug) ?? null;
  // Accepts a decimal comma as well as a point ("0,5" = "0.5").
  const rate = Number(rateText.trim().replace(",", "."));
  const rateOk = rateText.trim() !== "" && Number.isFinite(rate) && rate > 0;
  const valid = ref != null && rateOk;
  const totalWeighting = valid ? ref.weight / rate : null;

  const maps = useMemo(() => {
    const all = new Map<string, CardSummary["areas"][number]>();
    for (const c of cards) for (const a of c.areas) all.set(a.id, a);
    return [...all.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);
  const area = maps.find((a) => a.id === map) ?? null;
  const baseTier = area && typeof area.tier === "number" ? area.tier : null;
  const runTier = baseTier == null ? null : Math.max(baseTier, tier ?? baseTier);

  /** Cards that drop in the chosen map at the chosen tier (its area level reaches their drop level). */
  const pool = useMemo(
    () =>
      area
        ? cards.filter((c) => c.areas.some((a) => a.id === area.id) && c.dropLevel <= mapAreaLevel(area, tier))
        : cards,
    [cards, area, tier],
  );

  const rows = useMemo(() => {
    if (totalWeighting == null) return [];
    const q = query.trim().toLowerCase();
    const list = pool
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((c) => {
        const perMap = c.weight / totalWeighting;
        return { card: c, perMap, perCard: 1 / perMap };
      });
    const dir = sort.desc ? -1 : 1;
    const value = {
      rate: (r: (typeof list)[number]) => r.perMap,
      perCard: (r: (typeof list)[number]) => r.perCard,
    };
    return list.sort((a, b) =>
      sort.key === "name" ? dir * a.card.name.localeCompare(b.card.name) : dir * (value[sort.key](a) - value[sort.key](b)),
    );
  }, [pool, totalWeighting, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key === "rate" }));

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="font-game text-lg text-muted">Weight extrapolation</h2>
        <p className="mt-1 text-sm text-muted">
          Estimates the average drop rate of every card from the observed rate of a single reference card. The
          observed rate defines a total weighting, which is applied to the weight of each card under the same farming
          conditions.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem]">
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Reference card
            <CardPicker cards={cards} value={ref} onChange={(c) => setRefSlug(c.slug)} label="Reference card" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Map (optional)
            <select
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">All cards</option>
              {maps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Tier
            {/* From the map's base tier up to T16: a map cannot be run below its base tier. */}
            <select
              value={runTier ?? ""}
              disabled={baseTier == null}
              onChange={(e) => setTier(Number(e.target.value) === baseTier ? null : Number(e.target.value))}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-50"
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
            </select>
          </label>
        </div>

        <div className="mt-4 grid overflow-hidden rounded-md border border-border sm:grid-cols-3">
          <Cell label={ref ? `${ref.name} avg per map` : "Avg per map"}>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              placeholder="e.g. 8"
              aria-label="Average drops of the reference card per map"
              className="w-full bg-transparent text-center text-2xl tabular-nums text-foreground outline-none placeholder:text-muted/50"
            />
          </Cell>
          <Cell label="Weighting of card">
            <span className="text-2xl tabular-nums">{ref ? ref.weight.toFixed(1) : "–"}</span>
          </Cell>
          <Cell label="Total weighting" hint="weighting of card ÷ avg per map">
            <span className="text-2xl tabular-nums text-accent">{totalWeighting != null ? totalWeighting.toFixed(1) : "–"}</span>
          </Cell>
        </div>

        {initial && !initial.thisLeague && refSlug === defaultCard && rateText === defaultRate && (
          <p className="mt-3 text-xs text-accent">
            Default measured in {initial.measuredIn}: the rate may differ in the current league.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          {area
            ? `${pool.length} card${pool.length === 1 ? "" : "s"} drop in ${area.name}${runTier ? ` at T${runTier}` : ""}.`
            : `${cards.length} cards that drop in atlas maps.`}
        </p>
      </section>

      {totalWeighting == null ? (
        <p className="py-10 text-center text-muted">
          {refSlug && !ref
            ? `"${refSlug}" is not available: the calculator only uses cards that drop in atlas maps and have a weight.`
            : !ref
              ? "Pick a reference card and enter its average drops per map to see the estimates."
              : rateText.trim() === ""
                ? `Enter the average drops per map of ${ref.name} to see the estimates.`
                : "The average per map must be a number above 0, such as 8 or 0.5."}
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter cards…"
              aria-label="Filter cards"
              className="h-9 min-w-0 flex-1 basis-56 rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
            />
            <span className="text-sm text-muted">
              {rows.length} card{rows.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <SortHeader label="Card" k="name" sort={sort} onSort={toggleSort} />
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                  <SortHeader label="Avg per map" k="rate" sort={sort} onSort={toggleSort} right />
                  <SortHeader label="Maps per card" k="perCard" sort={sort} onSort={toggleSort} right />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ card, perMap, perCard }) => (
                  <tr key={card.slug} className={card.slug === ref?.slug ? "bg-surface-2" : "hover:bg-surface"}>
                    <td className="px-3 py-1.5">
                      <Link href={`/cards/${card.slug}`} className="flex items-center gap-3 hover:text-accent">
                        {card.art && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.art} alt="" width={42} height={30} loading="lazy" className="h-[30px] w-[42px] rounded-sm object-cover" />
                        )}
                        <span className="font-game text-base">{card.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <WeightDiffBadge diff={diffs[card.slug]} previous={previous} />
                        {formatWeight(card.weight)}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatRate(perMap)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatMaps(perCard)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Cell({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 border-border bg-background px-3 py-4 text-center not-last:border-b sm:not-last:border-r sm:not-last:border-b-0">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted/70">{hint}</span>}
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  right,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; desc: boolean };
  onSort: (k: SortKey) => void;
  right?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th
      className={`px-3 py-2 font-medium ${right ? "text-right" : ""}`}
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
    >
      <button type="button" onClick={() => onSort(k)} className={`hover:text-foreground ${active ? "text-foreground" : ""}`}>
        {label}
        {active && <span aria-hidden>{sort.desc ? " ↓" : " ↑"}</span>}
      </button>
    </th>
  );
}

/** Drops per map: 2 decimals from 1 up, 3 significant digits below. */
function formatRate(n: number): string {
  if (n >= 100) return Math.round(n).toLocaleString("en-US");
  if (n >= 1) return n.toFixed(2);
  return Number(n.toPrecision(3)).toString();
}

function formatMaps(n: number): string {
  if (n < 1) return "< 1";
  return n >= 100 ? Math.round(n).toLocaleString("en-US") : n.toFixed(1);
}
