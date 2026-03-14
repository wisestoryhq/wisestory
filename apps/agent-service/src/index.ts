import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { Runner, InMemorySessionService, StreamingMode } from "@google/adk";
import { createCreativeDirectorAgent } from "./agent.js";
import { prisma } from "./db.js";
import type { MediaType } from "@wisestory/prompts";

const app = new Hono();

app.use("/*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * Shared helper: creates the agent + runner for a generation request.
 */
async function buildRunner(body: {
  workspaceId: string;
  mediaType: MediaType;
  prompt: string;
}) {
  const { workspaceId, mediaType, prompt } = body;

  // Gemini vision supported image formats
  const SUPPORTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  // Fetch brand logos (up to 3) to pass as visual context
  const logos = await prisma.sourceFile.findMany({
    where: {
      workspaceId,
      contentType: "logo",
      imageData: { not: null },
      mimeType: { in: SUPPORTED_IMAGE_TYPES },
    },
    select: { name: true, mimeType: true, imageData: true },
    take: 3,
  });

  const agent = createCreativeDirectorAgent({
    workspaceId,
    mediaType,
    userPrompt: prompt,
    hasLogos: logos.length > 0,
  });

  const sessionService = new InMemorySessionService();
  const runner = new Runner({
    appName: "wisestory",
    agent,
    sessionService,
  });

  const session = await sessionService.createSession({
    appName: "wisestory",
    userId: "user",
  });

  // Wrap prompt with instructions to prevent models from asking questions
  const wrappedPrompt = `[AUTOMATED REQUEST — DO NOT ASK QUESTIONS]\n\n${prompt}\n\n[INSTRUCTIONS: Call retrieve_knowledge 3+ times, then write the actual content with [IMAGE: ...] tags. Do NOT ask questions. Do NOT write a creative brief. Start with the content immediately.]`;

  // Build multimodal parts: logos first (if any), then the text prompt
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (logos.length > 0) {
    parts.push({
      text: `[BRAND LOGOS: ${logos.length} attached. Use as brand identity reference.]`,
    });
    for (const logo of logos) {
      parts.push({
        inlineData: { mimeType: logo.mimeType, data: logo.imageData! },
      });
    }
  }
  parts.push({ text: wrappedPrompt });

  return { runner, session, prompt: wrappedPrompt, parts };
}

/**
 * POST /generate/stream
 * SSE endpoint that streams events as they arrive from the agent pipeline.
 *
 * Events:
 *   thinking  – planner agent text (chain of thought)
 *   part      – creator content part (text or image)
 *   done      – generation complete, parts saved to DB
 *   error     – something went wrong
 */
app.post("/generate/stream", async (c) => {
  const body = await c.req.json<{
    workspaceId: string;
    mediaType: MediaType;
    prompt: string;
    campaignId: string;
  }>();

  const { workspaceId, mediaType, prompt, campaignId } = body;

  if (!workspaceId || !mediaType || !prompt || !campaignId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const { runner, session, parts: messageParts } = await buildRunner({
        workspaceId,
        mediaType,
        prompt,
      });

      // Final parts for DB persistence (accumulated from complete events)
      const finalParts: Array<
        | { type: "text"; content: string }
        | { type: "image"; data: string; mimeType: string }
      > = [];

      // Buffer for accumulating streamed text chunks from the creator.
      // In SSE mode, the ADK yields BOTH partial chunks AND a final consolidated
      // event that repeats all the text. We stream partials to the client and
      // accumulate them for DB persistence, then skip the consolidated event.
      let creatorTextBuffer = "";
      // Total chars accumulated from partial events across the entire creator turn.
      // Used to detect and skip the final consolidated (non-partial) event that
      // repeats all the accumulated text.
      let totalPartialChars = 0;
      // Whether we've already emitted the creator_started signal
      let creatorStartedEmitted = false;

      const eventGenerator = runner.runAsync({
        userId: "user",
        sessionId: session.id,
        newMessage: {
          role: "user",
          parts: messageParts,
        },
        runConfig: {
          streamingMode: StreamingMode.SSE,
        },
      });

      for await (const event of eventGenerator) {
        const isPartial = event.partial === true;
        const isTurnComplete = event.turnComplete === true;

        const partsSummary = event.content?.parts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? event.content.parts.map((p: any) => {
              if ("text" in p) return `text(${(p.text as string)?.length ?? 0})`;
              if ("inlineData" in p) return `image(${p.inlineData?.mimeType})`;
              if ("functionCall" in p) return `fnCall`;
              if ("functionResponse" in p) return `fnResp`;
              return `unknown(${JSON.stringify(Object.keys(p))})`;
            })
          : "none";

        console.log(
          `[Event] author=${event.author} partial=${isPartial} turnComplete=${isTurnComplete} parts=[${partsSummary}]`
        );

        // Debug: log full event structure for creator
        if (event.author === "creator") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          event.content?.parts?.forEach((p: any, i: number) => {
            const keys = Object.keys(p);
            const hasText = "text" in p;
            const hasInlineData = "inlineData" in p;
            const hasFileData = "fileData" in p;
            const preview = hasText ? p.text?.substring(0, 100) : hasInlineData ? `mime=${p.inlineData?.mimeType} dataLen=${p.inlineData?.data?.length}` : hasFileData ? `fileUri=${p.fileData?.fileUri} mime=${p.fileData?.mimeType}` : JSON.stringify(p).substring(0, 200);
            console.log(`  [creator-debug-${i}] partial=${isPartial} keys=${JSON.stringify(keys)} text=${hasText} inlineData=${hasInlineData} fileData=${hasFileData} | ${preview}`);
          });
          // Also log raw event keys
          console.log(`  [creator-event] eventKeys=${JSON.stringify(Object.keys(event))} contentKeys=${JSON.stringify(event.content ? Object.keys(event.content) : 'null')}`);
        }

        if (!event.content?.parts) continue;

        for (const part of event.content.parts) {
          // --- Researcher events (knowledge retrieval) ---
          if (event.author === "researcher") {
            if ("text" in part && part.text) {
              // For partial planner text, stream as thinking chunks
              console.log(`  [thinking] ${part.text.substring(0, 80)}...`);
              await stream.writeSSE({
                event: "thinking",
                data: JSON.stringify({ text: part.text, partial: isPartial }),
              });
            }
            if ("functionCall" in part) {
              const fc = part.functionCall as {
                name: string;
                args: Record<string, unknown>;
              };
              const query =
                typeof fc.args?.query === "string" ? fc.args.query : "";
              const label = query
                ? `Searching: "${query}"`
                : `Calling: ${fc.name}`;
              console.log(`  [tool] ${label}`);
              await stream.writeSSE({
                event: "thinking",
                data: JSON.stringify({ text: label, tool: fc.name }),
              });
            }
            if ("functionResponse" in part) {
              await stream.writeSSE({
                event: "thinking",
                data: JSON.stringify({ text: "Retrieved knowledge chunk" }),
              });
            }
          }

          // --- Creator events (actual content) ---
          if (event.author === "creator") {
            // Signal that the creator agent has started (images will follow)
            if (!creatorStartedEmitted) {
              creatorStartedEmitted = true;
              await stream.writeSSE({
                event: "creator_started",
                data: "{}",
              });
            }
            if ("text" in part && part.text) {
              if (isPartial) {
                // Stream each partial text chunk for progressive display
                await stream.writeSSE({
                  event: "part",
                  data: JSON.stringify({
                    type: "text",
                    content: part.text,
                    partial: true,
                  }),
                });

                // Accumulate partials for DB
                creatorTextBuffer += part.text;
                totalPartialChars += part.text.length;
              } else if (totalPartialChars > 0) {
                // This is the ADK's consolidated event that repeats all
                // accumulated text. Skip it to avoid duplication.
                console.log(
                  `  [skip-consolidated] ${part.text.length} chars (already have ${totalPartialChars} from partials)`
                );
              } else {
                // No partials received (non-streaming fallback). Use directly.
                await stream.writeSSE({
                  event: "part",
                  data: JSON.stringify({
                    type: "text",
                    content: part.text,
                    partial: false,
                  }),
                });
                creatorTextBuffer += part.text;
              }
            }

            // Handle inline image data (gemini-2.5-flash-image style)
            if ("inlineData" in part && part.inlineData) {
              console.log(
                `  [image-inline] ${part.inlineData.mimeType} (${(part.inlineData.data?.length ?? 0)} bytes)`
              );

              // Flush any accumulated text before the image
              if (creatorTextBuffer) {
                finalParts.push({
                  type: "text",
                  content: creatorTextBuffer,
                });
                creatorTextBuffer = "";
              }

              const imagePart = {
                type: "image" as const,
                data: part.inlineData.data ?? "",
                mimeType: part.inlineData.mimeType ?? "image/png",
              };
              finalParts.push(imagePart);
              await stream.writeSSE({
                event: "part",
                data: JSON.stringify(imagePart),
              });
            }
          }
        }

        // When the creator's turn completes, flush text buffer
        if (event.author === "creator" && isTurnComplete && creatorTextBuffer) {
          finalParts.push({ type: "text", content: creatorTextBuffer });
          creatorTextBuffer = "";
        }
      }

      // Flush any remaining text
      if (creatorTextBuffer) {
        finalParts.push({ type: "text", content: creatorTextBuffer });
      }

      console.log(
        `[generate/stream] Pipeline complete: ${finalParts.length} final parts, ${totalPartialChars} partial chars`
      );

      // Save results to DB
      if (finalParts.length > 0) {
        await prisma.campaignOutput.create({
          data: {
            campaignId,
            parts: finalParts,
          },
        });
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "completed" },
      });

      await stream.writeSSE({ event: "done", data: "{}" });
    } catch (err) {
      console.error("[generate/stream] Error:", err);

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "failed" },
      });

      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          message: err instanceof Error ? err.message : "Generation failed",
        }),
      });
    }
  });
});

