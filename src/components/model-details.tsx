import { Detail } from "@raycast/api";
import { useMemo } from "react";
import { failureMessage, useRankingsData } from "../hooks/use-rankings";
import { LEADERBOARD_URL } from "../lib/api";
import { familyName } from "../lib/families";
import { formatRetrievedAt } from "../lib/format";
import { providerIcon } from "../lib/images";
import { METRICS, type MetricKey } from "../lib/metrics";
import { rankModels } from "../lib/models";
import { ModelActions } from "./model-actions";
import { Setup } from "./setup";

function markdownText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/[\\`*_{}[\]<>!|#]/g, "\\$&");
}

export function ModelDetails({ modelId, metric }: { modelId: string; metric: MetricKey }) {
  const data = useRankingsData();
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
      actions={<ModelActions data={data} model={model} showDetails={false} />}
    />
  );
}
