import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * POST /api/campaigns/[campaignId]/chat
 *
 * SSE proxy to the agent service's /chat/stream endpoint.
 * Accepts a message + history and streams back the creative director's response.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  if (campaign.status !== "briefing") {
    return new Response("Campaign is not in briefing phase", { status: 400 });
  }

  const body = await req.json();
  const { message } = body;

  if (!message) {
    return new Response("Missing message", { status: 400 });
  }

  const agentUrl = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001";

  const agentResponse = await fetch(`${agentUrl}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId,
      workspaceId: campaign.workspace.id,
      message,
      mediaType: campaign.mediaType,
    }),
  });

  if (!agentResponse.ok || !agentResponse.body) {
    return new Response("Agent service error", { status: 502 });
  }

  // Pipe chunks to prevent Next.js buffering
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
