import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Runner, InMemorySessionService } from "@google/adk";
import type { Event } from "@google/adk";
import { createCreativeDirectorAgent } from "./agent.js";
import { prisma } from "./db.js";
import type { MediaType, ProjectContext } from "@wisestory/prompts";

const app = new Hono();

app.use("/*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * POST /generate
 * Triggers content generation using the ADK creative director agent.
 */
app.post("/generate", async (c) => {
  const body = await c.req.json<{
    workspaceId: string;
    projectId: string;
    mediaType: MediaType;
    prompt: string;
    campaignId?: string;
  }>();

  const { workspaceId, projectId, mediaType, prompt, campaignId } = body;

  if (!workspaceId || !projectId || !mediaType || !prompt) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Fetch project context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.workspaceId !== workspaceId) {
    return c.json({ error: "Project not found" }, 404);
  }

  const projectContext: ProjectContext = {
    projectName: project.name,
    brief: project.brief ?? undefined,
    targetAudience: project.audience ?? undefined,
    platform: project.platforms?.join(", ") ?? undefined,
    notes: project.notes ?? undefined,
  };

  // Create the agent
  const agent = createCreativeDirectorAgent({
    workspaceId,
    mediaType,
    project: projectContext,
    userPrompt: prompt,
  });

  // Run the agent
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

  // Collect all events
  const parts: Array<
    | { type: "text"; content: string }
    | { type: "image"; data: string; mimeType: string }
  > = [];
  const events: Event[] = [];

  const eventGenerator = runner.runAsync({
    userId: "user",
    sessionId: session.id,
    newMessage: {
      role: "user",
      parts: [{ text: prompt }],
    },
  });

  for await (const event of eventGenerator) {
    events.push(event);

    console.log(`[Event] author=${event.author}`);
    if ((event as any).errorCode || (event as any).errorMessage) {
      console.log(`  ERROR: ${(event as any).errorCode} - ${(event as any).errorMessage}`);
    }
    if (event.content) {
      console.log(`  content parts=${event.content.parts?.length ?? 0}`);
    }

    // Log all events for debugging
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if ("text" in part && part.text) {
          console.log(`  [text] ${part.text.substring(0, 100)}...`);
        }
        if ("inlineData" in part && part.inlineData) {
          console.log(`  [image] ${part.inlineData.mimeType} (${(part.inlineData.data?.length ?? 0)} bytes)`);
        }
        if ("functionCall" in part) {
          const fc = part.functionCall as { name: string; args: unknown };
          console.log(`  [functionCall] ${fc.name}(${JSON.stringify(fc.args).substring(0, 100)})`);
        }
        if ("functionResponse" in part) {
          const fr = part.functionResponse as { name: string };
          console.log(`  [functionResponse] ${fr.name}`);
        }
      }
    }

    // Only collect output from the creator agent (the one that generates images)
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

  return c.json({
    parts,
    eventCount: events.length,
  });
});

const port = parseInt(process.env.PORT ?? "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`Agent service running on http://localhost:${port}`);
});
