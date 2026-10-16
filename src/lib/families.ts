import { rankModels, type Model, type RankedModel } from "./models";

function configurationQualifier(value: string): boolean {
  const text = value.trim();
  return (
    /^(?:(?:reasoning|thinking)(?:[ -](?:effort|level))?[\s:=-]*)?(?:minimal|none|low|medium|high|xhigh|extra[ -]high|max|adaptive|default)(?:[ -]+(?:reasoning|thinking))?$/i.test(
      text,
    ) ||
    /^(?:(?:with|without)\s+)?(?:[\w .-]+\s+)?fallback$/i.test(text) ||
    /^(?:reasoning|thinking|non[ -]reasoning|non[ -]thinking)(?:\s+(?:on|off|enabled|disabled))?$/i.test(text) ||
    /^(?:reasoning|thinking)(?:\s+budget)?[\s:=-]+\d+[km]?(?:\s+tokens?)?$/i.test(text)
  );
}

export function familyName(name: string): string {
  let base = name.trim();
  for (;;) {
    const suffix = /^(.*?)\s*\(([^()]*)\)$/.exec(base);
    if (!suffix || !suffix[1].trim() || !suffix[2].split(/[,;]/).every(configurationQualifier)) return base;
    base = suffix[1].trim();
  }
}

export function familyKey(model: Model): string {
  return `${model.creatorId}:${familyName(model.name).toLocaleLowerCase("en").replace(/\s+/g, " ")}`;
}

export function distinctModelRankings(models: Model[]): RankedModel[] {
  const seen = new Set<string>();
  const best = rankModels(models).filter((model) => {
    const key = familyKey(model);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return rankModels(best).map((model) => ({ ...model, rankScope: "families" }));
}
