import { z } from "zod";
import {
  projectKeys,
  styleKeys,
  category,
  isInteriorStyle,
  type Project,
  type Style,
} from "./presets";
export const generationSchema = z
  .object({
    id: z.string().uuid(),
    expected_credits: z.number().int().positive(),
    pricing_version: z.string().max(40),
    routing_mode: z
      .enum(["auto", "quality", "speed", "structure"])
      .default("auto"),
    model_id: z.string().min(1).max(180).optional(),
    kind: z.enum(["image", "video"]),
    project: z.enum(projectKeys as [Project, ...Project[]]),
    style: z.enum(styleKeys as [Style, ...Style[]]),
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
    if ((category(v.project) === "interior") !== isInteriorStyle(v.style))
      ctx.addIssue({
        code: "custom",
        message: "Style does not match project mode",
        path: ["style"],
      });
  });
