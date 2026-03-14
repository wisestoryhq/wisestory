import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { Runner, InMemorySessionService, StreamingMode } from "@google/adk";
import { createBriefingChatAgent } from "./agent.js";
import { retrieveKnowledge } from "./tools/retrieve-knowledge.js";
import { extractBriefingDecisions } from "./tools/extract-decisions.js";
import { prisma } from "./db.js";
import type { MediaType } from "@wisestory/prompts";

const app = new Hono();

app.use("/*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * POST /chat/stream
 * SSE endpoint for the briefing chat. Single agent with tools + image generation.
 * Server loads history from DB — client only sends the new message.
 *
 * Events: thinking, part, done, error
 */
app.post("/chat/stream", async (c) => {
  const body = await c.req.json<{
    campaignId: string;
    workspaceId: string;
    message: string;
    mediaType: MediaType;
  }>();

  const { campaignId, workspaceId, message, mediaType } = body;

  if (!campaignId || !workspaceId || !message || !mediaType) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      // Save user message to DB immediately
      await prisma.campaignMessage.create({
        data: { campaignId, role: "user", content: message },
      });

      // Load full conversation history from DB
      const dbMessages = await prisma.campaignMessage.findMany({
        where: { campaignId },
        orderBy: { createdAt: "asc" },
      });

      // Build history as text preamble
      const historyMessages = dbMessages.slice(0, -1);
      const isFirstMessage = historyMessages.length === 0;
      let historyPreamble = "";
      if (!isFirstMessage) {
        const historyText = historyMessages
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "Client" : "Creative Director"}: ${m.content}`)
          .join("\n\n");
        historyPreamble = `[CONVERSATION SO FAR]\n${historyText}\n[END CONVERSATION]\n\nNow respond to the client's latest message:\n\n`;
      }

      // First message only: fetch brand knowledge via retrieve_knowledge
      let brandKnowledge = "";
      if (isFirstMessage) {
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({ text: "Retrieving brand context..." }),
        });

        const queries = [
          "brand voice and tone guidelines",
          "visual identity, colors, and design style",
          "target audience and brand positioning",
        ];
        const allResults = await Promise.all(
          queries.map((q) => retrieveKnowledge(workspaceId, q, 10))
        );
        const uniqueChunks = new Map<string, string>();
        for (const results of allResults) {
          for (const r of results) {
            if (!uniqueChunks.has(r.content)) {
              uniqueChunks.set(r.content, `[${r.source}] ${r.content}`);
            }
          }
        }
        if (uniqueChunks.size > 0) {
          brandKnowledge = Array.from(uniqueChunks.values()).join("\n\n");
        }

        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({ text: "Brand context loaded" }),
        });
      }

      // Create agent (no tools — gemini-2.5-flash-image generates text+images inline)
      const agent = createBriefingChatAgent({
        mediaType,
        brandKnowledge: brandKnowledge || undefined,
      });

      const sessionService = new InMemorySessionService();
      const runner = new Runner({ appName: "wisestory", agent, sessionService });
      const session = await sessionService.createSession({ appName: "wisestory", userId: "user" });

      // Build message parts — logos + history + message
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      // Always attach brand logos (image model needs them for visual reference)
      const logos = await prisma.sourceFile.findMany({
        where: {
          workspaceId,
          contentType: "logo",
          imageData: { not: null },
          mimeType: { in: ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"] },
        },
        select: { mimeType: true, imageData: true },
        take: 3,
      });
      if (logos.length > 0) {
        parts.push({ text: `[BRAND LOGOS: Reproduce this exact logo in any generated images.]` });
        for (const logo of logos) {
          parts.push({ inlineData: { mimeType: logo.mimeType, data: logo.imageData! } });
        }
      }

      parts.push({ text: `${historyPreamble}${message}` });

      // Stream response
      let textBuffer = "";
      let totalPartialChars = 0;
      const collectedImages: Array<{ data: string; mimeType: string }> = [];

      const eventGenerator = runner.runAsync({
        userId: "user",
        sessionId: session.id,
        newMessage: { role: "user", parts },
        runConfig: { streamingMode: StreamingMode.SSE },
      });

      for await (const event of eventGenerator) {
        const isPartial = event.partial === true;

        // Check for API errors
        const errorCode = (event as { errorCode?: string }).errorCode;
        if (errorCode && /^\d+$/.test(errorCode)) {
          console.error(`[chat/stream] API error: ${errorCode}`);
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({ message: errorCode === "429" ? "Rate limited — please wait and try again" : `API error: ${errorCode}` }),
          });
          continue;
        }

        if (!event.content?.parts) continue;

        for (const part of event.content.parts) {
          // Text → delta stream
          if ("text" in part && part.text) {
            if (isPartial) {
              await stream.writeSSE({
                event: "part",
                data: JSON.stringify({ type: "text", content: part.text, partial: true }),
              });
              textBuffer += part.text;
              totalPartialChars += part.text.length;
            } else if (totalPartialChars > 0) {
              // Skip consolidated event
            } else {
              await stream.writeSSE({
                event: "part",
                data: JSON.stringify({ type: "text", content: part.text, partial: false }),
              });
              textBuffer += part.text;
            }
          }

          // Image → send complete
          if ("inlineData" in part && part.inlineData) {
            const img = { data: part.inlineData.data ?? "", mimeType: part.inlineData.mimeType ?? "image/png" };
            collectedImages.push(img);
            await stream.writeSSE({
              event: "part",
              data: JSON.stringify({ type: "image", ...img }),
            });
          }
        }
      }

      // Save assistant message to DB
      if (textBuffer || collectedImages.length > 0) {
        await prisma.campaignMessage.create({
          data: {
            campaignId,
            role: "assistant",
            content: textBuffer,
            images: collectedImages.length > 0 ? collectedImages : undefined,
          },
        });
        console.log(`[chat/stream] Saved: ${textBuffer.length} chars, ${collectedImages.length} images`);

        // Fire-and-forget decision extraction into knowledge graph
        void extractBriefingDecisions(
          campaignId,
          textBuffer,
          collectedImages,
          historyPreamble + message
        ).catch(err => console.error("[chat/stream] Decision extraction failed:", err));
      }

      await stream.writeSSE({ event: "done", data: "{}" });
    } catch (err) {
      console.error("[chat/stream] Error:", err);
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ message: err instanceof Error ? err.message : "Chat failed" }),
      });
    }
  });
});

const port = parseInt(process.env.PORT ?? "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`Agent service running on http://localhost:${port}`);
});
