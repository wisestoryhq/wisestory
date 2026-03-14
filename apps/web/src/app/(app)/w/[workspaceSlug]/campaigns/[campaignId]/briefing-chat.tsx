"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateBriefingDoc } from "@/app/actions/campaign";
import { ChatMessage } from "./chat-message";
import { BriefingGraph } from "./briefing-graph";
import {
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images: Array<{ data: string; mimeType: string }>;
  createdAt: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Ref-based guard to prevent React strict mode double-fire
  const isStreamingRef = useRef(false);
  const hasSentInitialRef = useRef(false);

  const base = `/w/${workspaceSlug}`;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingText]);

  // Auto-send the initial prompt as first message if no messages exist
  useEffect(() => {
    if (
      !hasSentInitialRef.current &&
      initialMessages.length === 0 &&
      campaign.prompt
    ) {
      hasSentInitialRef.current = true;
      sendMessage(campaign.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isStreamingRef.current) return;

    // Use ref for immediate guard (not batched like setState)
    isStreamingRef.current = true;
    setError(null);
    setIsStreaming(true);
    setThinkingText(null);

    // Add user message to UI
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      images: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Stream response from agent service (server loads history from DB)
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";
    const assistantImages: Array<{ data: string; mimeType: string }> = [];

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to creative director");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add placeholder assistant message
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          images: [],
          createdAt: new Date().toISOString(),
        },
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
                    // Delta append (not replace!)
                    assistantContent += data.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: assistantContent }
                          : m
                      )
                    );
                  } else if (data.type === "image") {
                    assistantImages.push({
                      data: data.data,
                      mimeType: data.mimeType,
                    });
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, images: [...assistantImages] }
                          : m
                      )
                    );
                  }
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

      // Assistant message is saved by the agent service directly to DB
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
      // Extract the last assistant message as the briefing summary
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      const summary = lastAssistant?.content || campaign.prompt;

      await generateBriefingDoc(campaign.id, summary);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate briefing");
      setIsApproving(false);
    }
  }

  const hasAssistantResponse = messages.some((m) => m.role === "assistant" && m.content);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
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
        {/* intentionally empty — actions moved to input area */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Thinking indicator */}
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

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input + Actions */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-2xl space-y-2">
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
                  "w-full rounded-xl border bg-background px-4 py-3 pr-12 text-sm",
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
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowGraph(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Network className="h-3.5 w-3.5" />
                View Graph
              </button>
              <Button
                size="sm"
                onClick={handleGenerateBriefing}
                disabled={isApproving}
                className="gap-1.5 bg-[#f6b900] text-white hover:bg-[#e0a800]"
              >
                {isApproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Generate Briefing
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Graph Overlay */}
      {showGraph && (
        <BriefingGraph
          campaignId={campaign.id}
          onClose={() => setShowGraph(false)}
        />
      )}
    </div>
  );
}
