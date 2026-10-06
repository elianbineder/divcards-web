// Saves the weights of the API's current league into src/data/league-history.json.
//
//   pnpm snapshot --name Allflame
//   pnpm snapshot --reference the-one-with-all --rate 8
//
// Run it once the league's gold costs are complete (and again before the next league
// starts if they were corrected). An existing snapshot of the same league is replaced,
// keeping its name and reference measurement unless new ones are given.
//
// --reference / --rate: the calculator's default, a card and its average drops per map
// measured in this league. Leagues without one show the latest older measurement.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const API_URL = (process.env.DIVCARDS_API_URL ?? "https://api.divcards.app").replace(/\/+$/, "");
const HISTORY = fileURLToPath(new URL("../src/data/league-history.json", import.meta.url));
const USAGE =
  'Usage: pnpm snapshot [--name "<league name>"] [--reference <card slug> --rate <drops per map>]';

const args = process.argv.slice(2);
const option = (flag) => {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
};
const name = option("--name");
const refCard = option("--reference");
const refRate = option("--rate");
if ((refCard == null) !== (refRate == null) || (refRate != null && !(Number(refRate) > 0))) {
  console.error(`--reference and --rate go together, with a rate above 0.\n${USAGE}`);
  process.exit(1);
}

const res = await fetch(`${API_URL}/export/cards.json`);
if (!res.ok) throw new Error(`${API_URL}: ${res.status} ${res.statusText}`);
const { meta, cards } = await res.json();
if (!meta.costs) throw new Error("The API serves no gold costs: nothing to save.");

let history = { leagues: [] };
try {
  history = JSON.parse(await readFile(HISTORY, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const league = meta.costs.league;
const existing = history.leagues.find((l) => l.league === league);
if (!name && !existing?.name) {
  console.error(`${league} has no snapshot yet: give its name.\n${USAGE}`);
  process.exit(1);
}

let reference = existing?.reference ?? null;
if (refCard) {
  const card = cards.find((c) => c.slug === refCard);
  if (!card?.weight || !card.scryable || !card.enabled) {
    console.error(`${refCard}: not an enabled card with a weight that drops in atlas maps.`);
    process.exit(1);
  }
  reference = { card: refCard, rate: Number(refRate) };
}

const weights = {};
for (const card of [...cards].sort((a, b) => a.slug.localeCompare(b.slug))) {
  if (card.weight) weights[card.slug] = { gold: card.weight.gold_cost, weight: card.weight.value };
}

const snapshot = {
  league,
  name: name ?? existing.name,
  game: meta.label,
  costs_updated_at: meta.costs.updated_at ?? null,
  ...(reference && { reference }),
  weights,
};

history.leagues = history.leagues.filter((l) => l.league !== league);
history.leagues.push(snapshot);
history.leagues.sort((a, b) => compareLeagues(a.league, b.league));

await writeFile(HISTORY, `${JSON.stringify(history, null, 2)}\n`);
console.log(
  `Saved ${league} - ${snapshot.name}: ${Object.keys(weights).length} weights (game ${meta.label})` +
    (reference ? `, reference ${reference.rate} ${reference.card} per map.` : "."),
);

function compareLeagues(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
