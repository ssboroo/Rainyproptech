import { z } from "zod";
export const generationSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["image", "video"]),
    project: z.enum([
      "interior",
      "exterior_facade",
      "master_plan",
      "townhouse",
      "commercial",
    ]),
    style: z.enum([
      "modern_glass",
      "neo_classic_building",
      "eco_residential",
      "commercial_tower",
      "interior_modern",
    ]),
    motion: z.enum(["drone_pull_back", "drone_orbit", "facade_pan"]),
    source_path: z.string().max(300).optional(),
    parent_id: z.string().uuid().optional(),
    notes: z.string().max(1500).default(""),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.kind === "image" && !v.source_path)
      ctx.addIssue({
        code: "custom",
        message: "Upload a source image",
        path: ["source_path"],
      });
    if (v.kind === "video" && !v.parent_id)
      ctx.addIssue({
        code: "custom",
        message: "Select a completed render",
        path: ["parent_id"],
      });
    if ((v.project === "interior") !== (v.style === "interior_modern"))
      ctx.addIssue({
        code: "custom",
        message: "Style does not match project mode",
        path: ["style"],
      });
  });
