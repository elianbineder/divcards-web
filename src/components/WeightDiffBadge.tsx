import type { WeightDiff } from "@/lib/leagues";
import { formatWeight } from "@/lib/cards";

/** "+1,250" / "-37.5" / "New": weight change from the previous league. */
export function WeightDiffBadge({ diff, previous }: { diff: WeightDiff | undefined; previous: string | null }) {
  if (diff == null) return null;
  if (diff === "new") {
    return (
      <span className="rounded bg-sky-500/15 px-1 text-[0.7rem] font-semibold text-sky-300" title={`No weight in ${previous}`}>
        New
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span className={`text-[0.7rem] tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`} title={`Change since ${previous}`}>
      {up ? "+" : "-"}
      {formatWeight(Math.abs(diff))}
    </span>
  );
}
