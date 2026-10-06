# DivCards web

Website for **Path of Exile Divination Cards**, built on the
[DivCards API](https://api.divcards.app/docs):

- **Index**: every card drawn as in game, with search, filters, drop locations and
  estimated drop weights.
- **Calculator**: drop rates of every card extrapolated from the observed rate of one card.
- **History**: drop weights of every card in the last leagues.

> Unofficial fan-made project, not affiliated with or endorsed by Grinding Gear Games.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DIVCARDS_API_URL` | `https://api.divcards.app` | DivCards API the site reads (e.g. `http://127.0.0.1:8000` for a local server) |

## Development

Prerequisites: Node.js 20+ and pnpm.

```bash
git clone https://github.com/elianbineder/divcards-web
cd divcards-web
pnpm install
pnpm dev
```

The site is then at http://localhost:3000.

| Command | Description |
|---|---|
| `pnpm dev` | development server |
| `pnpm build` | production build (also checks types) |
| `pnpm lint` | ESLint |
| `pnpm snapshot` | saves the current league's weights (see below) |

## League history

The API serves the weights of the current league only. Past leagues are kept in
`src/data/league-history.json`, which feeds the league selector of the index and the weight
changes (`+250`, `-12.5`, `New`) shown against the previous league.

Once a league's gold costs are complete in the API, save its snapshot and commit it:

```bash
pnpm snapshot --name "Allflame"
```

Run it again if the costs are corrected before the next league; the snapshot of the same
league is replaced, keeping its name and reference measurement.

The calculator opens with a reference measurement: a card and its average drops per map.
Save the one measured in the current league with:

```bash
pnpm snapshot --reference the-one-with-all --rate 8
```

Until a league has its own measurement, the calculator uses the newest older one and says
which league it was measured in.

## Architecture

```
src/
    app/
        page.tsx              gallery (server: loads the cards, client: filters them)
        cards/[slug]/page.tsx card page: reward, drop weight, maps, categories
        calculator/page.tsx   drop rates of every card from the rate of one card
        history/page.tsx      weights of every card in the last 5 leagues
        layout.tsx            header and footer around every page
        not-found.tsx         404 page
        globals.css           theme, font and the in-game card layout
    components/
        DivCard.tsx           a card drawn over the game frame, text scaled to fit
        GameText.tsx          in-game styled text (item colours, sizes, glyphs)
        Gallery.tsx           search, filters menu, league, sorting and the card grid
        DropCalculator.tsx    the calculator (reference card, rate, map, results table)
        CardPicker.tsx        card search box of the calculator
        HistoryTable.tsx      weights table of the history page
        WeightDiffBadge.tsx   weight change from the previous league (+250, -12.5, New)
        Logo.tsx, NavLinks.tsx, SiteFooter.tsx    header and footer parts
    data/
        league-history.json   weights of every saved league (pnpm snapshot)
    lib/
        api.ts                API types and the cached export request
        cards.ts              lean card data for the browser, sorting and labels
        leagues.ts            leagues with weights and their changes from the previous one
scripts/
    snapshot-league.mjs       saves the current league's weights into league-history.json
```

Every page is static and regenerated at most once per hour from `/export/cards.json`
(incremental static regeneration), so the API receives a few requests per hour no matter
the traffic.

Card pages are generated for the cards known at build time; any other `/cards/...` address
is a static 404. When the API publishes a dataset with new cards, redeploy the site.

## License

The source code is released under the [MIT License](LICENSE). Card names, texts and artwork are the
property of Grinding Gear Games and are loaded from the DivCards API.

The font in `public/fonts/` is Fontin SmallCaps by Jos Buivenga
([exljbris](https://www.exljbris.com/fontin.html)), a free font used under its license
(web embedding with the notice in `globals.css`); it is not covered by the MIT License.
