"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { deleteCampaign } from "@/app/actions/campaign";
import {
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  Film,
  Video,
  Play,
  Monitor,
  Globe,
  AlertCircle,
  Brain,
  ChevronDown,
  Trash2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Maximize,
  Music,
  Repeat2,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";

const MEDIA_TYPE_LABELS: Record<string, string> = {
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
  multi_platform_campaign: "Multi-Platform",
};

const MEDIA_TYPE_ICONS: Record<string, React.ElementType> = {
  instagram_post: ImageIcon,
  instagram_carousel: Layers,
  instagram_reel: Film,
  tiktok_video: Video,
  youtube_shorts: Play,
  youtube_video: Monitor,
  x_post: Globe,
  x_thread: Globe,
  linkedin_post: Globe,
  linkedin_carousel: Globe,
  multi_platform_campaign: Globe,
};

type TextPart = { type: "text"; content: string };
type ImagePart = { type: "image"; data: string; mimeType: string };
type Part = TextPart | ImagePart;

type Props = {
  workspaceSlug: string;
  campaign: {
    id: string;
    mediaType: string;
    prompt: string;
    status: string;
    createdAt: string;
  };
  parts: Part[];
};

function TextBlock({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        if (trimmed.startsWith("#### ")) {
          return (
            <h4
              key={i}
              className="mt-5 mb-1.5 text-sm font-semibold tracking-tight"
            >
              {renderInline(trimmed.slice(5))}
            </h4>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 text-base font-semibold tracking-tight"
            >
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mt-8 mb-3 text-lg font-semibold tracking-tight"
            >
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="mt-8 mb-3 text-xl font-semibold tracking-tight"
            >
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }

        if (trimmed === "---" || trimmed === "***") {
          return <Separator key={i} className="my-6" />;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li
              key={i}
              className="ml-4 text-sm leading-relaxed text-foreground/80"
            >
              {renderInline(trimmed.slice(2))}
            </li>
          );
        }

        // Numbered lists (e.g., "1. ", "2. ")
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <li
              key={i}
              className="ml-4 text-sm leading-relaxed text-foreground/80 list-decimal"
            >
              {renderInline(numberedMatch[2])}
            </li>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/80">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    // Pick the earliest match
    const boldIdx = boldMatch?.index ?? Infinity;
    const italicIdx = italicMatch?.index ?? Infinity;

    if (boldIdx <= italicIdx && boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    parts.push(remaining);
    break;
  }

  return parts;
}

/* ── Platform Mockup Frames ─────────────────────────────────────────── */

function InstagramPostMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-sm overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">brand_name</p>
          <p className="text-[10px] text-zinc-500">Sponsored</p>
        </div>
        <div className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
        </div>
      </div>
      {/* Image */}
      <img src={src} alt="Generated content" className="w-full object-contain" />
      {/* Actions */}
      <div className="flex items-center px-3 py-2.5">
        <div className="flex gap-3">
          <Heart className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
          <MessageCircle className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
          <Send className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
        </div>
        <Bookmark className="ml-auto h-5 w-5 text-zinc-800 dark:text-zinc-200" />
      </div>
    </div>
  );
}

function InstagramCarouselMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-sm overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">brand_name</p>
          <p className="text-[10px] text-zinc-500">Sponsored</p>
        </div>
        <div className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
          <span className="h-1 w-1 rounded-full bg-zinc-400" />
        </div>
      </div>
      {/* Image */}
      <img src={src} alt="Generated content" className="w-full object-contain" />
      {/* Carousel dots */}
      <div className="flex justify-center gap-1 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      </div>
      {/* Actions */}
      <div className="flex items-center px-3 py-2.5">
        <div className="flex gap-3">
          <Heart className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
          <MessageCircle className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
          <Send className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
        </div>
        <Bookmark className="ml-auto h-5 w-5 text-zinc-800 dark:text-zinc-200" />
      </div>
    </div>
  );
}

function InstagramReelMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-xs">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
        {/* Image */}
        <img src={src} alt="Generated content" className="w-full object-cover aspect-[9/16]" />
        {/* Right-side icons overlay */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <Heart className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">12.4K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">348</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Send className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">Share</span>
          </div>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-4 left-3 right-14">
          <p className="text-xs font-semibold text-white drop-shadow">brand_name</p>
          <p className="mt-0.5 text-[10px] text-white/80 drop-shadow line-clamp-2">Campaign content preview</p>
        </div>
      </div>
    </div>
  );
}

function TikTokMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-xs">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
        {/* Image */}
        <img src={src} alt="Generated content" className="w-full object-cover aspect-[9/16]" />
        {/* Right sidebar icons */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <Heart className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">24.5K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">1,203</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">Share</span>
          </div>
          {/* Music disc */}
          <div className="h-10 w-10 animate-[spin_3s_linear_infinite] rounded-full border-2 border-zinc-600 bg-zinc-800">
            <Music className="m-auto mt-2 h-4 w-4 text-white" />
          </div>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-4 left-3 right-14">
          <p className="text-xs font-bold text-white drop-shadow">@brand_name</p>
          <p className="mt-0.5 text-[10px] text-white/80 drop-shadow line-clamp-2">Campaign content preview #fyp #branded</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Music className="h-3 w-3 text-white" />
            <p className="text-[10px] text-white/70 drop-shadow">Original Sound - brand_name</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function YouTubeShortsMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-xs">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
        {/* Image */}
        <img src={src} alt="Generated content" className="w-full object-cover aspect-[9/16]" />
        {/* Right-side icons */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <ThumbsUp className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">8.2K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ThumbsDown className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">Dislike</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">412</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 className="h-6 w-6 text-white drop-shadow" />
            <span className="text-[10px] font-medium text-white drop-shadow">Share</span>
          </div>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-4 left-3 right-14">
          <p className="text-xs font-semibold text-white drop-shadow">@brand_name</p>
          <p className="mt-0.5 text-[10px] text-white/80 drop-shadow line-clamp-2">Campaign content preview</p>
        </div>
      </div>
    </div>
  );
}

function YouTubeVideoMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-xl border bg-black">
      {/* Video area */}
      <div className="relative">
        <img src={src} alt="Generated content" className="w-full object-contain aspect-video" />
      </div>
      {/* Controls bar */}
      <div className="flex items-center gap-3 bg-zinc-900 px-3 py-2">
        <Play className="h-4 w-4 text-white" fill="white" />
        {/* Progress bar */}
        <div className="flex-1 h-1 rounded-full bg-zinc-700">
          <div className="h-full w-1/3 rounded-full bg-red-600" />
        </div>
        <span className="text-[10px] text-zinc-400">0:15 / 0:45</span>
        <Volume2 className="h-4 w-4 text-white" />
        <Maximize className="h-4 w-4 text-white" />
      </div>
      {/* Title */}
      <div className="bg-zinc-900 px-3 pb-3">
        <p className="text-xs font-medium text-white">Campaign Content Preview</p>
        <p className="text-[10px] text-zinc-400">brand_name &middot; 1 view &middot; Just now</p>
      </div>
    </div>
  );
}

function XPostMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-2xl border bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-start gap-2.5 px-4 pt-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Brand Name</span>
            <span className="text-[13px] text-zinc-500">@brand_name</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-800 dark:text-zinc-200 line-clamp-3">Campaign content preview</p>
        </div>
      </div>
      {/* Image */}
      <div className="mx-4 mt-2.5 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <img src={src} alt="Generated content" className="w-full object-contain aspect-video" />
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1 text-zinc-500">
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="text-xs">24</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Repeat2 className="h-[18px] w-[18px]" />
          <span className="text-xs">128</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Heart className="h-[18px] w-[18px]" />
          <span className="text-xs">1.2K</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <BarChart3 className="h-[18px] w-[18px]" />
          <span className="text-xs">14K</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Bookmark className="h-[18px] w-[18px]" />
          <Share2 className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}

function XThreadMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-2xl border bg-white dark:bg-black">
      {/* First tweet in thread */}
      <div className="relative flex items-start gap-2.5 px-4 pt-3 pb-3">
        {/* Thread line */}
        <div className="absolute left-[35px] top-[52px] bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
        <div className="relative z-10 h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Brand Name</span>
            <span className="text-[13px] text-zinc-500">@brand_name</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-800 dark:text-zinc-200 line-clamp-3">Campaign content preview — thread 1/3</p>
        </div>
      </div>
      {/* Second tweet with image */}
      <div className="relative flex items-start gap-2.5 px-4 pb-3">
        {/* Thread line continues */}
        <div className="absolute left-[35px] top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-700" />
        <div className="relative z-10 h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Brand Name</span>
            <span className="text-[13px] text-zinc-500">@brand_name</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-zinc-800 dark:text-zinc-200 line-clamp-2">Continuing the story — thread 2/3</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <img src={src} alt="Generated content" className="w-full object-contain aspect-video" />
          </div>
        </div>
      </div>
      {/* Thread CTA */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
        <p className="text-[13px] font-medium text-blue-500">Show this thread</p>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-1 text-zinc-500">
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="text-xs">48</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Repeat2 className="h-[18px] w-[18px]" />
          <span className="text-xs">256</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Heart className="h-[18px] w-[18px]" />
          <span className="text-xs">2.4K</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <BarChart3 className="h-[18px] w-[18px]" />
          <span className="text-xs">32K</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Bookmark className="h-[18px] w-[18px]" />
          <Share2 className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}

function LinkedInPostMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start gap-2.5 px-4 pt-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Brand Name</p>
          <p className="text-[11px] text-zinc-500 leading-tight">Digital Marketing &middot; 1,234 followers</p>
          <p className="text-[11px] text-zinc-400">2h &middot; <Globe className="inline h-3 w-3" /></p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-zinc-400 shrink-0" />
      </div>
      {/* Post text */}
      <div className="px-4 pt-2 pb-2">
        <p className="text-[13px] leading-snug text-zinc-800 dark:text-zinc-200 line-clamp-3">Campaign content preview for LinkedIn audience...</p>
      </div>
      {/* Image — LinkedIn uses ~1.91:1 but we render contained */}
      <img src={src} alt="Generated content" className="w-full object-contain" />
      {/* Reactions bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex -space-x-1">
          <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
            <ThumbsUp className="h-2.5 w-2.5 text-white" fill="white" />
          </div>
          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <Heart className="h-2.5 w-2.5 text-white" fill="white" />
          </div>
        </div>
        <span className="text-[11px] text-zinc-500 ml-1">248</span>
        <span className="ml-auto text-[11px] text-zinc-500">18 comments &middot; 5 reposts</span>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-around px-2 py-1">
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-xs font-medium">Like</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Repeat2 className="h-4 w-4" />
          <span className="text-xs font-medium">Repost</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Send className="h-4 w-4" />
          <span className="text-xs font-medium">Send</span>
        </button>
      </div>
    </div>
  );
}

function LinkedInCarouselMockup({ src }: { src: string }) {
  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-start gap-2.5 px-4 pt-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Brand Name</p>
          <p className="text-[11px] text-zinc-500 leading-tight">Digital Marketing &middot; 1,234 followers</p>
          <p className="text-[11px] text-zinc-400">3h &middot; <Globe className="inline h-3 w-3" /></p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-zinc-400 shrink-0" />
      </div>
      {/* Post text */}
      <div className="px-4 pt-2 pb-2">
        <p className="text-[13px] leading-snug text-zinc-800 dark:text-zinc-200 line-clamp-3">Swipe through to learn more...</p>
      </div>
      {/* Carousel image */}
      <img src={src} alt="Generated content" className="w-full object-contain" />
      {/* Carousel indicator */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <span className="text-[11px] text-zinc-500">1 of 4</span>
      </div>
      {/* Reactions bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex -space-x-1">
          <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
            <ThumbsUp className="h-2.5 w-2.5 text-white" fill="white" />
          </div>
          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <Heart className="h-2.5 w-2.5 text-white" fill="white" />
          </div>
        </div>
        <span className="text-[11px] text-zinc-500 ml-1">412</span>
        <span className="ml-auto text-[11px] text-zinc-500">32 comments &middot; 14 reposts</span>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-around px-2 py-1">
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-xs font-medium">Like</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Repeat2 className="h-4 w-4" />
          <span className="text-xs font-medium">Repost</span>
        </button>
        <button className="flex items-center gap-1.5 rounded px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Send className="h-4 w-4" />
          <span className="text-xs font-medium">Send</span>
        </button>
      </div>
    </div>
  );
}

/* ── ImageBlock with platform mockups ───────────────────────────────── */

function ImageBlock({
  data,
  mimeType,
  mediaType,
}: {
  data: string;
  mimeType: string;
  mediaType?: string;
}) {
  const src = `data:${mimeType};base64,${data}`;

  switch (mediaType) {
    case "instagram_post":
      return <InstagramPostMockup src={src} />;
    case "instagram_carousel":
      return <InstagramCarouselMockup src={src} />;
    case "instagram_reel":
      return <InstagramReelMockup src={src} />;
    case "tiktok_video":
      return <TikTokMockup src={src} />;
    case "youtube_shorts":
      return <YouTubeShortsMockup src={src} />;
    case "youtube_video":
      return <YouTubeVideoMockup src={src} />;
    case "x_post":
      return <XPostMockup src={src} />;
    case "x_thread":
      return <XThreadMockup src={src} />;
    case "linkedin_post":
      return <LinkedInPostMockup src={src} />;
    case "linkedin_carousel":
      return <LinkedInCarouselMockup src={src} />;
    default:
      return (
        <div className="my-6 overflow-hidden rounded-xl border bg-muted/30">
          <img
            src={src}
            alt="Generated content"
            className="w-full object-contain"
          />
        </div>
      );
  }
}

/* ── Image Skeleton Placeholder ───────────────────────────────────── */

/** Shimmer placeholder for square (1:1) image areas */
function SkeletonShimmer() {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/80">
      <div className="aspect-square w-full animate-skeleton-breathe bg-gradient-to-b from-zinc-100 via-zinc-200/60 to-zinc-100 dark:from-zinc-800/80 dark:via-zinc-700/40 dark:to-zinc-800/80" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-shimmer-sweep absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/[0.07]" />
      </div>
    </div>
  );
}

/** Shimmer placeholder for 9:16 vertical image areas */
function SkeletonShimmer916() {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-900">
      <div className="aspect-[9/16] w-full animate-skeleton-breathe bg-gradient-to-b from-zinc-900 via-zinc-800/60 to-zinc-900" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-shimmer-sweep absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>
    </div>
  );
}