/**
 * POST /generate
 * Non-streaming endpoint (kept for backward compat / testing).
 */
app.post("/generate", async (c) => {
  const body = await c.req.json<{
    workspaceId: string;
    mediaType: MediaType;
    prompt: string;
    campaignId?: string;
  }>();

  const { workspaceId, mediaType, prompt } = body;

  if (!workspaceId || !mediaType || !prompt) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const { runner, session, parts: messageParts } = await buildRunner({
    workspaceId,
    mediaType,
    prompt,
  });

  const parts: Array<
    | { type: "text"; content: string }
    | { type: "image"; data: string; mimeType: string }
  > = [];
  let eventCount = 0;

  const eventGenerator = runner.runAsync({
    userId: "user",
    sessionId: session.id,
    newMessage: {
      role: "user",
      parts: messageParts,
    },
  });

  for await (const event of eventGenerator) {
    eventCount++;
    if (event.author === "creator" && event.content?.parts) {
      for (const part of event.content.parts) {
        if ("text" in part && part.text) {
          parts.push({ type: "text", content: part.text });
        }
        if ("inlineData" in part && part.inlineData) {
          parts.push({
            type: "image",
            data: part.inlineData.data ?? "",
            mimeType: part.inlineData.mimeType ?? "image/png",
          });
        }
      }
    }
  }

  return c.json({ parts, eventCount });
});

const port = parseInt(process.env.PORT ?? "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`Agent service running on http://localhost:${port}`);
});
