import { z } from "zod";
const rates = z.record(z.string().max(32), z.number().positive().max(1000));
export const ruleSchema = z
  .object({
    flat: z.number().positive().max(1000).optional(),
    perSecond: z.number().positive().max(1000).optional(),
    input: z.number().nonnegative().max(1000).optional(),
    resolutions: rates.optional(),
    qualities: rates.optional(),
    qualityResolutions: z.record(z.string().max(32), rates).optional(),
  })
  .strict()
  .refine(
    (r) =>
      [
        r.flat,
        r.perSecond,
        r.resolutions,
        r.qualities,
        r.qualityResolutions,
      ].filter((x) => x !== undefined).length === 1,
    "Choose exactly one billing basis",
  );
export const settingsSchema = z
  .object({
    usdMnt: z.number().min(3000).max(10000),
    paymentFee: z.number().min(0).max(0.2),
    overheadMnt: z.number().min(0).max(10000),
    providerReserve: z.number().min(0).max(1),
    validUntil: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => Number.isFinite(Date.parse(v))),
    generationEnabled: z.boolean(),
    paymentsEnabled: z.boolean(),
    disabledModels: z.array(z.string().max(180)).max(100),
    ruleOverrides: z.record(z.string().max(180), ruleSchema),
    wireOperators: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)).max(20),
    defaultImage: z.string().max(180),
    defaultVideo: z.string().max(180),
  })
  .strict();
export type StudioSettings = z.infer<typeof settingsSchema>;
export const defaultSettings: StudioSettings = {
  usdMnt: 3700,
  paymentFee: 0.03,
  overheadMnt: 50,
  providerReserve: 0.05,
  validUntil: "2026-11-15",
  generationEnabled: true,
  paymentsEnabled: true,
  disabledModels: [],
  ruleOverrides: {},
  wireOperators: [],
  defaultImage: "fal-ai/nano-banana-pro/edit",
  defaultVideo: "fal-ai/kling-video/v3/pro/image-to-video",
};