/** Shimmer placeholder for 16:9 landscape image areas */
function SkeletonShimmerVideo() {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-900">
      <div className="aspect-video w-full animate-skeleton-breathe bg-gradient-to-b from-zinc-900 via-zinc-800/60 to-zinc-900" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-shimmer-sweep absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>
    </div>
  );
}

function ImageSkeleton({ mediaType }: { mediaType?: string }) {
  switch (mediaType) {
    case "instagram_post":
      return (
        <div className="mx-auto my-6 max-w-sm overflow-hidden rounded-xl border border-zinc-200/70 dark:border-zinc-700/50 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
              <div className="h-2 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
            </div>
          </div>
          <SkeletonShimmer />
          <div className="flex items-center px-3 py-2.5">
            <div className="flex gap-3">
              <Heart className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
              <MessageCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
              <Send className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
            </div>
            <Bookmark className="ml-auto h-5 w-5 text-zinc-300 dark:text-zinc-700" />
          </div>
        </div>
      );
    case "instagram_carousel":
      return (
        <div className="mx-auto my-6 max-w-sm overflow-hidden rounded-xl border border-zinc-200/70 dark:border-zinc-700/50 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
              <div className="h-2 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
            </div>
          </div>
          <SkeletonShimmer />
          <div className="flex justify-center gap-1 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-skeleton-breathe" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-skeleton-breathe [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-skeleton-breathe [animation-delay:300ms]" />
          </div>
          <div className="flex items-center px-3 py-2.5">
            <div className="flex gap-3">
              <Heart className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
              <MessageCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
              <Send className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
            </div>
            <Bookmark className="ml-auto h-5 w-5 text-zinc-300 dark:text-zinc-700" />
          </div>
        </div>
      );
    case "instagram_reel":
      return (
        <div className="mx-auto my-6 max-w-xs">
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
            <SkeletonShimmer916 />
          </div>
        </div>
      );
    case "tiktok_video":
      return (
        <div className="mx-auto my-6 max-w-xs">
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
            <SkeletonShimmer916 />
          </div>
        </div>
      );
    case "youtube_shorts":
      return (
        <div className="mx-auto my-6 max-w-xs">
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-800 bg-black">
            <SkeletonShimmer916 />
          </div>
        </div>
      );
    case "youtube_video":
      return (
        <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-xl border border-zinc-700/50 bg-black">
          <SkeletonShimmerVideo />
          <div className="flex items-center gap-3 bg-zinc-900 px-3 py-2">
            <div className="h-4 w-4 rounded bg-zinc-700 animate-skeleton-breathe" />
            <div className="flex-1 h-1 rounded-full bg-zinc-800">
              <div className="h-full w-0 rounded-full bg-red-600/40 animate-skeleton-breathe" />
            </div>
            <div className="h-2.5 w-14 rounded-full bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
          </div>
          <div className="bg-zinc-900 px-3 pb-3 space-y-1.5">
            <div className="h-2.5 w-44 rounded-full bg-zinc-700 animate-skeleton-breathe" />
            <div className="h-2 w-28 rounded-full bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
          </div>
        </div>
      );
    case "x_post":
    case "x_thread":
      return (
        <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-700/50 bg-white dark:bg-black">
          <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-32 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
              <div className="h-2.5 w-48 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:150ms]" />
            </div>
          </div>
          <div className="mx-4 mb-2.5 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <SkeletonShimmerVideo />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:100ms]" />
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:300ms]" />
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:400ms]" />
          </div>
        </div>
      );
    case "linkedin_post":
    case "linkedin_carousel":
      return (
        <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-xl border border-zinc-200/70 dark:border-zinc-700/50 bg-white dark:bg-zinc-900">
          <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
            <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-28 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
              <div className="h-2 w-40 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:150ms]" />
              <div className="h-2 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:300ms]" />
            </div>
          </div>
          <div className="px-4 pb-2 space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="h-2.5 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:150ms]" />
          </div>
          <SkeletonShimmer />
          <div className="flex items-center justify-around px-4 py-2.5">
            <div className="h-3 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe" />
            <div className="h-3 w-14 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:100ms]" />
            <div className="h-3 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:200ms]" />
            <div className="h-3 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-skeleton-breathe [animation-delay:300ms]" />
          </div>
        </div>
      );
    default:
      return (
        <div className="my-6 overflow-hidden rounded-xl border bg-muted/30">
          <SkeletonShimmer />
        </div>
      );
  }
}

