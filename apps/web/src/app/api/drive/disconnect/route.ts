import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceSlug } = body as { workspaceSlug: string };

  if (!workspaceSlug) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
      sourceConnections: {
        where: { provider: "google_drive" },
        take: 1,
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connection = workspace.sourceConnections[0];
  if (!connection) {
    return NextResponse.json({ error: "No connection" }, { status: 404 });
  }

  // Delete knowledge chunks → source files → connection (cascade would handle
  // files but we want to be explicit about chunks)
  await prisma.knowledgeChunk.deleteMany({
    where: { sourceFile: { sourceConnectionId: connection.id } },
  });

  await prisma.sourceFile.deleteMany({
    where: { sourceConnectionId: connection.id },
  });

  await prisma.sourceConnection.delete({
    where: { id: connection.id },
  });

  return NextResponse.json({ ok: true });
}
