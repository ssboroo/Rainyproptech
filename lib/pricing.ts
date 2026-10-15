import { nativeResolution } from "./video-options";
import type { ModelDescriptor } from "./model-router";

// Reviewed list prices, not historical averages. See docs/pricing.md and source URLs.
export const pricingPolicy = {
  version: "2026-10-15.3",
  reviewedAt: "2026-10-15",
  validUntil: "2026-11-15",
  creditMnt: 100,
  usdMnt: 3700,
  markup: 2.0,
  paymentFee: 0.03,
  overheadMnt: 50,
  providerReserve: 0.05,
} as const;
export { creditPacks } from "./public-pricing";
export type PricingPolicy = {
  version: string;
  reviewedAt: string;
  validUntil: string;
  creditMnt: number;
  usdMnt: number;
  markup: number;
  paymentFee: number;
  overheadMnt: number;
  providerReserve: number;
};
export type Rule = {
  flat?: number;
  resolutions?: Record<string, number>;
  perSecond?: number;
  input?: number;
  qualities?: Record<string, number>;
  qualityResolutions?: Record<string, Record<string, number>>;
};
export const rules: Record<string, Rule> = {
  "fal-ai/flux-pro/kontext": { flat: 0.04 },
  "fal-ai/flux-pro/kontext/max/multi": { flat: 0.08 },
  "fal-ai/bytedance/seedream/v4.5/edit": { flat: 0.04 },
  "fal-ai/bytedance/seedream/v4/edit": { flat: 0.03 },
  "bytedance/seedream/v5/flash/edit": { flat: 0.027 },
  "bytedance/seedream/v5/lite/edit": { flat: 0.035 },
  "xai/grok-imagine-image/edit": { flat: 0.022 },
  "xai/grok-imagine-image/quality/edit": {
    resolutions: { "1k": 0.05, "2k": 0.07 },
    input: 0.01,
  },
  "xai/grok-imagine-image/v2.0/edit": {
    qualityResolutions: {
      low: { "1k": 0.04, "2k": 0.06 },
      medium: { "1k": 0.06, "2k": 0.08 },
    },
    input: 0.01,
  },
  "ideogram/v4.5/edit": {
    qualities: { very_low: 0.008, low: 0.03, medium: 0.06, high: 0.22 },
  },
  "blackforestlabs/flux-3/image-to-video": {
    resolutions: { "720p": 0.17, "1080p": 0.29 },
  },
  "fal-ai/pixverse/v6/image-to-video": {
    resolutions: { "360p": 0.025, "540p": 0.035, "720p": 0.045, "1080p": 0.09 },
  },
  // Q4 promotional tariffs expire November 30; review gate is November 15.
  "fal-ai/vidu/q4/image-to-video": {
    resolutions: {
      "540p": 0.0315,
      "720p": 0.0665,
      "1080p": 0.084,
      "2k": 0.133,
      "4k": 0.273,
    },
  },
  "fal-ai/vidu/q4/reference-to-video": {
    resolutions: {
      "540p": 0.0315,
      "720p": 0.0665,
      "1080p": 0.084,
      "2k": 0.133,
      "4k": 0.273,
    },
  },

  "fal-ai/nano-banana-pro/edit": {
    resolutions: { "1k": 0.15, "2k": 0.15, "4k": 0.3 },
  },
  "fal-ai/gemini-3-pro-image-preview/edit": {
    resolutions: { "1k": 0.15, "2k": 0.15, "4k": 0.3 },
  },
  "fal-ai/nano-banana-2/edit": {
    resolutions: { "0.5k": 0.06, "1k": 0.08, "2k": 0.12, "4k": 0.16 },
  },
  "fal-ai/gemini-3.1-flash-image-preview/edit": {
    resolutions: { "0.5k": 0.06, "1k": 0.08, "2k": 0.12, "4k": 0.16 },
  },
  "fal-ai/nano-banana/edit": { flat: 0.039 },
  "fal-ai/gemini-25-flash-image/edit": { flat: 0.039 },
  "bytedance/seedream/v5/pro/edit": { flat: 0.135 }, // Explicit 2048² output, one input.
  "fal-ai/flux-pro/kontext/max": { flat: 0.08 },
  "fal-ai/kling-video/v3/pro/image-to-video": { perSecond: 0.112 },
  "fal-ai/kling-video/o3/pro/image-to-video": { perSecond: 0.112 },
  "fal-ai/kling-video/o3/pro/reference-to-video": { perSecond: 0.112 },
  "fal-ai/kling-video/v3/standard/image-to-video": { perSecond: 0.084 },
  "fal-ai/kling-video/o3/standard/image-to-video": { perSecond: 0.084 },
  "fal-ai/kling-video/o3/standard/reference-to-video": { perSecond: 0.084 },
  "fal-ai/kling-video/v2.6/pro/image-to-video": { perSecond: 0.07 },
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video": { perSecond: 0.07 },
  "fal-ai/kling-video/v2.5-turbo/standard/image-to-video": { perSecond: 0.042 },
  "fal-ai/kling-video/v3/turbo/pro/image-to-video": { perSecond: 0.14 },
  "fal-ai/kling-video/v3/turbo/standard/image-to-video": { perSecond: 0.112 },
  "fal-ai/kling-video/v3/4k/image-to-video": { perSecond: 0.42 },
  // Non-promotional rates: H3 discounts expire October 15.
  "minimax/h3-max/image-to-video": {
    resolutions: { "480p": 0.05, "768p": 0.08, "1080p": 0.16 },
  },
  "minimax/h3-max-turbo/image-to-video": {
    resolutions: { "480p": 0.025, "768p": 0.04, "1080p": 0.08 },
  },
  "minimax/h3-max/camera-controls": {
    resolutions: { "480p": 0.05, "768p": 0.08, "1080p": 0.16 },
  },
  "minimax/h3/image-to-video": {
    resolutions: { "480p": 0.05, "768p": 0.06, "2k": 0.13, "4k": 0.16 },
  },
  "minimax/h3/reference-to-video": {
    resolutions: { "480p": 0.05, "768p": 0.06, "2k": 0.13, "4k": 0.16 },
  },
  "google/gemini-omni-flash/v1.1/image-to-video": {
    resolutions: { "360p": 0.03, "720p": 0.1, "1080p": 0.15, "4k": 0.3 },
  },
  "google/gemini-omni-flash/v1.1/reference-to-video": {
    resolutions: { "360p": 0.03, "720p": 0.1, "1080p": 0.15, "4k": 0.3 },
  },
  "alibaba/wan-3.0/image-to-video": {
    resolutions: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
  },
  "alibaba/wan-3.0-prime/image-to-video": {
    resolutions: { "480p": 0.068, "720p": 0.14, "1080p": 0.28 },
  },
  "xai/grok-imagine-video/image-to-video": {
    resolutions: { "480p": 0.05, "720p": 0.07 },
    input: 0.002,
  },
  "xai/grok-imagine-video/v1.5/image-to-video": {
    resolutions: { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    input: 0.01,
  },
  "xai/grok-imagine-video/v1.5/reference-to-video": {
    resolutions: { "480p": 0.08, "720p": 0.14 },
    input: 0.01,
  },
  "xai/grok-imagine-video/v1.5/lite/image-to-video": {
    resolutions: { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
    input: 0.01,
  },
  "fal-ai/wan/v2.7/image-to-video": {
    resolutions: { "720p": 0.1, "1080p": 0.15 },
  },
  "fal-ai/wan-25-preview/image-to-video": {
    resolutions: { "480p": 0.05, "720p": 0.1, "1080p": 0.15 },
  },
  "fal-ai/minimax/hailuo-02/standard/image-to-video": {
    resolutions: { "512p": 0.017, "768p": 0.045 },
  },
  "fal-ai/ltx-2.3/image-to-video/fast": {
    resolutions: { "1080p": 0.06, "1440p": 0.12, "2160p": 0.24 },
  },
};
export function hasReviewedPrice(
  id: string,
  overrides: Record<string, Rule> = {},
) {
  return !!(overrides[id] || rules[id]);
}
export function retailCredits(
  apiUsd: number,
  policy: PricingPolicy = pricingPolicy,
) {
  if (!Number.isFinite(apiUsd) || apiUsd <= 0)
    throw new Error("Invalid provider price");
  const basis =
    apiUsd * policy.usdMnt * (1 + policy.providerReserve) + policy.overheadMnt;
  return Math.ceil(
    (basis * (1 + policy.markup)) /
      ((1 - policy.paymentFee) * policy.creditMnt),
  );
}
export function quoteFor(
  model: ModelDescriptor,
  input: Record<string, unknown>,
  now = Date.now(),
  policy: PricingPolicy = pricingPolicy,
  overrides: Record<string, Rule> = {},
) {
  if (now >= Date.parse(policy.validUntil))
    throw new Error(
      "Үнийн мэдээллийг шинэчлэх шаардлагатай. Pricing review required.",
    );
  const rule = overrides[model.id] || rules[model.id];
  if (!rule)
    throw new Error(
      "Энэ загварын хувьсах өртгийг баталгаажуулж байна. Өөр загвар сонгоно уу. Price review pending; choose a priced model.",
    );
  const props =
    (model.schema as { properties?: Record<string, { default?: unknown }> })
      .properties || {};
  const resolution = String(
    input.resolution ?? props.resolution?.default ?? "",
  ).toLowerCase();
  const duration =
    model.kind === "video"
      ? Number(input.duration ?? props.duration?.default)
      : 1;
  if (!Number.isFinite(duration) || duration < 1 || duration > 30)
    throw new Error("Unpriced duration");
  if (
    input.generate_audio === true ||
    input.generate_audio_switch === true ||
    input.audio === true ||
    input.enable_audio === true ||
    input.enable_web_search === true ||
    input.enable_google_search === true ||
    input.thinking_level === "high"
  )
    throw new Error("Unpriced add-on");
  if (
    Number(input.num_images ?? 1) !== 1 ||
    Number(input.num_outputs ?? 1) !== 1
  )
    throw new Error("Quote supports one output");
  const source = input[model.sourceField];
  if (Array.isArray(source) && source.length !== 1)
    throw new Error("Quote supports one reference");
  const quality = String(
    input.quality ?? props.quality?.default ?? "",
  ).toLowerCase();
  const unit = rule.qualityResolutions
    ? rule.qualityResolutions[quality]?.[resolution]
    : rule.qualities
      ? rule.qualities[quality]
      : rule.resolutions
        ? rule.resolutions[resolution]
        : (rule.perSecond ?? rule.flat);
  if (!unit) throw new Error("Unpriced resolution");
  const apiUsd = Number(
    ((rule.flat ?? unit * duration) + (rule.input || 0)).toFixed(6),
  );
  const credits = retailCredits(apiUsd, policy);
  return {
    version: policy.version,
    model: model.id,
    modelName: model.name,
    kind: model.kind,
    credits,
    totalMnt: credits * policy.creditMnt,
    apiUsd,
    resolution:
      resolution ||
      (model.kind === "video"
        ? nativeResolution(model.id)
        : model.id === "bytedance/seedream/v5/pro/edit"
          ? "2048×2048"
          : "model native"),
    duration: model.kind === "video" ? duration : null,
    reviewedAt: policy.reviewedAt,
    validUntil: policy.validUntil,
  };
}
export type PriceQuote = ReturnType<typeof quoteFor>;
