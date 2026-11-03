# SOVEREIGN SI // CASE MAP

An interactive investigative map of the sovereign SI buildout: the master nodes, the ten-layer stack, every contract, capital and partnership thread, the threats the stack is built against, and the investable exposure across it.

Research as of Nov 3, 2026. Built from the EDGE: SOVEREIGN SI research pages (FIELD NOTES), including the BIO LAYER pages on health data, biodefense, the body network and pharma.

## Views

- **Map.** An overview of every system and an entity table, with docked panels and nothing floating.
  - The overview shows five columns (Capital + state, Control, Operations + theaters, Infrastructure, Health + biotech) and one card per system: entity count, leading entities, links and cross-column links.
  - Selecting a card, a column heading or ALL ENTITIES opens a sortable table: type, system, ticker and grade, people, links, cross-column links, threads and first date. The overview stays above it in compact form. The table scrolls on its own and keeps its position while you work.
  - Selecting a row opens the detail panel on the right: mission, strategy, plan of action, facts, people, board interlocks, relationships, threads, claims and sources. Every row in the table then shows its relation to the selected entity, and the overview cards show how many of their entities link to it. "Linked to" filters the table to those entities.
  - CONNECTIONS shows the selected entity's relationships in three columns: inbound on the left, outbound on the right, partners and ties in the center.
  - Search, a thread ("Show on map") and a stack layer each list their entities in the same table. Thread tables carry the order of entry.
  - The rail holds lenses, stack layers, relationship types and a timeline that dims entities that entered after a chosen month.
  - An ORGANIZATIONS | PEOPLE switch changes what the overview and tables list.
- **Detail panel on every view.** Selecting a name in Players, Playbook, Threads, Markets or Brief opens the detail panel beside the page you are on, and the page keeps its scroll position. OPEN ON MAP moves to the entity's system table.
- **Players.** Three tabs: People (a sortable table with role, system, positions, shared seats, ties, links and threads), Board interlocks (organizations that share a person) and Personal ties. Selecting a row opens the full record in the detail panel.
- **Playbook.** Every actor with a strategy or plan, listed with progress and the next open step. The selected actor's mission, strategy, plan of action, objectives, people and threads show beside the list, so the plan is always visible. Filter by type, system and step status.
- **Threads.** Every investigation as a dated, sourced case string, grouped like the board. Two cross-system threads come first (01 and 52). Each column's threads follow under its own heading. "Show thread on map" isolates the thread on the board.
- **Markets.** Every listed ticker with role, SEC XBRL financial health, a Cboe price and options snapshot, latest print, guidance, risk and the next diligence step. Plus private-node exposure routes, non-US listings, a catalyst calendar and a risk register.
- **Brief.** Tabs, each one screen: Summary (findings and how the map is organized, with links into every column and system), Strategies, Stack + control, Leverage + shifts, Patterns, Indicators and the Claims ledger.
- **Claims ledger.** Widely shared claims about the body network (IoB, IoBNT, implants, tracking) are tested against patent texts, regulator records and peer-reviewed sources. Each entry carries a status (CONTRADICTED, PARTLY GROUNDED, UNVERIFIED), the real kernel where one exists, and what would confirm or refute it. Claims never become nodes or edges; a node's dossier links to any claim that names it.
- **Sources.** Every source behind the map.

Keyboard: `/` focuses search, `Esc` steps back. The SOVEREIGN SI // CASE MAP title returns to the overview from anywhere.

Links are shareable. The URL hash carries the view, table scope, selected entity, lens, layer and thread (for example `#scope=sys%3Ahealthdata&node=cms`, `#layer=L0`, `#view=markets&tk=ONDS`, `#show=07`).

## Publish on GitHub Pages

1. Create a repository and push this folder to `main`.
2. In the repository: Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root.
3. The site is live at `https://<user>.github.io/<repo>/` within a minute or two.

No build step. Everything is static: `index.html`, `assets/`, `data/`. Fonts load from Google Fonts; there are no other dependencies.

## Market data refresh

`pipeline/build_market.py` (Python standard library only) pulls SEC XBRL company facts and the Cboe delayed-quotes feed and writes `data/market.js`.

- The workflow in `.github/workflows/refresh-market.yml` reruns it on weekdays at 7:00 AM and 7:00 PM EST (8:00 AM and 8:00 PM during EDT) and commits the result. It can also be run by hand from the Actions tab.
- Add a repository secret named `SEC_USER_AGENT` with a contact string such as `Your Name you@example.com`. The SEC asks automated clients to identify themselves.
- To run locally: `python3 pipeline/build_market.py`.

Health grades:
- **STRONG:** free cash flow positive with net cash, or a 15%+ operating margin (net margin when a filer reports no operating line).
- **STABLE:** neither strong nor stretched.
- **STRETCHED:** burning cash with net debt, or under six quarters of runway.
- **SPECULATIVE:** under $100M revenue.

## Research merge

`pipeline/merge_research.js` folds structured research extractions (one JSON file per batch of Notion pages) into `data/case.js`. It reconciles ids across batches, adds new systems and people edge types, numbers new threads, and merges market research, private marks, sources and brief additions:

```
node pipeline/merge_research.js <extract-dir> --dry   # report only
node pipeline/merge_research.js <extract-dir>         # write data/case.js
```

## Editing the case

All case content lives in `data/case.js`:

| Field | What it holds |
| --- | --- |
| `nodes` | Each node's `id`, name, system, tier (M, K, N), kind (`person` for key players, with `role`), `strat` (strategy), `plan` (plan of action), layers, position on the 140 × 90 world plane, ticker or private mark, summary, directive, objectives ledger, facts, sources |
| `edges` | `[from, to, type, label, date, verified]`. People edge types: leads, board, founded, invests, advises, post, tie |
| `threads` | Investigations with dated events |
| `brief`, `markets`, `sources` | Content for those views |
| `claims` | Circulating-claims ledger: claim, origin, evidence, status, kernel, confirm, refute, related node ids, sources |

To check data integrity after edits, open the site and look at the browser console; there should be no errors.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk will not work, because browsers block ES modules on `file://`.

## Disclaimer

Research map built from public filings, company releases and press coverage. Items marked UNVERIFIED rest on a single secondary source. Nothing here is investment advice.
