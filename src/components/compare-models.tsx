import { Action, ActionPanel, Color, environment, Grid, Icon, List, useNavigation } from "@raycast/api";
import { useMemo, useState } from "react";
import { MAX_COMPARED_MODELS } from "../hooks/use-comparison";
import { updatedText, useNow, useRankingsData, type RankingsData } from "../hooks/use-rankings";
import { addModelCardSvg, comparisonCardSvg, type ComparisonShape } from "../lib/cards";
import { compareMetric } from "../lib/compare";
import { configurationLabel, familyName } from "../lib/families";
import { modelUrl } from "../lib/format";
import { logoSvg, providerIcon, svgImage } from "../lib/images";
import { METRIC_ORDER, METRICS } from "../lib/metrics";
import { filterRankings, rankModels, type Model } from "../lib/models";
import { unavailableState } from "./load-states";
import { GeneralActions } from "./model-actions";
import { ModelDetails } from "./model-details";
import { Setup } from "./setup";

const ADD_ICON = { source: Icon.PlusCircle, tintColor: Color.Blue };

/**
 * Three portrait columns until a fourth model joins, then four tall ones. Both fit the Raycast window
 * without scrolling, and the next empty column holds the Add a Model card.
 */
function comparisonLayout(count: number): {
  columns: number;
  shape: ComparisonShape;
  aspectRatio: "3/4" | "9/16";
} {
  return count < 3
    ? { columns: 3, shape: "portrait", aspectRatio: "3/4" }
    : { columns: 4, shape: "tall", aspectRatio: "9/16" };
}

