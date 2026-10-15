// Only customer-facing amounts belong in browser bundles.
export const creditPacks = [
  { name: "Starter", credits: 500, priceMnt: 50000 },
  { name: "Studio", credits: 1500, priceMnt: 150000 },
  { name: "Business", credits: 5000, priceMnt: 500000 },
];
export type RetailQuote = {
  version: string;
  model: string;
  modelName: string;
  kind: string;
  credits: number;
  totalMnt: number;
  resolution: string;
  duration: number | null;
};
export function publicQuote(q: RetailQuote): RetailQuote {
  const {
    version,
    model,
    modelName,
    kind,
    credits,
    totalMnt,
    resolution,
    duration,
  } = q;
  return {
    version,
    model,
    modelName,
    kind,
    credits,
    totalMnt,
    resolution,
    duration,
  };
}
