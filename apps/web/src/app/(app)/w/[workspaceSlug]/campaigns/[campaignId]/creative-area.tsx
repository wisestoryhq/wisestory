"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BriefingChat } from "./briefing-chat";
import { ArrowLeft, Loader2 } from "lucide-react";

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
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();

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
                    setIsDone(true);
                    setThinkingText(null);
                    router.refresh();
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
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        setThinkingText(null);
      }
    })();

    return () => controller.abort();
  }, [campaignId, router]);

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
              {trimmed.slice(4)}
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
              {trimmed.slice(3)}
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
              {trimmed.slice(2)}
            </h1>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              <p className="text-sm leading-relaxed">{trimmed.slice(2)}</p>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed">{trimmed}</p>
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
