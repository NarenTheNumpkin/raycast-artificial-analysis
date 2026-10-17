<p align="center">
  <img src="media/icon.png" width="112" height="112" alt="Artificial Analysis for Raycast">
</p>

<h1 align="center">Artificial Analysis for Raycast</h1>

<p align="center">
  Compare AI models by intelligence, coding, speed, latency, and price, without leaving Raycast.
</p>

<p align="center">
  <img alt="Raycast extension" src="https://img.shields.io/badge/Raycast-extension-FF6363?logo=raycast&logoColor=white">
  <img alt="macOS" src="https://img.shields.io/badge/platform-macOS-000000?logo=apple&logoColor=white">
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

## Features

- **Top models at a glance:** the five strongest model families on the Intelligence Index.
- **Six leaderboards:** intelligence, coding, output speed, latency, input price, and output price.
- **Model details:** every metric for a model, with its rank against all others.
- **Side-by-side comparison:** compare up to four models, with better values in green and worse in red.
- **Favorites and filters:** star models, filter by provider, and search by name.

## Setup

1. Create a free API key at [Artificial Analysis](https://artificialanalysis.ai/api-key-management-redirect).
2. Open **AI Model Rankings** in Raycast, press `↵`, and paste the key into the extension preferences.

The preferences also let you choose which statistics appear in model details.

## Commands

| Command               | Shows                                                    |
| --------------------- | -------------------------------------------------------- |
| AI Model Rankings     | The top five models, with shortcuts to every leaderboard |
| All AI Models         | Every model, ranked by Intelligence Index                |
| Best Coding Models    | Models ranked by Coding Index                            |
| Fastest AI Models     | Models ranked by output tokens per second                |
| Lowest Latency Models | Models ranked by time to first token                     |
| Model Pricing         | Models ranked by input or output price per 1M tokens     |
| Compare Models        | Up to four models side by side, best and worst marked    |

## Keyboard Shortcuts

| Shortcut | Action                                             |
| -------- | -------------------------------------------------- |
| `↵`      | View model details                                 |
| `⌘ ↵`    | Open the model on Artificial Analysis              |
| `⌘ P`    | Switch the ranking metric, or the dashboard filter |
| `⌘ D`    | Show or hide the details panel                     |
| `⌘ .`    | Add or remove a favorite                           |
| `⌘ ⇧ A`  | Add or remove a model from the comparison          |
| `⌘ ⇧ V`  | Open the comparison                                |
| `⌘ ⇧ F`  | Show favorites only                                |
| `⌘ ⇧ P`  | Filter by provider                                 |
| `⌘ ⇧ C`  | Copy a model summary                               |
| `⌘ R`    | Refresh rankings                                   |

## Privacy

Your API key is stored by Raycast and sent only to Artificial Analysis. Rankings are cached locally and refreshed when they are more than an hour old.

## Development

Requires Node.js 22.22.2 or later.

```sh
npm install
npm run dev     # load the extension in Raycast
npm test        # run unit tests
npm run lint    # check code style
```

## Credits

Data from [Artificial Analysis](https://artificialanalysis.ai/). This is an independent project, not affiliated with Artificial Analysis. Provider logos from [Lobe Icons](https://github.com/lobehub/lobe-icons) (MIT). Released under the [MIT License](LICENSE).
