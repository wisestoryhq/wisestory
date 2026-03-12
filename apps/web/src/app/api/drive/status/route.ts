import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceSlug = request.nextUrl.searchParams.get("workspace");
  if (!workspaceSlug) {
    return NextResponse.json(
      { error: "Missing workspace parameter" },
      { status: 400 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
      sourceConnections: {
        where: { provider: "google_drive" },
        take: 1,
        select: {
          status: true,
          _count: { select: { sourceFiles: true } },
        },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connection = workspace.sourceConnections[0];
  if (!connection) {
    return NextResponse.json({ status: "disconnected", files: {} });
  }

  // Count files by status
  const fileCounts = await prisma.sourceFile.groupBy({
    by: ["status"],
    where: { workspace: { slug: workspaceSlug } },
    _count: true,
  });

  const counts: Record<string, number> = {};
  for (const entry of fileCounts) {
    counts[entry.status] = entry._count;
  }

  const chunkCount = await prisma.knowledgeChunk.count({
    where: { workspace: { slug: workspaceSlug } },
  });

  return NextResponse.json({
    status: connection.status,
    totalFiles: connection._count.sourceFiles,
    files: counts,
    chunks: chunkCount,
  });
}
