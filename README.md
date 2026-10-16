# Artificial Analysis for Raycast

A focused AI model dashboard with a top five, provider logos, favorites, and searchable leaderboards powered by [Artificial Analysis](https://artificialanalysis.ai/).

## Install

Requires macOS, Raycast, npm, and **Node.js 22.22.2 or later** (Node.js 24 LTS works).

1. Create a free key through [Artificial Analysis API key management](https://artificialanalysis.ai/api-key-management-redirect).
2. Run:

   ```sh
   cd /Users/naren/AAII
   npm ci
   npm run dev
   ```

3. Open **AI Model Rankings** in Raycast. Choose **Open Extension Preferences** on the setup screen and enter the key in its password field.
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

## Dashboard and model details

The dashboard uses a three-column grid: five model cards and **Browse All Models**. Large card text is rendered locally as SVG artwork; Raycast controls native list font sizes. Provider logos work offline, with monogram fallbacks for unknown labs.

The top five uses the strongest intelligence configuration per model family. Only recognized trailing reasoning-effort and fallback qualifiers are removed when grouping. Model sizes, releases, and distinct named versions are preserved. Dashboard ranks compare distinct families; full-list and detail ranks compare every evaluated configuration. Search and provider filtering preserve the relevant global ranks.

Press `Enter` on a model to see its full configuration, a prominent active metric, and vertically aligned details. List rows show a provider logo, rank, name, and **one aligned value**. Extra statistics stay in details.

| Preference                   | Default             | Behavior                                             |
| ---------------------------- | ------------------- | ---------------------------------------------------- |
| Artificial Analysis API Key  | Needed to load data | Personal API key entered in Raycast's password field |
| Show Coding Index            | Off                 | Include Coding Index in model details                |
| Show Input and Output Prices | Off                 | Include both token prices in model details           |
| Show Output Speed            | Off                 | Include output speed in model details                |

The active leaderboard metric is always visible. Intelligence Index and time-to-first-token latency are available in details; an em dash (`—`) means no measurement is available. Prices are **USD per million tokens**, and latency measures **time to first token**, rather than the time to finish an answer. Speed is aggregated across serving providers.

## Filters, favorites, and actions

Open the action panel with `⌘K`:

- **View:** top five, all models, favorites, coding, speed, pricing, or latency.
- **Filter → Provider:** choose a lab, or return to all providers.
- **Filter → Show Favorites Only:** restrict a full leaderboard to saved configurations. **Clear Filters** restores all providers and configurations.
- **Copy:** model summary, name, active metric value, or source link.
- **Open:** model page, original Intelligence Index leaderboard, or API-key management.

**View Model Details**, **Add/Remove Favorite**, **Refresh Rankings**, and **Extension Preferences** are also directly available. Favorites use stable API model IDs and persist across launches and API-key changes. Favoriting a configuration keeps that exact configuration in the favorites view.

Use `↑` / `↓` to select list entries, arrow keys to move between cards, `Enter` to open details, `⌘R` to refresh, and `⌘⇧C` to copy the model summary. The ranking selector in a full list changes metrics without another data request. The pricing command offers input and output selectors explicitly.

## Data and recovery

- Cached data appears immediately. Opening a command refreshes a snapshot that is at least one hour old; manual refresh bypasses freshness.
- Every API page must succeed before a new complete snapshot replaces the old one. Changed index versions, malformed pagination, or duplicate IDs retain the last good snapshot.
- API keys are isolated by a SHA-256 credential identifier. Normalized model data and retrieval metadata are cached through Raycast. Keys are sent only in the `x-api-key` header to Artificial Analysis, and never appear in URLs, copies, errors, or cache contents.
- Rate-limit cooldowns survive command openings, manual refreshes, and cache-schema upgrades. The client honors `Retry-After` and `X-RateLimit-Reset`, with a one-hour fallback if the server provides neither. Each page costs one API request; see the [current tier limits](https://artificialanalysis.ai/data-api/docs).
- Requests time out after 15 seconds per page. Closing a view cancels its request; reopening can immediately start a new request. There is no background polling.
- The header shows retrieval age. Model details include the exact retrieval time, source, and API index version. Retrieval time describes when this installation fetched data.
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

Run a build before a standalone typecheck in a fresh checkout; it generates `raycast-env.d.ts`. Production output is in `dist/`. Tests use synthetic models and mocked HTTP responses to cover data recovery, ranking, family grouping, metric directions, SVG safety, provider assets, filtering, favorites persistence, and cancellation/reopening.

The extension stays local; no publishing script or Git remote is configured.

## Attribution

Data: [Artificial Analysis](https://artificialanalysis.ai/), through its [documented Free API](https://artificialanalysis.ai/data-api/docs/reference). This is an independent client.

Provider logos: [Lobe Icons](https://github.com/lobehub/lobe-icons), static SVG package version 1.95.1. The original MIT license is included under `assets/providers/LICENSE`; the marks belong to their owners.

The extension code uses the MIT license. Artificial Analysis retains its rights in its data.
