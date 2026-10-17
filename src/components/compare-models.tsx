import { Action, ActionPanel, Color, Icon, List, useNavigation } from "@raycast/api";
import { useMemo, useState } from "react";
import { MAX_COMPARED_MODELS } from "../hooks/use-comparison";
import { updatedText, useNow, useRankingsData, type RankingsData } from "../hooks/use-rankings";
import { compareMetric, type Verdict } from "../lib/compare";
import { configurationLabel, familyName } from "../lib/families";
import { modelUrl } from "../lib/format";
import { providerIcon } from "../lib/images";
import { METRIC_GROUPS, METRICS } from "../lib/metrics";
import { filterRankings, rankModels, type Model } from "../lib/models";
import { metricIcon } from "./leaderboards";
import { unavailableState } from "./load-states";
import { GeneralActions } from "./model-actions";
import { ModelDetails } from "./model-details";
import { Setup } from "./setup";

const VERDICT_COLORS: Partial<Record<Verdict, Color>> = { best: Color.Green, worst: Color.Red };
const ADD_ICON = { source: Icon.PlusCircle, tintColor: Color.Blue };

export function CompareModels() {
  const data = useRankingsData();
  const now = useNow();
  const models = useMemo(() => {
    const byId = new Map((data.snapshot?.models ?? []).map((model) => [model.id, model]));
    return [...data.comparison.ids].flatMap((id) => byId.get(id) ?? []);
  }, [data.snapshot, data.comparison.ids]);
  if (data.needsApiKey) return <Setup />;
  const unavailable = data.snapshot ? undefined : unavailableState(data);
  return (
    <List navigationTitle="Compare Models" searchBarPlaceholder="Filter models and metrics…" isLoading={data.isLoading}>
      <List.EmptyView
        title={unavailable?.title ?? "No Models to Compare"}
        description={
          unavailable?.description ?? `Press ↵ to choose up to ${MAX_COMPARED_MODELS} models and see them side by side.`
        }
        icon={unavailable?.icon ?? Icon.BarChart}
        actions={unavailable?.actions ?? <ComparisonActions data={data} />}
      />
      {data.snapshot && models.length ? (
        <>
          <List.Section
            title="Models"
            subtitle={`${models.length} of ${MAX_COMPARED_MODELS} · Green is better, red is worse · ${updatedText(data, now)}`}
          >
            {models.map((model) => (
              <List.Item
                key={model.id}
                id={model.id}
                icon={{ value: providerIcon(model.creator), tooltip: model.creator }}
                title={{ value: familyName(model.name), tooltip: model.name }}
                subtitle={configurationLabel(model.name)}
                accessories={[{ text: model.creator }]}
                actions={<ComparisonActions data={data} model={model} />}
              />
            ))}
            {models.length < MAX_COMPARED_MODELS ? (
              <List.Item
                id="add-model"
                icon={ADD_ICON}
                title="Add a Model"
                subtitle={`Room for ${MAX_COMPARED_MODELS - models.length} more`}
                actions={<ComparisonActions data={data} />}
              />
            ) : null}
          </List.Section>
          {METRIC_GROUPS.map((group) => (
            <List.Section key={group.title} title={group.title}>
              {group.metrics.map((metric) => (
                <List.Item
                  key={metric}
                  id={`metric-${metric}`}
                  icon={metricIcon(metric)}
                  title={METRICS[metric].title}
                  accessories={compareMetric(models, metric).map(({ model, value, verdict }) => ({
                    tag: { value: METRICS[metric].format(value), color: VERDICT_COLORS[verdict] },
                    icon: providerIcon(model.creator),
                    tooltip: `${model.name}: ${METRICS[metric].format(value)}${
                      verdict === "best" ? " (best)" : verdict === "worst" ? " (worst)" : ""
                    }`,
                  }))}
                  actions={<ComparisonActions data={data} />}
                />
              ))}
            </List.Section>
          ))}
        </>
      ) : null}
    </List>
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
