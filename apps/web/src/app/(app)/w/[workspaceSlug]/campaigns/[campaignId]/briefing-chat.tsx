"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { generateBriefingDoc } from "@/app/actions/campaign";
import { ChatMessage } from "./chat-message";
import type { Message, MessagePart } from "./chat-message";
import { BriefingGraph } from "./briefing-graph";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Loader2,
  Network,
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

type Campaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  briefingSummary: string | null;
  workspaceId: string;
};

type Props = {
  workspaceSlug: string;
  campaign: Campaign;
  initialMessages: Message[];
};

export function BriefingChat({ workspaceSlug, campaign, initialMessages }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [imageRatings, setImageRatings] = useState<Map<string, "liked" | "disliked">>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const base = `/w/${workspaceSlug}`;

  // Load existing ratings on mount
  useEffect(() => {
    fetch(`/api/campaigns/${campaign.id}/rate-image`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.ratings) return;
        const map = new Map<string, "liked" | "disliked">();
        for (const r of data.ratings) {
          map.set(`${r.messageId}:${r.partIndex}`, r.rating === "like" ? "liked" : "disliked");
        }
        setImageRatings(map);
      })
      .catch(() => {});
  }, [campaign.id]);

  const hasImages = messages.some(
    (m) => m.role === "assistant" && m.parts.some((p) => p.type === "image")
  );
  const hasAnyRating = imageRatings.size > 0;
  const needsRating = hasImages && !hasAnyRating;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingText]);

  useEffect(() => {
    if (initialMessages.length === 0 && campaign.prompt) {
      // Delay so strict mode cleanup cancels before it fires — prevents double send
      const timeout = setTimeout(() => sendMessage(campaign.prompt), 50);
      return () => {
        clearTimeout(timeout);
        abortRef.current?.abort();
        isStreamingRef.current = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isStreamingRef.current) return;

    isStreamingRef.current = true;
    setError(null);
    setIsStreaming(true);
    setThinkingText(null);

    // Add user message
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", content: messageText.trim() }],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    // Accumulate parts in order: text deltas build the current text part,
    // images get inserted as separate parts, preserving interleaving.
    const assistantParts: MessagePart[] = [];
    let currentTextBuffer = "";

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to creative director");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", parts: [], createdAt: new Date().toISOString() },
      ]);

      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (currentEvent) {
                case "thinking":
                  setThinkingText(data.text || "Researching...");
                  break;

                case "part":
                  setThinkingText(null);
                  if (data.type === "text") {
                    // Append text delta to current text buffer
                    currentTextBuffer += data.content;
                    // Update or add the trailing text part
                    const lastPart = assistantParts[assistantParts.length - 1];
                    if (lastPart && lastPart.type === "text") {
                      lastPart.content = currentTextBuffer;
                    } else {
                      assistantParts.push({ type: "text", content: currentTextBuffer });
                    }
                  } else if (data.type === "image") {
                    // Flush text buffer — next text will be a new part
                    currentTextBuffer = "";
                    assistantParts.push({
                      type: "image",
                      data: data.data,
                      mimeType: data.mimeType,
                    });
                  }
                  // Update message with current parts snapshot
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, parts: [...assistantParts] }
                        : m
                    )
                  );
                  break;

                case "done":
                  break;

                case "error":
                  setError(data.message || "Something went wrong");
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = "";
          } else if (line.trim() === "") {
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      isStreamingRef.current = false;
      setIsStreaming(false);
      setThinkingText(null);
      abortRef.current = null;
    }
  }, [campaign.id]);

  const handleRateImage = useCallback(
    (messageId: string, partIndex: number, rating: "like" | "dislike") => {
      const key = `${messageId}:${partIndex}`;
      // Optimistic update
      setImageRatings((prev) => {
        const next = new Map(prev);
        next.set(key, rating === "like" ? "liked" : "disliked");
        return next;
      });

      // Find image data from message parts
      const msg = messages.find((m) => m.id === messageId);
      const part = msg?.parts[partIndex];
      const imageData = part?.type === "image" ? part.data : undefined;
      const imageMimeType = part?.type === "image" ? part.mimeType : undefined;

      fetch(`/api/campaigns/${campaign.id}/rate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, partIndex, rating, imageData, imageMimeType }),
      }).catch(() => {
        // Revert on failure
        setImageRatings((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      });
    },
    [campaign.id, messages]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    sendMessage(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  async function handleGenerateBriefing() {
    setIsApproving(true);
    try {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      const summary = lastAssistant?.parts
        .filter((p): p is { type: "text"; content: string } => p.type === "text")
        .map((p) => p.content)
        .join("\n") || campaign.prompt;

      await generateBriefingDoc(campaign.id, summary);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate briefing");
      setIsApproving(false);
    }
  }

  const hasAssistantResponse = messages.some(
    (m) => m.role === "assistant" && m.parts.some((p) => p.type === "text" && p.content)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <Link
          href={`${base}/campaigns`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-sm font-medium">
            {campaign.prompt}
          </h1>
          <p className="text-xs text-muted-foreground">
            {MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              imageRatings={imageRatings}
              onRateImage={handleRateImage}
              isStreaming={isStreaming}
            />
          ))}

          {thinkingText && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-4 py-2.5">
                <p className="text-sm text-muted-foreground">{thinkingText}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input + Actions */}
      <div className="border-t px-6 py-1.5">
        <div className="mx-auto max-w-2xl space-y-1">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  messages.length > 0
                    ? "Continue the conversation..."
                    : "Describe your content idea..."
                }
                disabled={isStreaming}
                className={cn(
                  "w-full rounded-xl border bg-background px-4 py-2 pr-12 text-sm",
                  "placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#f6b900]/30 focus:border-[#f6b900]/40",
                  "disabled:opacity-50",
                  "transition-all duration-200"
                )}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  "transition-all duration-200",
                  input.trim() && !isStreaming
                    ? "bg-[#f6b900] text-white hover:bg-[#e0a800]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
          {hasAssistantResponse && !isStreaming && (
            <div className="flex items-center justify-end gap-1.5 py-0.5">
              <button
                onClick={() => setShowGraph(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Network className="h-3.5 w-3.5" />
                View Graph
              </button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="sm"
                      onClick={handleGenerateBriefing}
                      disabled={isApproving || needsRating}
                      className="gap-1.5"
                    >
                      Generate Briefing
                      {isApproving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  }
                />
                {needsRating && (
                  <TooltipContent>
                    Rate at least one image before generating
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {showGraph && (
        <BriefingGraph
          campaignId={campaign.id}
          onClose={() => setShowGraph(false)}
        />
      )}
    </div>
  );
}
