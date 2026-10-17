import { Action, ActionPanel, Color, Icon, type Image } from "@raycast/api";
import type { MetricKey } from "../lib/metrics";
import { Dashboard } from "./dashboard";
import { RankingsList } from "./rankings-list";

const METRIC_ICONS: Record<MetricKey, Icon> = {
  intelligence: Icon.LightBulb,
  coding: Icon.Code,
  speed: Icon.Bolt,
  inputPrice: Icon.Coins,
  outputPrice: Icon.Coins,
  latency: Icon.Stopwatch,
};

const METRIC_COLORS: Record<MetricKey, Color> = {
  intelligence: Color.Blue,
  coding: Color.Purple,
  speed: Color.Orange,
  inputPrice: Color.Green,
  outputPrice: Color.Green,
  latency: Color.Magenta,
};

/** The metric's icon, tinted with the color used for it throughout the extension. */
export function metricIcon(metric: MetricKey): Image.ImageLike {
  return { source: METRIC_ICONS[metric], tintColor: METRIC_COLORS[metric] };
}

export interface Leaderboard {
  /** Name in menus, matching the command title. */
  title: string;
  /** Short caption for dashboard tiles. */
  caption: string;
  icon: Image.ImageLike;
  metric: MetricKey;
  pricing?: boolean;
  favoritesOnly?: boolean;
}

/** Leaderboards beyond the Intelligence Index, in the order the dashboard shows them. */
export const LEADERBOARDS: Leaderboard[] = [
  { title: "Best Coding Models", caption: "Best Coding", icon: metricIcon("coding"), metric: "coding" },
  { title: "Fastest AI Models", caption: "Fastest", icon: metricIcon("speed"), metric: "speed" },
  { title: "Lowest Latency Models", caption: "Lowest Latency", icon: metricIcon("latency"), metric: "latency" },
  {
    title: "Model Pricing",
    caption: "Lowest Price",
    icon: metricIcon("inputPrice"),
    metric: "inputPrice",
    pricing: true,
  },
  {
    title: "Favorites",
    caption: "Favorites",
    icon: { source: Icon.Star, tintColor: Color.Yellow },
    metric: "intelligence",
    favoritesOnly: true,
  },
];

export function LeaderboardList({ board, providerId }: { board: Leaderboard; providerId?: string }) {
  return (
    <RankingsList
      initialMetric={board.metric}
      pricing={board.pricing}
      initialFavoritesOnly={board.favoritesOnly}
      initialProviderId={providerId}
    />
  );
}

export function LeaderboardsSubmenu() {
  return (
    <ActionPanel.Submenu title="Browse Leaderboards" icon={Icon.Leaderboard}>
      <Action.Push title="Top Models" icon={{ source: Icon.Trophy, tintColor: Color.Yellow }} target={<Dashboard />} />
      <Action.Push title="All AI Models" icon={metricIcon("intelligence")} target={<RankingsList />} />
      {LEADERBOARDS.map((board) => (
        <Action.Push
          key={board.title}
          title={board.title}
          icon={board.icon}
          target={<LeaderboardList board={board} />}
        />
      ))}
    </ActionPanel.Submenu>
  );
}
