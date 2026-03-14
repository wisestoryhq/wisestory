"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeBriefingGeneration } from "@/app/actions/campaign";
import { BriefingChat } from "./briefing-chat";
import type { Message } from "./chat-message";
import { ArrowLeft, Loader2 } from "lucide-react";

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

type TextPart = { type: "text"; content: string };
type ImagePart = { type: "image"; data: string; mimeType: string };
type Part = TextPart | ImagePart;

function BriefingDocStream({ campaignId, workspaceSlug }: { campaignId: string; workspaceSlug: string }) {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [thinkingText, setThinkingText] = useState<string | null>("Starting...");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const textBufferRef = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    // Reset state so a strict-mode re-run starts clean
    textBufferRef.current = "";
    setParts([]);
    setError(null);
    setIsDone(false);
    setThinkingText("Starting...");

    (async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const statusText = response.status === 502
            ? "Agent service is not running. Start it and try again."
            : `Failed to connect (${response.status})`;
          setError(statusText);
          setThinkingText(null);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
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
                    setThinkingText(data.text || "Working...");
                    break;

                  case "part":
                    setThinkingText(null);
                    if (data.type === "text") {
                      textBufferRef.current += data.content;
                      setParts(prev => {
                        const newParts = [...prev];
                        const lastPart = newParts[newParts.length - 1];
                        if (lastPart && lastPart.type === "text") {
                          newParts[newParts.length - 1] = {
                            type: "text",
                            content: textBufferRef.current,
                          };
                        } else {
                          newParts.push({
                            type: "text",
                            content: textBufferRef.current,
                          });
                        }
                        return newParts;
                      });
                    } else if (data.type === "image") {
                      textBufferRef.current = "";
                      setParts(prev => [
                        ...prev,
                        { type: "image", data: data.data, mimeType: data.mimeType },
                      ]);
                    }
                    break;

                  case "done":
                    // handled after loop
                    break;

                  case "error":
                    setError(data.message || "Something went wrong");
                    setThinkingText(null);
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

        // Stream closed — update DB then transition to completed view
        setIsDone(true);
        setThinkingText(null);
        await completeBriefingGeneration(campaignId);
        router.refresh();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        setThinkingText(null);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with back button */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <Link
            href={`/w/${workspaceSlug}/campaigns`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium">
              {isDone ? "Briefing Complete" : "Generating Briefing..."}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border bg-background shadow-sm">
          {/* Document header */}
          <div className="border-b px-8 py-6">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Creative Briefing
            </h1>
            {!isDone && !error && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
          </div>

          {/* Streaming content */}
          <div className="px-8 py-6 space-y-4">
            {thinkingText && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{thinkingText}</span>
              </div>
            )}

            {parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div key={index} className="prose prose-sm max-w-none">
                    <SimpleMarkdown content={part.content} />
                  </div>
                );
              }
              if (part.type === "image") {
                return (
                  <div key={index} className="my-6">
                    <img
                      src={`data:${part.mimeType};base64,${part.data}`}
                      alt="Briefing reference image"
                      className="w-full rounded-lg shadow-sm"
                    />
                  </div>
                );
              }
              return null;
            })}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<strong key={match.index}>{match[5]}</strong>);
    } else if (match[6]) {
      parts.push(<em key={match.index}>{match[6]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 text-lg font-semibold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mt-8 mb-3 text-xl font-bold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="mt-8 mb-4 text-2xl font-bold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }

        if (trimmed === "---" || trimmed === "***") {
          return <hr key={i} className="my-6 border-border/50" />;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderInline(trimmed.slice(2))}
              </p>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {numberedMatch[1]}.
              </span>
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderInline(numberedMatch[2])}
              </p>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/90">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </>
  );
}

export function CreativeArea({ workspaceSlug, campaign, initialMessages }: Props) {
  if (campaign.status === "generating_doc") {
    return <BriefingDocStream campaignId={campaign.id} workspaceSlug={workspaceSlug} />;
  }

  return (
    <BriefingChat
      workspaceSlug={workspaceSlug}
      campaign={campaign}
      initialMessages={initialMessages}
    />
  );
}
