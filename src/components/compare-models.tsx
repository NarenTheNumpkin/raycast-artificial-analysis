import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useMemo } from "react";
import { MAX_COMPARED_MODELS } from "../hooks/use-comparison";
import { updatedText, useNow, useRankingsData, type RankingsData } from "../hooks/use-rankings";
import { compareMetric, type Verdict } from "../lib/compare";
import { configurationLabel, familyName } from "../lib/families";
import { modelUrl } from "../lib/format";
import { providerIcon } from "../lib/images";
import { METRIC_GROUPS, METRICS } from "../lib/metrics";
import type { Model } from "../lib/models";
import { metricIcon } from "./leaderboards";
import { unavailableState } from "./load-states";
import { GeneralActions } from "./model-actions";
import { ModelDetails } from "./model-details";
import { RankingsList } from "./rankings-list";
import { Setup } from "./setup";

const VERDICT_COLORS: Partial<Record<Verdict, Color>> = { best: Color.Green, worst: Color.Red };

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
    <List navigationTitle="Compare Models" searchBarPlaceholder="Filter metrics…" isLoading={data.isLoading}>
      <List.EmptyView
        title={unavailable?.title ?? "No Models to Compare"}
        description={
          unavailable?.description ??
          `Press ⌘⇧A on any model to add it here. Compare up to ${MAX_COMPARED_MODELS} at once.`
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
  return (
    <ActionPanel title={model?.name}>
      {model ? (
        <ActionPanel.Section>
          <Action.Push
            title="View Model Details"
            icon={Icon.Sidebar}
            target={<ModelDetails modelId={model.id} metric="intelligence" />}
          />
          <Action.OpenInBrowser title="Open on Artificial Analysis" url={modelUrl(model.slug)} />
          <Action
            title="Remove from Comparison"
            icon={Icon.MinusCircle}
            shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            onAction={() => data.comparison.toggle(model.id)}
          />
        </ActionPanel.Section>
      ) : null}
      <ActionPanel.Section>
        <Action.Push title="Add Models" icon={Icon.PlusCircle} target={<RankingsList />} />
        {data.comparison.ids.size ? (
          <Action
            title="Clear Comparison"
            icon={Icon.XMarkCircle}
            shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
            onAction={() => data.comparison.clear()}
          />
        ) : null}
      </ActionPanel.Section>
      <GeneralActions data={data} />
    </ActionPanel>
  );
}
