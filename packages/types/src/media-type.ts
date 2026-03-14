export const MEDIA_TYPES = [
  "instagram_post",
  "instagram_carousel",
  "instagram_reel",
  "tiktok_video",
  "youtube_shorts",
  "youtube_video",
  "x_post",
  "x_thread",
  "linkedin_post",
  "linkedin_carousel",
  "multi_platform_campaign",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

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
