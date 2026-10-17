import { List } from "@raycast/api";
import { useMemo, useState } from "react";
import { failureMessage, useBrowseControls, useNow, useRankingsData } from "../hooks/use-rankings";
import { ALL_PROVIDERS, browseEntries } from "../lib/filters";
import { formatAge } from "../lib/format";
import { providerIcon } from "../lib/images";
import { METRICS, type MetricKey } from "../lib/metrics";
import { rankModels } from "../lib/models";
import { ModelActions } from "./model-actions";
import { Setup } from "./setup";

export function RankingsList({
  initialMetric = "intelligence",
  pricing = false,
  initialFavoritesOnly = false,
}: {
  initialMetric?: MetricKey;
  pricing?: boolean;
  initialFavoritesOnly?: boolean;
}) {
  const data = useRankingsData();
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
        actions={<ModelActions data={data} controls={controls} />}
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
                  <ModelActions data={data} model={model} controls={controls} />
                ) : undefined
              }
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}
