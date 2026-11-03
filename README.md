# SOVEREIGN SI // CASE MAP

An interactive investigative map of the sovereign SI buildout: the master nodes, the ten-layer stack, every contract, capital and partnership thread, the threats the stack is built against, and the investable exposure across it.

Research as of Nov 3, 2026. Built from the EDGE: SOVEREIGN SI research pages (FIELD NOTES).

## Views

- **Map.** One live 3D world. WORLD lays the 12 master systems flat as an evidence board; DEPTH lifts every node onto its layer (L0 Energy to L9 Effectors, with State + capital above and Threat + counter-bloc below). Vertical shafts mark companies that span several layers.
  - Hover a node to light its threads; click to open its dossier (mission, objectives ledger, facts, every thread with dates, investigations, evidence).
  - Hover a thread in the dossier to isolate it on the map.
  - Lenses (Military, Financial, Political, Technological, Apparatus), system isolation and thread-type toggles cut the clutter.
  - The timeline replays the build month by month.
- **Threads.** Ten investigations as dated, sourced case strings. "Show thread on map" isolates the thread in 3D.
- **Markets.** Every listed ticker with role, SEC XBRL financial health, a Cboe price and options snapshot, latest print, guidance, risk and the next diligence step. Plus private-node exposure routes, non-US listings, a catalyst calendar and a risk register.
- **Brief.** Core read, layer table, who holds each layer, the five loops, leverage rebalance, global pivot, elements to weigh, signal board.
- **Sources.** Every source behind the map.

Keyboard: `/` focuses search, `Esc` steps back.

Links are shareable. The URL hash carries the view, selected node, lens, system and thread (for example `#node=armada`, `#view=markets&tk=ONDS`, `#show=07`).

## Publish on GitHub Pages

1. Create a repository and push this folder to `main`.
2. In the repository: Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root.
3. The site is live at `https://<user>.github.io/<repo>/` within a minute or two.

No build step. Everything is static: `index.html`, `assets/`, `data/`. three.js and fonts load from public CDNs.

## Market data refresh

`pipeline/build_market.py` (Python standard library only) pulls SEC XBRL company facts and the Cboe delayed-quotes feed and writes `data/market.js`.

- The workflow in `.github/workflows/refresh-market.yml` reruns it on weekdays at 7:00 AM and 7:00 PM EST (8:00 AM and 8:00 PM during EDT) and commits the result. It can also be run by hand from the Actions tab.
- Add a repository secret named `SEC_USER_AGENT` with a contact string such as `Your Name you@example.com`. The SEC asks automated clients to identify themselves.
- To run locally: `python3 pipeline/build_market.py`.

Health grades:
- **STRONG:** free cash flow positive with net cash, or a 15%+ operating margin.
- **STABLE:** neither strong nor stretched.
- **STRETCHED:** burning cash with net debt, or under six quarters of runway.
- **SPECULATIVE:** under $100M revenue.

## Editing the case

All case content lives in `data/case.js`:

| Field | What it holds |
| --- | --- |
| `nodes` | Each node's `id`, name, system, tier (M, K, N), kind, layers, position on the 140 × 90 world plane, ticker or private mark, summary, directive, objectives ledger, facts, sources |
| `edges` | `[from, to, type, label, date, verified]` |
| `threads` | Investigations with dated events |
| `brief`, `markets`, `sources` | Content for those views |

To check data integrity after edits, open the site and look at the browser console; there should be no errors.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk will not work, because browsers block ES modules on `file://`.

## Disclaimer

Research map built from public filings, company releases and press coverage. Items marked UNVERIFIED rest on a single secondary source. Nothing here is investment advice.
