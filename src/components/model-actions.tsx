import { Action, ActionPanel, Icon, Keyboard, openExtensionPreferences } from "@raycast/api";
import type { useFavorites } from "../hooks/use-favorites";
import type { BrowseControls } from "../hooks/use-rankings";
import { API_KEY_URL, LEADERBOARD_URL } from "../lib/api";
import { ALL_PROVIDERS } from "../lib/filters";
import { modelSummary, modelUrl, type MetricPreferences } from "../lib/format";
import { providerIcon } from "../lib/images";
import { METRICS } from "../lib/metrics";
import type { LeaderboardSnapshot, RankedModel } from "../lib/models";
import { Dashboard } from "./dashboard";
import { ModelDetails } from "./model-details";
import { RankingsList } from "./rankings-list";

interface ActionsProps {
  model?: RankedModel;
  snapshot?: LeaderboardSnapshot;
  preferences: MetricPreferences;
  refresh: () => Promise<void>;
  details?: boolean;
  favorites: ReturnType<typeof useFavorites>;
  controls?: BrowseControls;
}

export function ModelActions({
  model,
  snapshot,
  preferences,
  refresh,
  details = true,
  favorites,
  controls,
}: ActionsProps) {
  return (
    <ActionPanel>
      {model && details ? (
        <Action.Push
          title="View Model Details"
          icon={Icon.Sidebar}
          target={<ModelDetails modelId={model.id} metric={model.metric} />}
        />
      ) : null}
      {model ? (
        <Action
          title={favorites.ids.has(model.id) ? "Remove from Favorites" : "Add to Favorites"}
          icon={favorites.ids.has(model.id) ? Icon.StarDisabled : Icon.Star}
          shortcut={Keyboard.Shortcut.Common.Pin}
          onAction={() => favorites.toggle(model.id)}
        />
      ) : null}
      <Action
        title="Refresh Rankings"
        icon={Icon.ArrowClockwise}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={refresh}
      />
      <ActionPanel.Submenu title="View" icon={Icon.AppWindowList}>
        <Action.Push title="Top Five Models" icon={Icon.Stars} target={<Dashboard />} />
        <Action.Push title="All AI Models" icon={Icon.List} target={<RankingsList />} />
        <Action.Push title="Favorites" icon={Icon.Star} target={<RankingsList initialFavoritesOnly />} />
        <Action.Push title="Best Coding Models" icon={Icon.Code} target={<RankingsList initialMetric="coding" />} />
        <Action.Push title="Fastest AI Models" icon={Icon.Bolt} target={<RankingsList initialMetric="speed" />} />
        <Action.Push
          title="Model Pricing"
          icon={Icon.Coins}
          target={<RankingsList initialMetric="inputPrice" pricing />}
        />
        <Action.Push
          title="Lowest Latency Models"
          icon={Icon.Stopwatch}
          target={<RankingsList initialMetric="latency" />}
        />
      </ActionPanel.Submenu>
      {controls ? (
        <ActionPanel.Submenu title="Filter" icon={Icon.Filter}>
          <ActionPanel.Submenu title="Provider" icon={Icon.Person}>
            <Action
              title="All Providers"
              icon={controls.providerId === ALL_PROVIDERS ? Icon.Checkmark : Icon.Circle}
              onAction={() => controls.setProviderId(ALL_PROVIDERS)}
            />
            {controls.creators.map((creator) => (
              <Action
                key={creator.id}
                title={creator.name}
                icon={controls.providerId === creator.id ? Icon.Checkmark : providerIcon(creator.name)}
                onAction={() => controls.setProviderId(creator.id)}
              />
            ))}
          </ActionPanel.Submenu>
          {controls.allowFavorites ? (
            <Action
              title={controls.favoritesOnly ? "Show All Models" : "Show Favorites Only"}
              icon={Icon.Star}
              onAction={() => controls.setFavoritesOnly(!controls.favoritesOnly)}
            />
          ) : null}
          <Action
            title="Clear Filters"
            icon={Icon.XMarkCircle}
            onAction={() => {
              controls.setProviderId(ALL_PROVIDERS);
              controls.setFavoritesOnly(false);
            }}
          />
        </ActionPanel.Submenu>
      ) : null}
      {model ? (
        <ActionPanel.Submenu title="Copy" icon={Icon.Clipboard}>
          <Action.CopyToClipboard
            title="Model Summary"
            content={snapshot ? modelSummary(model, snapshot, preferences) : model.name}
            shortcut={Keyboard.Shortcut.Common.Copy}
          />
          <Action.CopyToClipboard title="Model Name" content={model.name} />
          <Action.CopyToClipboard title={`${METRICS[model.metric].title} Value`} content={String(model.value)} />
          <Action.CopyToClipboard title="Model Link" content={modelUrl(model.slug)} />
        </ActionPanel.Submenu>
      ) : null}
      <ActionPanel.Submenu title="Open" icon={Icon.Globe}>
        {model ? <Action.OpenInBrowser title="Model on Artificial Analysis" url={modelUrl(model.slug)} /> : null}
        <Action.OpenInBrowser title="Intelligence Index Leaderboard" url={LEADERBOARD_URL} />
        <Action.OpenInBrowser title="Get a Free API Key" url={API_KEY_URL} />
      </ActionPanel.Submenu>
      <Action title="Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
    </ActionPanel>
  );
}
