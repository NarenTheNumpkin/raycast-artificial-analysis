export interface Model {
  id: string;
  name: string;
  slug: string;
  creator: string;
  intelligence: number | null;
  coding: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  speed: number | null;
}

export interface LeaderboardSnapshot {
  indexVersion: number;
  fetchedAt: number;
  models: Model[];
}

export type RankedModel = Model & { intelligence: number; rank: number };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function finiteMetric(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function rankModels(models: Model[]): RankedModel[] {
  const scored = models
    .filter((model): model is Model & { intelligence: number } => finiteMetric(model.intelligence) !== null)
    .toSorted(
      (a, b) => b.intelligence - a.intelligence || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en"),
    );
  let rank = 0;
  return scored.map((model, index) => {
    if (index === 0 || model.intelligence !== scored[index - 1].intelligence) rank = index + 1;
    return { ...model, rank };
  });
}

export function filterRankings(models: RankedModel[], query: string): RankedModel[] {
  const terms = query.toLocaleLowerCase("en").trim().split(/\s+/).filter(Boolean);
  return models.filter((model) => {
    const text = `${model.name} ${model.creator}`.toLocaleLowerCase("en");
    return terms.every((term) => text.includes(term));
  });
}
