import {
  Action,
  ActionPanel,
  Color,
  getPreferenceValues,
  Icon,
  Keyboard,
  List,
  openExtensionPreferences,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { useLeaderboard } from "./hooks/use-leaderboard";
import { API_KEY_URL, LEADERBOARD_URL } from "./lib/api";
import {
  displayMetrics,
  formatAge,
  formatRetrievedAt,
  modelSummary,
  modelUrl,
  type MetricPreferences,
} from "./lib/format";
import { filterRankings, rankModels, type LeaderboardSnapshot, type RankedModel } from "./lib/models";

interface ActionsProps {
  model?: RankedModel;
  snapshot?: LeaderboardSnapshot;
  preferences: MetricPreferences;
  refresh: () => Promise<void>;
}

function LeaderboardActions({ model, snapshot, preferences, refresh }: ActionsProps) {
  return (
    <ActionPanel>
      {model ? <Action.OpenInBrowser title="Open Model on Artificial Analysis" url={modelUrl(model.slug)} /> : null}
      <Action
        title="Refresh Rankings"
        icon={Icon.ArrowClockwise}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={refresh}
      />
      {model && snapshot ? (
        <Action.CopyToClipboard
          title="Copy Model Summary"
          content={modelSummary(model, snapshot, preferences)}
          shortcut={Keyboard.Shortcut.Common.Copy}
        />
      ) : null}
      <Action.OpenInBrowser
        title="Open Intelligence Index Leaderboard"
        url={LEADERBOARD_URL}
        shortcut={{ modifiers: ["cmd"], key: "l" }}
      />
      <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
      <Action.OpenInBrowser title="Get a Free API Key" url={API_KEY_URL} />
    </ActionPanel>
  );
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { snapshot, error, isLoading, needsApiKey, refresh } = useLeaderboard(preferences.apiKey);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now);
  const ranked = useMemo(() => rankModels(snapshot?.models ?? []), [snapshot]);
  const visible = useMemo(() => filterRankings(ranked, search), [ranked, search]);
  const retryNotice = error?.retryAt ? ` Retry after ${formatRetrievedAt(error.retryAt)}.` : "";

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (needsApiKey) {
    return (
      <List navigationTitle="AI Model Rankings" searchBarPlaceholder="Set up your Artificial Analysis API key">
        <List.EmptyView
          icon={Icon.Key}
          title="Set Up Artificial Analysis"
          description="Add a free Artificial Analysis API key in extension preferences to load model rankings. You can close this screen and return whenever you’re ready."
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
              <Action.OpenInBrowser title="Get a Free API Key" url={API_KEY_URL} />
              <Action.OpenInBrowser title="Open Intelligence Index Leaderboard" url={LEADERBOARD_URL} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const commonActions = <LeaderboardActions preferences={preferences} refresh={() => refresh()} />;
  let emptyTitle = "No Intelligence Index Scores";
  let emptyDescription = "Artificial Analysis has not returned any published Intelligence Index scores.";
  if (ranked.length && search.trim()) {
    emptyTitle = "No Models Match";
    emptyDescription = "Try searching for a model name or creator.";
  } else if (isLoading && !snapshot) {
    emptyTitle = "Loading Rankings…";
    emptyDescription = "Retrieving the Artificial Analysis leaderboard.";
  }
  if (error) {
    if (!snapshot) emptyTitle = "Unable to Load Rankings";
    emptyDescription = `${error.message}${retryNotice}`;
  }

  return (
    <List
      navigationTitle={
        snapshot ? `AI Model Rankings · Intelligence Index v${snapshot.indexVersion}` : "AI Model Rankings"
      }
      searchBarPlaceholder="Search models or creators…"
      searchText={search}
      onSearchTextChange={setSearch}
      filtering={false}
      isLoading={isLoading}
    >
      <List.EmptyView
        title={emptyTitle}
        description={emptyDescription}
        icon={error ? Icon.ExclamationMark : Icon.MagnifyingGlass}
        actions={commonActions}
      />
      {snapshot && error && visible.length > 0 ? (
        <List.Section title="Refresh Failed · Showing Cached Rankings">
          <List.Item
            title={error.message}
            subtitle={retryNotice.trim() || `Retrieved ${formatRetrievedAt(snapshot.fetchedAt)}`}
            icon={{ source: Icon.ExclamationMark, tintColor: Color.Orange }}
            actions={commonActions}
          />
        </List.Section>
      ) : null}
      {snapshot ? (
        <List.Section
          title="Artificial Analysis"
          subtitle={`${ranked.length} models · Retrieved ${formatRetrievedAt(snapshot.fetchedAt)} (${formatAge(snapshot.fetchedAt, now)})`}
        >
          {visible.map((model) => (
            <List.Item
              key={model.id}
              title={`#${model.rank} ${model.name}`}
              subtitle={model.creator}
              icon={{ source: Icon.BarChart, tintColor: model.rank <= 3 ? Color.Blue : Color.SecondaryText }}
              accessories={displayMetrics(model, preferences).map((metric) =>
                metric.kind === "intelligence"
                  ? { tag: { value: metric.text, color: Color.Blue }, tooltip: metric.tooltip }
                  : { text: metric.text, tooltip: metric.tooltip },
              )}
              actions={
                <LeaderboardActions
                  model={model}
                  snapshot={snapshot}
                  preferences={preferences}
                  refresh={() => refresh()}
                />
              }
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}
