"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { formatWeight } from "@/lib/cards";
import type { WeightDiff } from "@/lib/leagues";
import { WeightDiffBadge } from "./WeightDiffBadge";

export interface HistoryLeague {
  id: string;
  label: string;
  previous: string | null;
  weights: Record<string, number>;
  diffs: Record<string, WeightDiff>;
}

export interface HistoryCard {
  slug: string;
  name: string;
  art: string | null;
}

/** Sort by name, or by the weight in one league (its index in `leagues`). */
type Sort = { by: "name" | number; desc: boolean };

/** Weights of every card in the last leagues, newest first. */
export function HistoryTable({ leagues, cards }: { leagues: HistoryLeague[]; cards: HistoryCard[] }) {
  const [query, setQuery] = useState("");
  const [changedOnly, setChangedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>({ by: "name", desc: false });
  const q = useDeferredValue(query.trim().toLowerCase());

  const rows = useMemo(() => {
    const list = cards.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        (!changedOnly || leagues.some((l) => c.slug in l.diffs)),
    );
    const dir = sort.desc ? -1 : 1;
    if (sort.by === "name") return list.sort((a, b) => dir * a.name.localeCompare(b.name));
    const weights = leagues[sort.by].weights;
    // Cards without a weight in that league go last in both directions.
    return list.sort((a, b) => {
      const wa = weights[a.slug];
      const wb = weights[b.slug];
      if (wa == null || wb == null) return (wa == null ? 1 : 0) - (wb == null ? 1 : 0);
      return dir * (wa - wb) || a.name.localeCompare(b.name);
    });
  }, [cards, leagues, q, changedOnly, sort]);

  const toggle = (by: Sort["by"]) =>
    setSort((s) => (s.by === by ? { by, desc: !s.desc } : { by, desc: by !== "name" }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter cards…"
          aria-label="Filter cards"
          className="h-9 min-w-0 flex-1 basis-56 rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-foreground">
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(e) => setChangedOnly(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Only changed or new
        </label>
        <span className="text-sm text-muted">
          {rows.length} card{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <Header label="Card" active={sort.by === "name"} desc={sort.desc} onClick={() => toggle("name")} />
              {leagues.map((l, i) => (
                <Header
                  key={l.id}
                  label={l.label}
                  active={sort.by === i}
                  desc={sort.desc}
                  onClick={() => toggle(i)}
                  right
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.slug} className="hover:bg-surface">
                <td className="px-3 py-1.5">
                  <Link href={`/cards/${c.slug}`} className="flex items-center gap-3 hover:text-accent">
                    {c.art && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.art} alt="" width={42} height={30} loading="lazy" className="h-[30px] w-[42px] rounded-sm object-cover" />
                    )}
                    <span className="font-game text-base">{c.name}</span>
                  </Link>
                </td>
                {leagues.map((l) => {
                  const w = l.weights[c.slug];
                  return (
                    <td key={l.id} className="px-3 py-1.5 text-right tabular-nums">
                      {w == null ? (
                        <span className="text-muted/50">–</span>
                      ) : (
                        <div className="flex items-baseline justify-end gap-1.5">
                          <WeightDiffBadge diff={l.diffs[c.slug]} previous={l.previous} />
                          {formatWeight(w)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Header({
  label,
  active,
  desc,
  onClick,
  right,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
  right?: boolean;
}) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2 font-medium ${right ? "text-right" : ""}`}
      aria-sort={active ? (desc ? "descending" : "ascending") : undefined}
    >
      <button type="button" onClick={onClick} className={`hover:text-foreground ${active ? "text-foreground" : ""}`}>
        {label}
        {active && <span aria-hidden>{desc ? " ↓" : " ↑"}</span>}
      </button>
    </th>
  );
}
