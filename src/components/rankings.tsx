import {
  Action,
  ActionPanel,
  Detail,
  environment,
  getPreferenceValues,
  Grid,
  Icon,
  Keyboard,
  List,
  openExtensionPreferences,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { useLeaderboard } from "../hooks/use-leaderboard";
import { API_KEY_URL, LEADERBOARD_URL } from "../lib/api";
import { browseCardSvg, modelCardSvg } from "../lib/cards";
import { distinctModelRankings, familyName } from "../lib/families";
import { formatAge, formatRetrievedAt, modelSummary, modelUrl, type MetricPreferences } from "../lib/format";
import { logoSvg, providerIcon, svgImage } from "../lib/images";
import { METRICS, type MetricKey } from "../lib/metrics";
import { filterRankings, rankModels, type LeaderboardSnapshot, type RankedModel } from "../lib/models";

function useData() {
  const preferences = getPreferenceValues<Preferences>();
  return { ...useLeaderboard(preferences.apiKey), preferences };
}

function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function Setup() {
  return (
    <List navigationTitle="AI Model Rankings" searchBarPlaceholder="Set up Artificial Analysis">
      <List.EmptyView
        icon={Icon.Key}
        title="Add Your API Key"
        description="Connect your free Artificial Analysis key to see the rankings. You can return to setup anytime."
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            <Action.OpenInBrowser title="Get a Free API Key" url={API_KEY_URL} />
          </ActionPanel>
        }
      />
    </List>
  );
}

interface ActionsProps {
  model?: RankedModel;
  snapshot?: LeaderboardSnapshot;
  preferences: MetricPreferences;
  refresh: () => Promise<void>;
  details?: boolean;
}

