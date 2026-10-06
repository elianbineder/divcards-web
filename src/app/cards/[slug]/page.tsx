import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL, getCard, getExport, type Card } from "@/lib/api";
import { KIND_STYLE, REWARD_KINDS, formatWeight, poedbUrl, rarity, tagLabel, tierLabel, tierOrder } from "@/lib/cards";
import { DivCard } from "@/components/DivCard";
import { GameText } from "@/components/GameText";

export const revalidate = 3600;
// Only the cards known at build time: an unknown slug is a static 404, never a render.
// Cards added to the API appear with the next deploy.
export const dynamicParams = false;

export async function generateStaticParams() {
  const { cards } = await getExport();
  return cards.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cards/[slug]">): Promise<Metadata> {
  const found = await getCard((await params).slug);
  if (!found) return {};
  const { card } = found;
  return {
    title: card.text.name,
    description: `${card.text.name} (${card.stack_size}x): ${card.text.reward_text.replace(/\n/g, ", ")}`,
    openGraph: card.art ? { images: [card.art] } : undefined,
  };
}

export default async function CardPage({ params }: PageProps<"/cards/[slug]">) {
  const found = await getCard((await params).slug);
  if (!found) notFound();
  const { meta, card, cards } = found;

  const ordered = cards.filter((c) => c.enabled || c.slug === card.slug).sort((a, b) => a.stash_order - b.stash_order);
  const index = ordered.findIndex((c) => c.slug === card.slug);
  const prev = ordered[index - 1];
  const next = ordered[index + 1];

  return (
    <article className="flex flex-col gap-6">
      <nav className="flex items-center justify-between gap-4 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ← All cards
        </Link>
        <div className="flex gap-4">
          {prev && <Link href={`/cards/${prev.slug}`} className="hover:text-foreground">‹ {prev.text.name}</Link>}
          {next && <Link href={`/cards/${next.slug}`} className="hover:text-foreground">{next.text.name} ›</Link>}
        </div>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="mx-auto w-full max-w-[380px]">
          <DivCard
            name={card.text.name}
            stackSize={card.stack_size}
            art={card.art}
            reward={card.text.reward}
            flavour={card.text.flavour}
            frame={meta.assets.frame}
            priority
          />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a
              href={poedbUrl(card.text.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-game text-base text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <DatabaseIcon />
              PoEDB
            </a>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <header>
            <h1 className="font-game text-4xl">{card.text.name}</h1>
            <p className="mt-1 text-sm text-muted">
              Stack of {card.stack_size} · drop level {card.drop_level}
              {!card.enabled && <span className="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-red-300">Disabled</span>}
            </p>
          </header>

          <RewardPanel card={card} />
          <WeightPanel card={card} cards={cards} league={meta.costs?.league} />
          <DropsPanel card={card} />

          {card.tags.length > 0 && (
            <Panel title="Categories">
              <ul className="flex flex-wrap gap-1.5">
                {card.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/?tag=${t}`}
                      className="block rounded-full border border-border px-2.5 py-0.5 text-xs text-muted hover:border-muted hover:text-foreground"
                    >
                      {tagLabel(t)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <p className="text-xs text-muted">
            Data:{" "}
            <a className="underline hover:text-foreground" href={`${API_URL}/v1/cards/${card.slug}`}>
              /v1/cards/{card.slug}
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}

function DatabaseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-game text-lg text-muted">{title}</h2>
      {children}
    </section>
  );
}

function RewardPanel({ card }: { card: Card }) {
  const { reward } = card;
  const props = Object.entries(reward.properties);
  return (
    <Panel title="Reward">
      <div className="flex items-start gap-4">
        {reward.item?.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reward.item.icon} alt="" className="h-16 w-16 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <GameText lines={card.text.reward} className="font-game text-xl leading-snug" />
          <p className="mt-1 text-sm text-muted">
            <span className={`s-${KIND_STYLE[reward.kind] ?? "default"}`}>{REWARD_KINDS[reward.kind] ?? reward.kind}</span>
            {reward.quantity > 1 && <> · quantity {reward.quantity}</>}
            {reward.corrupted && <> · corrupted</>}
          </p>
        </div>
      </div>
      {(props.length > 0 || reward.flags.length > 0) && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {props.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k.replace(/_/g, " ")}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
          {reward.flags.length > 0 && (
            <div className="contents">
              <dt className="text-muted">flags</dt>
              <dd>{reward.flags.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
    </Panel>
  );
}

function WeightPanel({ card, cards, league }: { card: Card; cards: Card[]; league?: string }) {
  const w = card.weight;
  if (!w) {
    return (
      <Panel title="Drop weight">
        <p className="text-sm text-muted">No weight: this card has no gold cost{card.enabled ? "" : " (disabled)"}.</p>
      </Panel>
    );
  }
  const weighted = cards.filter((c) => c.weight);
  const rank = weighted.filter((c) => c.weight!.value < w.value).length + 1;
  const r = rarity(w.value);
  return (
    <Panel title={`Drop weight${league ? ` · league ${league}` : ""}`}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Weight" value={formatWeight(w.value)} tone={r.tone} hint={r.label} />
        <Stat label="Range" value={`${formatWeight(w.min)} – ${formatWeight(w.max)}`} />
        <Stat label="Faustus gold cost" value={w.gold_cost.toLocaleString("en-US")} />
        <Stat label="Rarity rank" value={`#${rank} / ${weighted.length}`} hint="1 = rarest" />
      </div>
    </Panel>
  );
}

function Stat({ label, value, tone, hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-lg tabular-nums ${tone ?? ""}`}>{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

function DropsPanel({ card }: { card: Card }) {
  const areas = [...card.drops.atlas].sort((a, b) => tierOrder(a.tier) - tierOrder(b.tier) || a.name.localeCompare(b.name));
  return (
    <Panel title="Drops in">
      {areas.length === 0 ? (
        <p className="text-sm text-muted">No atlas map (Non-Scryable): global drop or other content.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
          {areas.map((a) => (
            <li key={a.id}>
              <Link
                href={`/?map=${a.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-muted"
              >
                <span className={`min-w-0 font-game text-base ${a.unique_map ? "s-uniqueitem" : ""}`}>{a.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {tierLabel(a.tier)} · lvl {a.area_level}
                  {!a.on_atlas && " · off atlas"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
