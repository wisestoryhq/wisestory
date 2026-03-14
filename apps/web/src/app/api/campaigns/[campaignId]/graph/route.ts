import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/campaigns/[campaignId]/graph
 *
 * Returns the briefing knowledge graph (nodes + edges) for a campaign.
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

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
  });

  if (!campaign) {
    return new Response("Not found", { status: 404 });
  }

  const nodes = await prisma.briefingNode.findMany({
    where: { campaignId },
    select: {
      id: true,
      nodeType: true,
      title: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const edges = await prisma.briefingEdge.findMany({
    where: {
      source: { campaignId },
    },
    select: {
      id: true,
      sourceId: true,
      targetId: true,
      relationshipType: true,
      weight: true,
    },
  });

  return Response.json({ nodes, edges });
}