function ModelActions({ model, snapshot, preferences, refresh, details = true }: ActionsProps) {
  return (
    <ActionPanel>
      {model && details ? (
        <Action.Push
          title="View Model Details"
          icon={Icon.Sidebar}
          target={<ModelDetails modelId={model.id} metric={model.metric} />}
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

function failureMessage(data: ReturnType<typeof useData>): string | undefined {
  if (!data.error) return undefined;
  return `${data.error.message}${data.error.retryAt ? ` Retry after ${formatRetrievedAt(data.error.retryAt)}.` : ""}`;
}

export function Dashboard() {
  const data = useData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const families = useMemo(() => distinctModelRankings(data.snapshot?.models ?? []), [data.snapshot]);
  const visible = useMemo(() => filterRankings(families, search).slice(0, 5), [families, search]);
  const cards = useMemo(
    () =>
      visible.map((model) => ({
        model,
        image: svgImage(modelCardSvg(model, environment.appearance, logoSvg(model.creator))),
      })),
    [visible],
  );
  if (data.needsApiKey) return <Setup />;
  const error = failureMessage(data);
  return (
    <Grid
      columns={3}
      aspectRatio="16/9"
      inset={Grid.Inset.Zero}
      navigationTitle="AI Model Rankings"
      searchBarPlaceholder="Find a model or provider…"
      filtering={false}
      searchText={search}
      onSearchTextChange={setSearch}
      isLoading={data.isLoading}
    >
      <Grid.EmptyView
        title={error ? "Unable to Load Rankings" : data.isLoading ? "Loading Models…" : "No Matching Models"}
        description={error ?? "Try a different model name or provider."}
        icon={error ? Icon.ExclamationMark : Icon.MagnifyingGlass}
        actions={<ModelActions preferences={data.preferences} refresh={() => data.refresh()} />}
      />
      {data.snapshot ? (
        <Grid.Section
          title="Top Five · Intelligence"
          subtitle={`Artificial Analysis · ${error ? "Cached · refresh failed" : formatAge(data.snapshot.fetchedAt, now)}`}
        >
          {cards.map(({ model, image }) => (
            <Grid.Item
              key={model.id}
              id={model.id}
              content={{
                value: image,
                tooltip: `#${model.rank} ${model.name}\n${model.creator} · Intelligence Index ${model.value}`,
              }}
              title={model.creator}
              actions={
                <ModelActions
                  model={model}
                  snapshot={data.snapshot}
                  preferences={data.preferences}
                  refresh={() => data.refresh()}
                />
              }
            />
          ))}
          {visible.length ? (
            <Grid.Item
              id="browse-all"
              content={svgImage(browseCardSvg(data.snapshot.models.length, environment.appearance))}
              title="All Evaluated Models"
              actions={
                <ActionPanel>
                  <Action.Push title="Browse All Models" icon={Icon.List} target={<RankingsList />} />
                </ActionPanel>
              }
            />
          ) : null}
        </Grid.Section>
      ) : null}
    </Grid>
  );
}

export function RankingsList({
  initialMetric = "intelligence",
  pricing = false,
}: {
  initialMetric?: MetricKey;
  pricing?: boolean;
}) {
  const data = useData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [metric, setMetric] = useState(initialMetric);
  const ranked = useMemo(() => rankModels(data.snapshot?.models ?? [], metric), [data.snapshot, metric]);
  const visible = useMemo(() => filterRankings(ranked, search), [ranked, search]);
  if (data.needsApiKey) return <Setup />;
  const error = failureMessage(data);
  const definition = METRICS[metric];
  return (
    <List
      navigationTitle={definition.commandTitle}
      searchBarPlaceholder="Search models or providers…"
      filtering={false}
      searchText={search}
      onSearchTextChange={setSearch}
      isLoading={data.isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Rank By" value={metric} onChange={(value) => setMetric(value as MetricKey)}>
          {(pricing ? (["inputPrice", "outputPrice"] as const) : (Object.keys(METRICS) as MetricKey[])).map((key) => (
            <List.Dropdown.Item key={key} title={METRICS[key].title} value={key} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        title={
          error && !data.snapshot
            ? "Unable to Load Rankings"
            : data.isLoading && !data.snapshot
              ? "Loading Models…"
              : "No Matching Measurements"
        }
        description={
          error ?? `No models match your search with a published ${definition.title.toLowerCase()} measurement.`
        }
        actions={<ModelActions preferences={data.preferences} refresh={() => data.refresh()} />}
      />
      {data.snapshot ? (
        <List.Section
          title={definition.title}
          subtitle={`Artificial Analysis · ${error ? "Cached · refresh failed" : formatAge(data.snapshot.fetchedAt, now)}`}
        >
          {visible.map((model) => (
            <List.Item
              key={model.id}
              id={model.id}
              title={{ value: `${model.rank}. ${model.name}`, tooltip: model.name }}
              icon={providerIcon(model.creator)}
              accessories={[
                { text: definition.format(model.value), tooltip: `${definition.title} · ${definition.unit}` },
              ]}
              actions={
                <ModelActions
                  model={model}
                  snapshot={data.snapshot}
                  preferences={data.preferences}
                  refresh={() => data.refresh()}
                />
              }
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}

function markdownText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/[\\`*_{}[\]<>!|#]/g, "\\$&");
}

function ModelDetails({ modelId, metric }: { modelId: string; metric: MetricKey }) {
  const data = useData();
  const model = useMemo(
    () => rankModels(data.snapshot?.models ?? [], metric).find((entry) => entry.id === modelId),
    [data.snapshot, modelId, metric],
  );
  if (data.needsApiKey) return <Setup />;
  if (!model || !data.snapshot)
    return (
      <Detail
        isLoading={data.isLoading}
        markdown={
          data.isLoading
            ? "Loading model…"
            : "# Model Unavailable\n\nThis model has no published measurement in the current dataset."
        }
      />
    );
  const p = data.preferences;
  const metadata = new Set<MetricKey>(["intelligence"]);
  if (p.showCoding) metadata.add("coding");
  if (p.showPrice || metric === "inputPrice" || metric === "outputPrice") {
    metadata.add("inputPrice");
    metadata.add("outputPrice");
  }
  if (p.showSpeed) metadata.add("speed");
  metadata.add("latency");
  metadata.delete(metric);
  const warning = failureMessage(data);
  return (
    <Detail
      navigationTitle={familyName(model.name)}
      isLoading={data.isLoading}
      markdown={`# ${markdownText(familyName(model.name))}\n\n# ${METRICS[metric].format(model.value)}\n\n${METRICS[metric].title}${warning ? `\n\n> Cached data: ${markdownText(warning)}` : ""}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Rank" text={`#${model.rank}`} />
          <Detail.Metadata.Label title="Provider" text={model.creator} icon={providerIcon(model.creator)} />
          <Detail.Metadata.Label title="Configuration" text={model.name} />
          <Detail.Metadata.Separator />
          {[...metadata].map((key) => (
            <Detail.Metadata.Label key={key} title={METRICS[key].title} text={METRICS[key].format(model[key])} />
          ))}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Index Version" text={`v${data.snapshot.indexVersion}`} />
          <Detail.Metadata.Label title="Retrieved" text={formatRetrievedAt(data.snapshot.fetchedAt)} />
          <Detail.Metadata.Link title="Source" text="Artificial Analysis" target={LEADERBOARD_URL} />
        </Detail.Metadata>
      }
      actions={
        <ModelActions
          model={model}
          snapshot={data.snapshot}
          preferences={p}
          refresh={() => data.refresh()}
          details={false}
        />
      }
    />
  );
}
