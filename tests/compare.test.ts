import { describe, expect, it } from "vitest";
import { compareMetric } from "../src/lib/compare";
import { model } from "./fixtures";

const verdicts = (...args: Parameters<typeof compareMetric>) => compareMetric(...args).map(({ verdict }) => verdict);

describe("model comparison", () => {
  it("marks higher scores and speeds as better", () => {
    const models = [model({ id: "a", intelligence: 60, speed: 50 }), model({ id: "b", intelligence: 70, speed: 90 })];
    expect(verdicts(models, "intelligence")).toEqual(["worst", "best"]);
    expect(verdicts(models, "speed")).toEqual(["worst", "best"]);
  });

  it("marks lower prices and latency as better", () => {
    const models = [model({ id: "a", inputPrice: 0.5, latency: 2 }), model({ id: "b", inputPrice: 3, latency: 0.4 })];
    expect(verdicts(models, "inputPrice")).toEqual(["best", "worst"]);
    expect(verdicts(models, "latency")).toEqual(["worst", "best"]);
  });

  it("keeps middle models neutral and colors ties alike", () => {
    const models = [
      model({ id: "a", coding: 80 }),
      model({ id: "b", coding: 50 }),
      model({ id: "c", coding: 65 }),
      model({ id: "d", coding: 80 }),
    ];
    expect(verdicts(models, "coding")).toEqual(["best", "worst", "neutral", "best"]);
  });

  it("does not color missing, single, or equal measurements", () => {
    expect(verdicts([model({ speed: null }), model({ speed: 100 })], "speed")).toEqual(["missing", "neutral"]);
    expect(verdicts([model({ outputPrice: 2 }), model({ outputPrice: 2 })], "outputPrice")).toEqual([
      "neutral",
      "neutral",
    ]);
    expect(verdicts([model({ latency: -1 }), model({ latency: 1 })], "latency")).toEqual(["missing", "neutral"]);
    expect(compareMetric([model({ latency: 1 })], "latency")[0]).toMatchObject({ value: 1, verdict: "neutral" });
  });
});