/** Animated dots for loading states */
function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
    </span>
  );
}

/** Collapsible chain-of-thought section */
function ThinkingSection({ lines }: { lines: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (lines.length === 0) return null;

  return (
    <div className="animate-fade-in-up mb-6 rounded-lg border border-border/50 bg-muted/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Brain className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">Chain of thought</span>
        <span className="text-xs">({lines.length} steps)</span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-border/50 px-4 py-3">
          <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
            {lines.map((line, i) => (
              <p key={i} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignOutput({
  workspaceSlug,
  campaign,
  parts: initialParts,
}: Props) {
  const base = `/w/${workspaceSlug}`;
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const Icon = MEDIA_TYPE_ICONS[campaign.mediaType] ?? Globe;

  // Streaming state
  const [streamedParts, setStreamedParts] = useState<Part[]>([]);
  const [thinking, setThinking] = useState<string[]>([]);
  const [status, setStatus] = useState(campaign.status);
  const [phase, setPhase] = useState<"idle" | "thinking" | "creating" | "done">(
    campaign.status === "generating" ? "thinking" : "done"
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use initial parts if already completed, otherwise use streamed parts
  const parts = initialParts.length > 0 ? initialParts : streamedParts;

  // Auto-scroll to bottom as new content streams in
  useEffect(() => {
    if (phase === "done") return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedParts, thinking, phase]);

  // Connect to SSE stream when campaign is generating
  useEffect(() => {
    if (campaign.status !== "generating") return;

    const eventSource = new EventSource(
      `/api/campaigns/${campaign.id}/stream`
    );

    eventSource.addEventListener("thinking", (e) => {
      const data = JSON.parse(e.data);
      setPhase("thinking");
      // Don't duplicate partial thinking lines — only add complete ones
      if (!data.partial) {
        setThinking((prev) => [...prev, data.text]);
      }
    });

    eventSource.addEventListener("creator_started", () => {
      setPhase("creating");
    });

    eventSource.addEventListener("part", (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "text") {
        // Append partial text to the last text part, or create a new one
        setStreamedParts((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.type === "text") {
            // Append to existing text part
            const updated = [...prev];
            updated[updated.length - 1] = {
              type: "text",
              content: last.content + data.content,
            };
            return updated;
          }
          // New text part (after an image, or first part)
          return [...prev, { type: "text" as const, content: data.content }];
        });
      } else {
        // Images arrive complete
        setStreamedParts((prev) => [...prev, data]);
      }
    });

    eventSource.addEventListener("done", () => {
      setStatus("completed");
      setPhase("done");
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      // EventSource fires generic error on connection close too
      if (eventSource.readyState === EventSource.CLOSED) return;
      console.error("SSE error:", e);
      setStatus("failed");
      setPhase("done");
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [campaign.id, campaign.status]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    generating: {
      label: "Generating",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    },
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    },
    failed: {
      label: "Failed",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
  };

  const statusInfo = statusConfig[status] ?? statusConfig.draft;

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href={`${base}/campaigns`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campaigns
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight">
                    {MEDIA_TYPE_LABELS[campaign.mediaType] ??
                      campaign.mediaType}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                  {campaign.prompt}
                </p>
              </div>
            </div>
            {phase === "done" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
                onClick={() => {
                  if (!confirm("Delete this campaign?")) return;
                  startDelete(async () => {
                    await deleteCampaign(campaign.id);
                    router.push(`${base}/campaigns`);
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Thinking phase indicator */}
        {phase === "thinking" && parts.length === 0 && (
          <div className="animate-fade-in-up mb-6 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <Brain className="h-4 w-4 animate-pulse text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Planning your content <PulsingDots />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Retrieving brand knowledge and crafting a creative brief
              </p>
            </div>
          </div>
        )}

        {/* Chain of thought (collapsible) */}
        <ThinkingSection lines={thinking} />

        {/* Creating phase indicator (shown while streaming parts) */}
        {phase === "creating" && (
          <div className="animate-fade-in-up mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">
              Generating content <PulsingDots />
            </p>
          </div>
        )}

        {/* Content: streamed or loaded from DB */}
        {parts.length > 0 && (
          <div>
            {parts.map((part, i) => {
              if (part.type === "text") {
                return <TextBlock key={i} content={part.content} />;
              }
              if (part.type === "image") {
                return (
                  <div key={i} className="animate-fade-in-up">
                    <ImageBlock
                      data={part.data}
                      mimeType={part.mimeType}
                      mediaType={campaign.mediaType}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Skeleton placeholder while creator is actively generating */}
        {phase === "creating" && (
          <div className="animate-fade-in-up">
            <ImageSkeleton mediaType={campaign.mediaType} />
          </div>
        )}

        {/* Failed state */}
        {status === "failed" && parts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-medium">Generation failed</p>
            <p className="text-xs text-muted-foreground">
              Try creating a new campaign with a different prompt.
            </p>
          </div>
        )}

        {/* Completed with no output */}
        {status === "completed" && parts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-muted-foreground">
              No output available.
            </p>
          </div>
        )}

        {/* Scroll anchor for auto-scroll during streaming */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