export function CompareModels() {
  const data = useRankingsData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const models = useMemo(() => {
    const byId = new Map((data.snapshot?.models ?? []).map((model) => [model.id, model]));
    return [...data.comparison.ids].flatMap((id) => byId.get(id) ?? []);
  }, [data.snapshot, data.comparison.ids]);
  const ranked = useMemo(() => rankModels(data.snapshot?.models ?? []), [data.snapshot]);
  const matches = useMemo(() => (search.trim() ? filterRankings(ranked, search).slice(0, 12) : []), [ranked, search]);
  const layout = comparisonLayout(models.length);
  const cards = useMemo(() => {
    const verdicts = METRIC_ORDER.map((metric) => compareMetric(models, metric));
    return models.map((model, index) => ({
      model,
      image: svgImage(
        comparisonCardSvg(
          {
            name: familyName(model.name),
            configuration: [model.creator, configurationLabel(model.name)].filter(Boolean).join(" · "),
            logo: logoSvg(model.creator),
            values: METRIC_ORDER.map((metric, row) => ({
              label: METRICS[metric].label,
              value: METRICS[metric].formatBare(verdicts[row][index].value),
              verdict: verdicts[row][index].verdict,
            })),
          },
          environment.appearance,
          layout.shape,
        ),
      ),
    }));
  }, [models, layout.shape]);
  if (data.needsApiKey) return <Setup />;
  const searching = search.trim().length > 0;
  const unavailable = data.snapshot ? undefined : unavailableState(data);
  const addModel = <ComparisonActions data={data} />;
  return (
    <Grid
      navigationTitle="Compare Models"
      searchBarPlaceholder="Type a model name to add it…"
      filtering={false}
      searchText={search}
      onSearchTextChange={setSearch}
      inset={Grid.Inset.Zero}
      isLoading={data.isLoading}
    >
      <Grid.EmptyView
        title={unavailable?.title ?? (searching ? "No Matching Models" : "No Models to Compare")}
        description={
          unavailable?.description ??
          (searching
            ? "Try another model or provider name."
            : `Type a model name above, or press ↵ to choose up to ${MAX_COMPARED_MODELS} models.`)
        }
        icon={unavailable?.icon ?? (searching ? Icon.MagnifyingGlass : Icon.BarChart)}
        actions={unavailable?.actions ?? addModel}
      />
      {data.snapshot && searching ? (
        <Grid.Section
          title="Add to Comparison"
          subtitle={`${models.length} of ${MAX_COMPARED_MODELS} selected`}
          columns={6}
          aspectRatio="1"
          inset={Grid.Inset.Large}
        >
          {matches.map((model) => {
            const added = data.comparison.ids.has(model.id);
            return (
              <Grid.Item
                key={model.id}
                id={model.id}
                content={{ value: providerIcon(model.creator), tooltip: model.name }}
                title={familyName(model.name)}
                subtitle={added ? "✓ Added" : configurationLabel(model.name) || model.creator}
                actions={
                  <ActionPanel title={model.name}>
                    <Action
                      title={added ? "Remove from Comparison" : "Add to Comparison"}
                      icon={added ? Icon.MinusCircle : Icon.PlusCircle}
                      onAction={async () => {
                        await data.comparison.toggle(model.id);
                        setSearch("");
                      }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </Grid.Section>
      ) : null}
      {data.snapshot && !searching && models.length ? (
        <Grid.Section
          title={models.length === 1 ? "Add One More Model to Compare" : `Comparing ${models.length} Models`}
          subtitle={`Green is better, red is worse · ${updatedText(data, now)}`}
          columns={layout.columns}
          aspectRatio={layout.aspectRatio}
        >
          {cards.map(({ model, image }) => (
            <Grid.Item
              key={model.id}
              id={model.id}
              content={{ value: image, tooltip: `${model.name} · ${model.creator}` }}
              actions={<ComparisonActions data={data} model={model} />}
            />
          ))}
          {models.length < MAX_COMPARED_MODELS ? (
            <Grid.Item
              id="add-model"
              content={{
                value: svgImage(addModelCardSvg(environment.appearance, layout.shape)),
                tooltip: "Add a model",
              }}
              actions={addModel}
            />
          ) : null}
        </Grid.Section>
      ) : null}
    </Grid>
  );
}

function ComparisonActions({ data, model }: { data: RankingsData; model?: Model }) {
  const full = data.comparison.ids.size >= MAX_COMPARED_MODELS;
  return (
    <ActionPanel title={model?.name}>
      {model ? (
        <ActionPanel.Section>
          <Action.Push
            title="View Model Details"
            icon={Icon.Sidebar}
            target={<ModelDetails modelId={model.id} metric="intelligence" />}
          />
          <Action
            title="Remove from Comparison"
            icon={Icon.MinusCircle}
            onAction={() => data.comparison.toggle(model.id)}
          />
          <Action.OpenInBrowser title="Open on Artificial Analysis" url={modelUrl(model.slug)} />
        </ActionPanel.Section>
      ) : null}
      <ActionPanel.Section>
        {full ? null : <Action.Push title="Add Models" icon={ADD_ICON} target={<ModelPicker />} />}
        {data.comparison.ids.size ? (
          <Action title="Clear Comparison" icon={Icon.XMarkCircle} onAction={() => data.comparison.clear()} />
        ) : null}
      </ActionPanel.Section>
      <GeneralActions data={data} />
    </ActionPanel>
  );
}

/** Every ranked model; press ↵ to add or remove one, then go back to see the comparison. */
function ModelPicker() {
  const data = useRankingsData();
  const { pop } = useNavigation();
  const [search, setSearch] = useState("");
  const ranked = useMemo(() => rankModels(data.snapshot?.models ?? []), [data.snapshot]);
  const rows = useMemo(() => filterRankings(ranked, search), [ranked, search]);
  const selected = data.comparison.ids.size;
  return (
    <List
      navigationTitle="Add Models to Compare"
      searchBarPlaceholder="Search models or providers…"
      filtering={false}
      searchText={search}
      onSearchTextChange={setSearch}
      isLoading={data.isLoading}
    >
      <List.EmptyView title="No Matching Models" description="Try another model or provider name." />
      <List.Section
        title={`Choose up to ${MAX_COMPARED_MODELS}`}
        subtitle={`${selected} selected · Ranked by ${METRICS.intelligence.title}`}
      >
        {rows.map((model) => {
          const added = data.comparison.ids.has(model.id);
          return (
            <List.Item
              key={model.id}
              id={model.id}
              icon={{ value: providerIcon(model.creator), tooltip: model.creator }}
              title={{ value: `${model.rank}. ${familyName(model.name)}`, tooltip: model.name }}
              subtitle={configurationLabel(model.name)}
              accessories={[
                ...(added ? [{ icon: { source: Icon.CheckCircle, tintColor: Color.Green }, tooltip: "Added" }] : []),
                { text: METRICS.intelligence.format(model.value) },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title={added ? "Remove from Comparison" : "Add to Comparison"}
                    icon={added ? Icon.MinusCircle : Icon.PlusCircle}
                    onAction={() => data.comparison.toggle(model.id)}
                  />
                  {selected ? <Action title="Done" icon={Icon.Checkmark} onAction={pop} /> : null}
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
