import { fal } from "@fal-ai/client";
export const IMAGE_MODEL = "fal-ai/flux-general/image-to-image";
export const VIDEO_MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";
export function provider() {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not configured");
  fal.config({ credentials: process.env.FAL_KEY });
  return fal;
}
export function imageInput(image_url: string, prompt: string) {
  return {
    image_url,
    prompt,
    guidance_scale: 4,
    easycontrols: [
      {
        control_method_url: "canny",
        image_url,
        image_control_type: "spatial" as const,
        scale: 1,
      },
    ],
    strength: 0.65,
    num_inference_steps: 28,
    num_images: 1,
    image_size: "landscape_16_9" as const,
    output_format: "png" as const,
    enable_safety_checker: true,
  };
}

export function videoInput(start_image_url: string, prompt: string) {
  return {
    start_image_url,
    prompt,
    duration: "5" as const,
    generate_audio: false,
    negative_prompt:
      "warped architecture, bending walls, changing window count, flicker, distortion",
    enable_safety_checker: true,
  };
}
