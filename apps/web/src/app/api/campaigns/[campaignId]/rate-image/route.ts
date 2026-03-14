import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * GET /api/campaigns/[campaignId]/rate-image
 *
 * Returns all explicit user ratings for images in this campaign.
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
    where: {
      campaignId,
      metadata: {
        path: ["ratingSource"],
        equals: "user_explicit",
      },
    },
    select: {
      id: true,
      nodeType: true,
      metadata: true,
    },
  });

  const ratings = nodes.map((node) => {
    const meta = node.metadata as Record<string, unknown>;
    return {
      messageId: meta.messageId as string,
      partIndex: meta.partIndex as number,
      rating: node.nodeType === "liked_image" ? "like" : "dislike",
    };
  });

  return Response.json({ ratings });
}

/**
 * POST /api/campaigns/[campaignId]/rate-image
 *
 * Rate an image as liked or disliked.
 * Body: { messageId, partIndex, rating: "like" | "dislike", imageData, imageMimeType }
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
  });

  if (!campaign) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json();
  const { messageId, partIndex, rating, imageData, imageMimeType } = body;

  if (!messageId || partIndex == null || !["like", "dislike"].includes(rating)) {
    return new Response("Bad request", { status: 400 });
  }

  const nodeType = rating === "like" ? "liked_image" : "rejected_option";
  const metadata = { messageId, partIndex, ratingSource: "user_explicit" };

  // Find existing rating for this image
  const existing = await prisma.briefingNode.findFirst({
    where: {
      campaignId,
      metadata: {
        path: ["messageId"],
        equals: messageId,
      },
      AND: {
        metadata: {
          path: ["partIndex"],
          equals: partIndex,
        },
      },
    },
  });

  if (existing) {
    const updated = await prisma.briefingNode.update({
      where: { id: existing.id },
      data: { nodeType },
    });
    return Response.json({ node: updated });
  }

  const created = await prisma.briefingNode.create({
    data: {
      campaignId,
      nodeType,
      title: `Image ${partIndex + 1} from message`,
      content: `User ${rating}d this concept image`,
      imageData: imageData || null,
      imageMimeType: imageMimeType || null,
      metadata,
    },
  });

  return Response.json({ node: created });
}
