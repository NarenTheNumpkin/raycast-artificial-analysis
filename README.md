# Artificial Analysis for Raycast

Open **AI Model Rankings** in Raycast to see AI models ranked by the [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index). Search by model or creator, with optional Coding Index, token prices, and output speed.

## Install locally

Requires macOS, [Raycast](https://www.raycast.com/), npm, and **Node.js 22.22.2 or later** (Node.js 24 LTS is suitable).

1. Open [Artificial Analysis API key management](https://artificialanalysis.ai/api-key-management-redirect), sign up or log in, and create a free API key.
2. In Terminal, run:

   ```sh
   cd /Users/naren/AAII
   npm ci
   npm run dev
   ```

3. Open Raycast and search for **AI Model Rankings**. Choose **Open Extension Preferences** on the setup screen and enter your API key in the password preference. You can dismiss setup and reopen the command safely without entering a key.
4. Return to **AI Model Rankings** to load the leaderboard. After registration, stopping development with `Ctrl+C` leaves the extension available in Raycast. Run `npm run dev` again when changing its source.

Use a personal key entered in Raycast preferences. No key needs to be added to a source file, terminal command, or Git.

## Configure the display

Open the command's action panel (`⌘K`) and choose **Open Extension Preferences**, or find **Artificial Analysis** in Raycast Settings → Extensions.

| Preference                   | Default  | Displayed value                                |
| ---------------------------- | -------- | ---------------------------------------------- |
| Artificial Analysis API Key  | Required | Your personal Free, Pro, or Commercial API key |
| Show Coding Index            | Off      | Artificial Analysis Coding Index               |
| Show Input and Output Prices | Off      | Input / output, in USD per million tokens      |
| Show Output Speed            | Off      | Median output tokens per second (`t/s`)        |

Intelligence Index is always visible. Optional statistics add information to each row; rankings remain ordered by Intelligence Index. Hover over any statistic for its label and units.

To open the list quickly, assign an alias (for example, `aaii`) or a hotkey to **AI Model Rankings** in Raycast Settings → Extensions.

## Use the command

| Action                                     | Shortcut  |
| ------------------------------------------ | --------- |
| Search by model name and/or creator        | Type      |
| Select a model                             | `↑` / `↓` |
| Open selected model on Artificial Analysis | `↵`       |
| Open action panel                          | `⌘K`      |
| Refresh rankings                           | `⌘R`      |
| Copy selected model summary                | `⌘⇧C`     |
| Open the Intelligence Index leaderboard    | `⌘L`      |

All returned models with a finite Intelligence Index score are included. Separately evaluated configurations, such as different reasoning settings, remain separate entries. Missing scores are excluded; a measured zero remains valid. Equal raw scores share competition ranks (`1, 2, 2, 4`), with tied entries ordered by name and stable ID. Search preserves global ranks and ranking order.

Scores display one decimal place, but ranks use the original unrounded values. An em dash (`—`) means a statistic is unavailable. Prices are USD per million tokens; speed is the API's provider-aggregated median output speed. The index version comes from the API and contains major/minor only, so a website patch version may be more specific.

## Refresh and offline behavior

- Cached rankings appear immediately. Opening the command fetches again when the snapshot is at least one hour old. `⌘R` requests a refresh sooner.
- The extension fetches every page before publishing new rankings. A failed page, changed index version, inconsistent pagination, or duplicate model ID leaves the previous complete snapshot intact.
- The section header shows when data was **retrieved**, including its age. This is the local retrieval time, rather than the time Artificial Analysis last evaluated a model.
- If a refresh fails, cached results remain available with a visible error. On first use without a cache, the command shows the failure and recovery actions.
- Rate limits are respected across command openings and manual refreshes, using `Retry-After` and `X-RateLimit-Reset`. If neither is supplied, the extension waits one hour before another attempt. Each page consumes an API request; the [current free tier](https://artificialanalysis.ai/data-api/docs) allows 100 requests per 24-hour quota window.
- Network requests time out after 15 seconds per page. Closing the command cancels pending requests. There is no background polling.

Responses are cached locally through Raycast, separately for each API key using a SHA-256 credential identifier. Cache contents contain normalized model data and retrieval metadata. The key is sent only in the `x-api-key` header to Artificial Analysis; it is never put in URLs, summaries, error messages, or cached response contents.

For an invalid key, update **Artificial Analysis API Key** in extension preferences. For a rate-limit error, wait until the displayed retry time. For an unexpected API response, retry later; the previous complete dataset remains available.

## Development and verification

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run lint
npm run format:check
```

The build generates `raycast-env.d.ts`, including preference types; run it before a standalone typecheck in a fresh checkout. `npm run dev` registers and hot reloads the extension. `npm run build` creates the production build in `dist/`.

Tests use synthetic data and mocked HTTP responses. They cover complete pagination, malformed responses, competition ties, missing/zero values, search ranks, cache expiry and recovery, cancellation, timeouts, rate-limit persistence, optional metric formatting, and copied summaries. A live API check requires your own key entered in Raycast.

Data client and ranking logic live in `src/lib/`; Raycast UI and hooks are separate. This repository is for local installation and has no publishing script or remote configured.

## Attribution

Data provided by [Artificial Analysis](https://artificialanalysis.ai/), using its [documented Free API](https://artificialanalysis.ai/data-api/docs/reference). The extension is an independent client.

MIT license applies to the extension's code; Artificial Analysis retains its rights in its data.
