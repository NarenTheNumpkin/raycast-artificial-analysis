export type MetricKey = "intelligence" | "coding" | "speed" | "inputPrice" | "outputPrice" | "latency";

export interface MetricDefinition {
  title: string;
  commandTitle: string;
  direction: "ascending" | "descending";
  unit: string;
  nonnegative: boolean;
  format: (value: number | null) => string;
}

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

export function formatPrice(value: number | null): string {
  if (value === null) return "—";
  if (value > 0 && value < 0.00000001) return `$${value.toExponential(2)}`;
  return currency.format(value);
}

export const METRICS: Record<MetricKey, MetricDefinition> = {
  intelligence: {
    title: "Intelligence Index",
    commandTitle: "All AI Models",
    direction: "descending",
    unit: "Index score",
    nonnegative: false,
    format: formatScore,
  },
  coding: {
    title: "Coding Index",
    commandTitle: "Best Coding Models",
    direction: "descending",
    unit: "Index score",
    nonnegative: false,
    format: formatScore,
  },
  speed: {
    title: "Output Speed",
    commandTitle: "Fastest AI Models",
    direction: "descending",
    unit: "Tokens per second",
    nonnegative: true,
    format: (v) => (v === null ? "—" : `${number.format(v)} t/s`),
  },
  inputPrice: {
    title: "Input Price",
    commandTitle: "Model Pricing",
    direction: "ascending",
    unit: "USD per million input tokens",
    nonnegative: true,
    format: formatPrice,
  },
  outputPrice: {
    title: "Output Price",
    commandTitle: "Model Pricing",
    direction: "ascending",
    unit: "USD per million output tokens",
    nonnegative: true,
    format: formatPrice,
  },
  latency: {
    title: "Time to First Token",
    commandTitle: "Lowest Latency Models",
    direction: "ascending",
    unit: "Seconds",
    nonnegative: true,
    format: (v) => (v === null ? "—" : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(v)} s`),
  },
};
