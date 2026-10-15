import { fal } from "@fal-ai/client";
export const IMAGE_MODEL = "fal-ai/nano-banana-pro/edit";
export const VIDEO_MODEL = "fal-ai/kling-video/v3/pro/image-to-video";
export function provider() {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not configured");
  fal.config({ credentials: process.env.FAL_KEY });
  return fal;
}
