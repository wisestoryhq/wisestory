"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeBriefingGeneration } from "@/app/actions/campaign";
import { BriefingChat } from "./briefing-chat";
import { BriefingMarkdown } from "./briefing-markdown";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as content streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [parts, thinkingText]);

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
            <h1 className="text-sm font-medium">Creative Briefing</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border bg-background shadow-sm">
          {/* Document header */}
          <div className="border-b px-8 py-6">
            <h1 className="text-2xl font-bold tracking-tight">
              Creative Briefing
            </h1>
          </div>

          {/* Streaming content */}
          <div className="px-8 py-6">
            <div className="briefing-prose">
              {parts.map((part, index) => {
                if (part.type === "text") {
                  return <BriefingMarkdown key={index} content={part.content} />;
                }
                if (part.type === "image") {
                  return (
                    <div key={index} className="my-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Generating indicator below card */}
        {!isDone && !error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating your creative briefing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
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
