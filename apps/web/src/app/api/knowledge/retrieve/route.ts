import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { retrieveKnowledge } from "@/lib/retrieval";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceSlug, query, maxResults } = (await request.json()) as {
    workspaceSlug: string;
    query: string;
    maxResults?: number;
  };

  if (!workspaceSlug || !query) {
    return NextResponse.json(
      { error: "Missing workspaceSlug or query" },
      { status: 400 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const results = await retrieveKnowledge({
    workspaceId: workspace.id,
    query,
    maxResults: maxResults ?? 15,
  });

  return NextResponse.json({ results });
}
