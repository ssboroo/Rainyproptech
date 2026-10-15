import { fal } from "@fal-ai/client";
export const IMAGE_MODEL = "fal-ai/nano-banana-pro/edit";
export const VIDEO_MODEL = "fal-ai/kling-video/v3/pro/image-to-video";
export function provider() {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not configured");
  fal.config({ credentials: process.env.FAL_KEY });
  return fal;
}
export function imageInput(image_url: string, prompt: string) {
  return {
    image_urls: [image_url],
    prompt,
    resolution: "4K" as const,
    aspect_ratio: "auto" as const,
    num_images: 1,
    limit_generations: true,
    output_format: "png" as const,
    enable_web_search: false,
  };
}
export function videoInput(start_image_url: string, prompt: string) {
  return {
    start_image_url,
    prompt,
    duration: "5" as const,
    generate_audio: false,
    cfg_scale: 0.6,
    negative_prompt:
      "warped architecture, bending walls, changing window count, flicker, distortion, camera shake, jump cuts, abrupt acceleration, plastic materials, cartoon, timelapse",
    enable_safety_checker: true,
  };
}
