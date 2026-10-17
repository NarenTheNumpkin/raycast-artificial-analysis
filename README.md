# Artificial Analysis for Raycast

A clean AI model dashboard with a top five, provider logos, favorites, and searchable leaderboards powered by [Artificial Analysis](https://artificialanalysis.ai/).

## Install

Requires macOS, Raycast, npm, and **Node.js 22.22.2 or later** (Node.js 24 LTS works).

1. Create a free key through [Artificial Analysis API key management](https://artificialanalysis.ai/api-key-management-redirect).
2. Run:

   ```sh
   cd /Users/naren/AAII
   npm ci
   npm run dev
   ```

3. Open **AI Model Rankings** in Raycast. On the setup screen, press `↵` to open preferences and enter the key in its password field, or `⌘↵` to create a key first.
4. Reopen the command to see the top five. You can close setup without entering a key and return later.

After registration, stopping development with `Ctrl+C` leaves all commands installed in Raycast. Run `npm run dev` again when editing the source. No key belongs in source files, terminal commands, or Git.

## Commands

| Command                   | View and ordering                                              |
| ------------------------- | -------------------------------------------------------------- |
| **AI Model Rankings**     | Five distinct model families, highest Intelligence Index first |
| **All AI Models**         | Every evaluated configuration, highest intelligence first      |
| **Best Coding Models**    | Coding Index, highest first                                    |
| **Fastest AI Models**     | Median output tokens per second, highest first                 |
| **Model Pricing**         | Input or output price selector, lowest first                   |
| **Lowest Latency Models** | Time to first token in seconds, lowest first                   |

All commands share a dataset and cache. Each can have its own alias or hotkey in Raycast Settings → Extensions → Artificial Analysis.

## Dashboard

**AI Model Rankings** opens a three-column grid:

- **Top Models** shows five cards, one per model family, with the provider logo, the family name, and its Intelligence Index score. Gold, silver, and bronze rank pills mark the podium. The sixth card opens every evaluated model.
- **More Leaderboards** opens Best Coding, Fastest, Lowest Latency, Lowest Price, or Favorites in one keystroke. Each tile previews the current leader or your favorites count.
- The **provider dropdown** in the search bar (`⌘P`) narrows the dashboard to one lab. Cards keep their global ranks, and leaderboards opened from the tiles or the all-models card start with the same filter.

Card artwork is rendered locally as SVG for light and dark mode. Provider logos work offline, with monogram fallbacks for unknown labs.

The top five uses the strongest intelligence configuration per model family. Only recognized trailing reasoning-effort and fallback qualifiers are removed when grouping. Model sizes, releases, and distinct named versions are preserved. Dashboard ranks compare distinct families; full-list and detail ranks compare every evaluated configuration. Search and provider filtering preserve the relevant global ranks.

## Leaderboards

Each row shows the provider logo, the rank and model family, its configuration (such as _Max_ or _Thinking_) in gray, and the ranking value on the right. A star marks favorites. The section header shows the metric, any active filters, how many models are listed, and when the data was retrieved.

- **Rank By** (`⌘P`) switches metrics in place, grouped into Quality, Performance, and Price. The pricing command offers input and output prices.
- **Details panel** (`⌘D`) shows every metric for the selected model with its rank, and highlights the active metric. Raycast remembers whether the panel is open.
- **Filter by Provider** (`⌘⇧P`) and **Show Favorites Only** (`⌘⇧F`) narrow the list. **Clear Filters** appears while a filter is active.

## Model details

Press `↵` on any model for its details: the family, provider, and configuration; the active metric's value and rank; and a table with every metric's value and rank across all evaluated configurations. The sidebar shows favorite status, the Intelligence Index version, retrieval time, and a link to the model's page.

| Preference                   | Default             | Behavior                                                        |
| ---------------------------- | ------------------- | --------------------------------------------------------------- |
| Artificial Analysis API Key  | Needed to load data | Personal API key entered in Raycast's password field            |
| Show Coding Index            | On                  | Include Coding Index in model details and copied summaries      |
| Show Input and Output Prices | On                  | Include both token prices in model details and copied summaries |
| Show Output Speed            | On                  | Include output speed in model details and copied summaries      |

Intelligence Index, time to first token, and the active leaderboard metric are always shown. An em dash (`—`) means no measurement is available. Prices are **USD per million tokens**, and latency measures **time to first token**, rather than the time to finish an answer. Speed and latency are medians across serving providers.

## Actions and shortcuts

Open the action panel with `⌘K`. Actions are grouped into model actions, copy actions, filters, and general actions; the panel's search finds any of them.

| Shortcut | Action                                                                 |
| -------- | ---------------------------------------------------------------------- |
| `↵`      | View model details (in details: open the model on Artificial Analysis) |
| `⌘↵`     | Open the model on Artificial Analysis                                  |
| `⌘.`     | Add to or remove from favorites                                        |
| `⌘D`     | Show or hide the details panel in leaderboards                         |
| `⌘⇧C`    | Copy a model summary                                                   |
| `⌘⌥C`    | Copy the model name                                                    |
| `⌘P`     | Open the search-bar dropdown: Rank By, or the dashboard's provider     |
| `⌘⇧P`    | Filter a leaderboard by provider                                       |
| `⌘⇧F`    | Toggle favorites only                                                  |
| `⌘R`     | Refresh rankings                                                       |

**Browse Leaderboards** jumps to any other view, and you can also copy the active metric's value or the model link. Favorites use stable API model IDs and persist across launches and API-key changes. Favoriting a configuration keeps that exact configuration in the favorites view.

## Data and recovery

- Cached data appears immediately. Opening a command refreshes a snapshot that is at least one hour old; manual refresh (`⌘R`) bypasses freshness and confirms the result, or explains why it failed.
- Every API page must succeed before a new complete snapshot replaces the old one. Changed index versions, malformed pagination, or duplicate IDs retain the last good snapshot.
- API keys are isolated by a SHA-256 credential identifier. Normalized model data and retrieval metadata are cached through Raycast. Keys are sent only in the `x-api-key` header to Artificial Analysis, and never appear in URLs, copies, errors, or cache contents.
- Rate-limit cooldowns survive command openings, manual refreshes, and cache-schema upgrades. The client honors `Retry-After` and `X-RateLimit-Reset`, with a one-hour fallback if the server provides neither. Each page costs one API request; see the [current tier limits](https://artificialanalysis.ai/data-api/docs).
- Requests time out after 15 seconds per page. Closing a view cancels its request; reopening can immediately start a new request. There is no background polling.
- Section headers show how long ago data was retrieved, and note when a refresh failed. Model details include the exact retrieval time, source, and API index version. Retrieval time describes when this installation fetched data.
- When nothing can load, the view explains whether the key was rejected, the rate limit was reached (with the retry time), or Artificial Analysis could not be reached, and offers the matching fix.
- Missing measurements are excluded only from the applicable leaderboard. Valid zeros remain, and ties use unrounded competition ranking (`1, 2, 2, 4`).

Updating from the original cache format triggers one complete refresh for creator IDs and latency data. Your existing key, statistic preferences, and quota cooldown are preserved.

## Development

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run lint
npm run format:check
```

Run a build before a standalone typecheck in a fresh checkout; it generates `raycast-env.d.ts`. `npm run build` checks a production (`dist` environment) build. Tests use synthetic models and mocked HTTP responses to cover data recovery, ranking, family grouping, per-metric standings, metric directions, SVG and markdown safety, provider assets, filtering, favorites persistence, and cancellation/reopening.

The extension stays local; no publishing script or Git remote is configured.

## Attribution

Data: [Artificial Analysis](https://artificialanalysis.ai/), through its [documented Free API](https://artificialanalysis.ai/data-api/docs/reference). This is an independent client.

Provider logos: [Lobe Icons](https://github.com/lobehub/lobe-icons), static SVG package version 1.95.1. The original MIT license is included under `assets/providers/LICENSE`; the marks belong to their owners.

The extension code uses the MIT license. Artificial Analysis retains its rights in its data.
