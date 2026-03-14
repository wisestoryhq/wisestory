import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/campaigns/[campaignId]/stream
 *
 * Initiates content generation for a campaign and streams SSE events
 * (thinking, parts, done/error) from the agent service to the client.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch campaign with workspace membership check
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
    include: {
      workspace: { select: { id: true } },
    },
  });

  if (!campaign) {
    return new Response("Not found", { status: 404 });
  }

  // If already completed/failed, return a done/error event immediately
  // so the client can update its state without hanging.
  if (campaign.status !== "generating") {
    const event =
      campaign.status === "failed"
        ? `event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`
        : `event: done\ndata: {}\n\n`;

    return new Response(event, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Call agent service streaming endpoint
  const agentUrl = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001";

  const agentResponse = await fetch(`${agentUrl}/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId: campaign.workspace.id,
      mediaType: campaign.mediaType,
      prompt: campaign.prompt,
      campaignId: campaign.id,
    }),
  });

  if (!agentResponse.ok || !agentResponse.body) {
    return new Response("Agent service error", { status: 502 });
  }

  // Actively pipe chunks to avoid Next.js buffering the passthrough stream.
  // A plain `new Response(agentResponse.body)` gets buffered; reading and
  // re-enqueuing each chunk forces the runtime to flush immediately.
  const upstream = agentResponse.body.getReader();

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await upstream.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel() {
      upstream.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
