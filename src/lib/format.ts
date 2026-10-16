import { LEADERBOARD_URL } from "./api";
import type { LeaderboardSnapshot, RankedModel } from "./models";

export interface MetricPreferences {
  showCoding: boolean;
  showPrice: boolean;
  showSpeed: boolean;
}

export interface DisplayMetric {
  kind: "intelligence" | "coding" | "price" | "speed";
  text: string;
  tooltip: string;
}

const MISSING = "—";
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});
const speedFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function formatScore(value: number | null): string {
  return value === null ? MISSING : value.toFixed(1);
}

export function formatPrice(value: number | null): string {
  if (value === null) return MISSING;
  if (value > 0 && value < 0.00000001) return `$${value.toExponential(2)}`;
  return priceFormatter.format(value);
}

export function modelUrl(slug: string): string {
  return `https://artificialanalysis.ai/models/${encodeURIComponent(slug)}`;
}

export function displayMetrics(model: RankedModel, preferences: MetricPreferences): DisplayMetric[] {
  const metrics: DisplayMetric[] = [
    {
      kind: "intelligence",
      text: formatScore(model.intelligence),
      tooltip: `Intelligence Index: ${model.intelligence}\nRank #${model.rank}; higher is better.`,
    },
  ];
  if (preferences.showCoding) {
    metrics.push({
      kind: "coding",
      text: `Code ${formatScore(model.coding)}`,
      tooltip: `Coding Index: ${model.coding ?? "Not available"}; higher is better.`,
    });
  }
  if (preferences.showPrice) {
    metrics.push({
      kind: "price",
      text: `${formatPrice(model.inputPrice)} / ${formatPrice(model.outputPrice)}`,
      tooltip: `USD per 1M tokens (input / output)\nInput: ${formatPrice(model.inputPrice)}\nOutput: ${formatPrice(model.outputPrice)}`,
    });
  }
  if (preferences.showSpeed) {
    metrics.push({
      kind: "speed",
      text: model.speed === null ? MISSING : `${speedFormatter.format(model.speed)} t/s`,
      tooltip: "Median output tokens per second; higher is faster. Measurements are aggregated across providers.",
    });
  }
  return metrics;
}

export function formatAge(fetchedAt: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - fetchedAt) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function formatRetrievedAt(fetchedAt: number): string {
  return new Date(fetchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function modelSummary(
  model: RankedModel,
  snapshot: LeaderboardSnapshot,
  preferences: MetricPreferences,
): string {
  const lines = [
    `#${model.rank} ${model.name} — ${model.creator}`,
    `Intelligence Index v${snapshot.indexVersion}: ${model.intelligence}`,
  ];
  if (preferences.showCoding) lines.push(`Coding Index: ${model.coding ?? MISSING}`);
  if (preferences.showPrice) {
    lines.push(
      `Price (USD per 1M tokens): ${formatPrice(model.inputPrice)} input / ${formatPrice(model.outputPrice)} output`,
    );
  }
  if (preferences.showSpeed)
    lines.push(`Median output speed: ${model.speed === null ? MISSING : `${model.speed} tokens/s`}`);
  lines.push(
    `Source: Artificial Analysis (${modelUrl(model.slug)})`,
    `Leaderboard: ${LEADERBOARD_URL}`,
    `Retrieved: ${new Date(snapshot.fetchedAt).toISOString()}`,
  );
  return lines.join("\n");
}
