export type MediaType =
  | "instagram_post"
  | "instagram_carousel"
  | "instagram_reel"
  | "tiktok_video"
  | "youtube_shorts"
  | "youtube_video"
  | "multi_platform_campaign";

export type ProjectContext = {
  projectName: string;
  brief?: string;
  targetAudience?: string;
  platform?: string;
  notes?: string;
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  instagram_post: "Instagram Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  tiktok_video: "TikTok Video",
  youtube_shorts: "YouTube Shorts",
  youtube_video: "YouTube Video",
  multi_platform_campaign: "Multi-Platform Campaign",
};
