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
import { useFavorites } from "../hooks/use-favorites";
import { API_KEY_URL, LEADERBOARD_URL } from "../lib/api";
import { browseCardSvg, modelCardSvg } from "../lib/cards";
import { distinctModelRankings, familyName } from "../lib/families";
import { ALL_PROVIDERS, browseEntries, providers } from "../lib/filters";
import { formatAge, formatRetrievedAt, modelSummary, modelUrl, type MetricPreferences } from "../lib/format";
import { logoSvg, providerIcon, svgImage } from "../lib/images";
import { METRICS, type MetricKey } from "../lib/metrics";
import { rankModels, type LeaderboardSnapshot, type RankedModel } from "../lib/models";

function useData() {
  const preferences = getPreferenceValues<Preferences>();
  return { ...useLeaderboard(preferences.apiKey), preferences, favorites: useFavorites() };
}

function useBrowseControls(
  snapshot: LeaderboardSnapshot | undefined,
  initialFavoritesOnly = false,
  allowFavorites = true,
) {
  const [providerId, setProviderId] = useState(ALL_PROVIDERS);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const creators = useMemo(() => providers(snapshot?.models ?? []), [snapshot]);
  return { providerId, setProviderId, favoritesOnly, setFavoritesOnly, creators, allowFavorites };
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
  favorites: ReturnType<typeof useFavorites>;
  controls?: ReturnType<typeof useBrowseControls>;
}

function ModelActions({ model, snapshot, preferences, refresh, details = true, favorites, controls }: ActionsProps) {
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

function failureMessage(data: ReturnType<typeof useData>): string | undefined {
  if (!data.error) return undefined;
  return `${data.error.message}${data.error.retryAt ? ` Retry after ${formatRetrievedAt(data.error.retryAt)}.` : ""}`;
}

export function Dashboard() {
  const data = useData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const controls = useBrowseControls(data.snapshot, false, false);
  const families = useMemo(() => distinctModelRankings(data.snapshot?.models ?? []), [data.snapshot]);
  const visible = useMemo(
    () =>
      browseEntries(
        families,
        search,
        { providerId: controls.providerId, favoritesOnly: false },
        data.favorites.ids,
      ).slice(0, 5),
    [families, search, controls.providerId, controls.favoritesOnly, data.favorites.ids],
  );
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
        actions={
          <ModelActions
            preferences={data.preferences}
            favorites={data.favorites}
            controls={controls}
            refresh={() => data.refresh()}
          />
        }
      />
      {data.snapshot ? (
        <Grid.Section
          title={`Top Five · ${controls.providerId === ALL_PROVIDERS ? "Intelligence" : (controls.creators.find((creator) => creator.id === controls.providerId)?.name ?? "Provider")}`}
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
                  favorites={data.favorites}
                  controls={controls}
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
  initialFavoritesOnly = false,
}: {
  initialMetric?: MetricKey;
  pricing?: boolean;
  initialFavoritesOnly?: boolean;
}) {
  const data = useData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [metric, setMetric] = useState(initialMetric);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const controls = useBrowseControls(data.snapshot, initialFavoritesOnly);
  const ranked = useMemo(() => rankModels(data.snapshot?.models ?? [], metric), [data.snapshot, metric]);
  const visible = useMemo(
    () =>
      browseEntries(
        ranked,
        search,
        { providerId: controls.providerId, favoritesOnly: controls.favoritesOnly },
        data.favorites.ids,
      ),
    [ranked, search, controls.providerId, controls.favoritesOnly, data.favorites.ids],
  );
  if (data.needsApiKey) return <Setup />;
  const error = failureMessage(data);
  const definition = METRICS[metric];
  return (
    <List
      onSelectionChange={setSelectedId}
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
        actions={
          <ModelActions
            preferences={data.preferences}
            favorites={data.favorites}
            controls={controls}
            refresh={() => data.refresh()}
          />
        }
      />
      {data.snapshot ? (
        <List.Section
          title={`${controls.favoritesOnly ? "Favorites · " : ""}${definition.title}${metric === "inputPrice" || metric === "outputPrice" ? " · USD/1M" : ""}${controls.providerId !== ALL_PROVIDERS ? ` · ${controls.creators.find((creator) => creator.id === controls.providerId)?.name ?? "Provider"}` : ""}`}
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
                (visible.some((entry) => entry.id === selectedId) ? selectedId : visible[0]?.id) === model.id ? (
                  <ModelActions
                    model={model}
                    snapshot={data.snapshot}
                    preferences={data.preferences}
                    favorites={data.favorites}
                    controls={controls}
                    refresh={() => data.refresh()}
                  />
                ) : undefined
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
  const configuration = model.name.slice(familyName(model.name).length).trim();
  return (
    <Detail
      navigationTitle={familyName(model.name)}
      isLoading={data.isLoading}
      markdown={`# ${markdownText(familyName(model.name))}\n\n# ${METRICS[metric].format(model.value)}\n\n${METRICS[metric].title}${configuration ? `\n\nConfiguration: ${markdownText(configuration)}` : ""}${warning ? `\n\n> Cached data: ${markdownText(warning)}` : ""}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Configuration Rank" text={`#${model.rank}`} />
          <Detail.Metadata.Label title="Provider" text={model.creator} icon={providerIcon(model.creator)} />
          <Detail.Metadata.Label title="Configuration" text={model.name} />
          <Detail.Metadata.Separator />
          {[...metadata].map((key) => (
            <Detail.Metadata.Label
              key={key}
              title={`${METRICS[key].title}${key === "inputPrice" || key === "outputPrice" ? " · USD/1M" : ""}`}
              text={METRICS[key].format(model[key])}
            />
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
          favorites={data.favorites}
          refresh={() => data.refresh()}
          details={false}
        />
      }
    />
  );
}
