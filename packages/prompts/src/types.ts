export type MediaType =
  | "instagram_post"
  | "instagram_carousel"
  | "instagram_reel"
  | "tiktok_video"
  | "youtube_shorts"
  | "youtube_video"
  | "x_post"
  | "x_thread"
  | "linkedin_post"
  | "linkedin_carousel"
  | "multi_platform_campaign";

/** Gemini API aspect ratio values (used in imageConfig.aspectRatio) */
export const MEDIA_TYPE_ASPECT_RATIOS: Record<MediaType, string> = {
  instagram_post: "1:1",
  instagram_carousel: "1:1",
  instagram_reel: "9:16",
  tiktok_video: "9:16",
  youtube_shorts: "9:16",
  youtube_video: "16:9",
  x_post: "16:9",
  x_thread: "16:9",
  linkedin_post: "1.91:1",
  linkedin_carousel: "1:1",
  multi_platform_campaign: "1:1",
};

/** Human-readable aspect ratio labels for prompt instructions */
export const MEDIA_TYPE_ASPECT_LABELS: Record<MediaType, string> = {
  instagram_post: "1:1 square (1080×1080)",
  instagram_carousel: "1:1 square (1080×1080) per slide",
  instagram_reel: "9:16 vertical (1080×1920)",
  tiktok_video: "9:16 vertical (1080×1920)",
  youtube_shorts: "9:16 vertical (1080×1920)",
  youtube_video: "16:9 landscape (1920×1080)",
  x_post: "16:9 landscape (1200×675)",
  x_thread: "16:9 landscape (1200×675)",
  linkedin_post: "1.91:1 landscape (1200×628)",
  linkedin_carousel: "1:1 square (1080×1080) per slide",
  multi_platform_campaign: "varies per platform — match each deliverable's native format",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  instagram_post: "Instagram Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  tiktok_video: "TikTok Video",
  youtube_shorts: "YouTube Shorts",
  youtube_video: "YouTube Video",
  x_post: "X Post",
  x_thread: "X Thread",
  linkedin_post: "LinkedIn Post",
  linkedin_carousel: "LinkedIn Carousel",
  multi_platform_campaign: "Multi-Platform Campaign",
};
