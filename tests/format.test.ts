import { describe, expect, it } from "vitest";
import { displayMetrics, formatAge, formatPrice, modelSummary, modelUrl } from "../src/lib/format";
import { rankModels } from "../src/lib/models";
import { model, NOW, snapshot } from "./fixtures";

const defaults = { showCoding: false, showPrice: false, showSpeed: false };

describe("display and copy formatting", () => {
  it("shows only Intelligence Index by default", () => {
    expect(displayMetrics(rankModels([model()])[0], defaults)).toEqual([
      { kind: "intelligence", text: "50.0", tooltip: "Intelligence Index: 50\nRank #1; higher is better." },
    ]);
  });

  it("shows all configured statistics with explicit price units and input/output order", () => {
    const metrics = displayMetrics(rankModels([model()])[0], { showCoding: true, showPrice: true, showSpeed: true });
    expect(metrics.map(({ text }) => text)).toEqual(["50.0", "Code 42.0", "$0.25 / $1.50", "150.5 t/s"]);
    expect(metrics.find(({ kind }) => kind === "price")?.tooltip).toContain("USD per 1M tokens (input / output)");
  });

  it("allows each optional statistic independently", () => {
    const entry = rankModels([model()])[0];
    expect(displayMetrics(entry, { ...defaults, showCoding: true }).map(({ kind }) => kind)).toEqual([
      "intelligence",
      "coding",
    ]);
    expect(displayMetrics(entry, { ...defaults, showPrice: true }).map(({ kind }) => kind)).toEqual([
      "intelligence",
      "price",
    ]);
    expect(displayMetrics(entry, { ...defaults, showSpeed: true }).map(({ kind }) => kind)).toEqual([
      "intelligence",
      "speed",
    ]);
    expect(entry.rank).toBe(1);
  });

  it("distinguishes unavailable values from measured zeros", () => {
    const options = { showCoding: true, showPrice: true, showSpeed: true };
    const missing = rankModels([model({ coding: null, inputPrice: null, outputPrice: null, speed: null })])[0];
    expect(displayMetrics(missing, options).map(({ text }) => text)).toEqual(["50.0", "Code —", "— / —", "—"]);
    const zero = rankModels([model({ intelligence: 0, coding: 0, inputPrice: 0, outputPrice: 0, speed: 0 })])[0];
    expect(displayMetrics(zero, options).map(({ text }) => text)).toEqual([
      "0.0",
      "Code 0.0",
      "$0.00 / $0.00",
      "0 t/s",
    ]);
  });

  it("preserves small token prices rather than rounding them to zero", () => {
    expect(formatPrice(0.000125)).toBe("$0.000125");
    expect(formatPrice(0.000000001)).toBe("$1.00e-9");
    expect(formatPrice(null)).toBe("—");
  });

  it("copies displayed statistics, source, version, and retrieval time", () => {
    const entry = rankModels([model()])[0];
    const basic = modelSummary(entry, snapshot(), defaults);
    expect(basic).toContain("#1 Alpha (High) — Example Lab");
    expect(basic).toContain("Intelligence Index v4.3: 50");
    expect(basic).toContain("https://artificialanalysis.ai/models/alpha-high");
    expect(basic).toContain("Retrieved: 2026-10-17T08:00:00.000Z");
    expect(basic).not.toContain("Coding Index:");
    const full = modelSummary(entry, snapshot(), { showCoding: true, showPrice: true, showSpeed: true });
    expect(full).toContain("Coding Index: 42");
    expect(full).toContain("$0.25 input / $1.50 output");
    expect(full).toContain("150.5 tokens/s");
  });

  it("keeps model slugs inside a single URL path segment", () => {
    expect(modelUrl("model/config?x=1")).toBe("https://artificialanalysis.ai/models/model%2Fconfig%3Fx%3D1");
  });

  it("shows cache age across minute, hour, and day boundaries", () => {
    expect(formatAge(NOW, NOW)).toBe("just now");
    expect(formatAge(NOW, NOW + 120_000)).toBe("2m ago");
    expect(formatAge(NOW, NOW + 3_600_000)).toBe("1h ago");
    expect(formatAge(NOW, NOW + 172_800_000)).toBe("2d ago");
  });
});
