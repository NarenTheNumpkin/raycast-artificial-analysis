import { Action, ActionPanel, Icon } from "@raycast/api";
import type { MetricKey } from "../lib/metrics";
import { Dashboard } from "./dashboard";
import { RankingsList } from "./rankings-list";

export const METRIC_ICONS: Record<MetricKey, Icon> = {
  intelligence: Icon.LightBulb,
  coding: Icon.Code,
  speed: Icon.Bolt,
  inputPrice: Icon.Coins,
  outputPrice: Icon.Coins,
  latency: Icon.Stopwatch,
};

export function LeaderboardsSubmenu() {
  return (
    <ActionPanel.Submenu title="Browse Leaderboards" icon={Icon.Leaderboard}>
      <Action.Push title="Top Five Models" icon={Icon.Trophy} target={<Dashboard />} />
      <Action.Push title="All AI Models" icon={METRIC_ICONS.intelligence} target={<RankingsList />} />
      <Action.Push title="Favorites" icon={Icon.Star} target={<RankingsList initialFavoritesOnly />} />
      <Action.Push
        title="Best Coding Models"
        icon={METRIC_ICONS.coding}
        target={<RankingsList initialMetric="coding" />}
      />
      <Action.Push
        title="Fastest AI Models"
        icon={METRIC_ICONS.speed}
        target={<RankingsList initialMetric="speed" />}
      />
      <Action.Push
        title="Model Pricing"
        icon={METRIC_ICONS.inputPrice}
        target={<RankingsList initialMetric="inputPrice" pricing />}
      />
      <Action.Push
        title="Lowest Latency Models"
        icon={METRIC_ICONS.latency}
        target={<RankingsList initialMetric="latency" />}
      />
    </ActionPanel.Submenu>
  );
}
