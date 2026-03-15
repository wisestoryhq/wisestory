import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceSlug = request.nextUrl.searchParams.get("workspace");
  const parentId = request.nextUrl.searchParams.get("parentId");

  if (!workspaceSlug) {
    return NextResponse.json(
      { error: "Missing workspace parameter" },
      { status: 400 },
    );
  }

  // Find workspace and connection
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
      sourceConnections: {
        where: { provider: "google_drive", status: "connected" },
        take: 1,
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connection = workspace.sourceConnections[0];
  if (!connection) {
    return NextResponse.json(
      { error: "No Drive connection" },
      { status: 404 },
    );
  }

  // Set up authenticated Drive client
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const query = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name, mimeType)",
    orderBy: "name",
    pageSize: 100,
  });

  return NextResponse.json({
    folders: response.data.files ?? [],
    selectedFolderIds: connection.folderIds,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceSlug, folderIds, folderNames } = body as {
    workspaceSlug: string;
    folderIds: string[];
    folderNames?: string[];
  };

  if (!workspaceSlug || !Array.isArray(folderIds)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
      sourceConnections: {
        where: { provider: "google_drive", status: "connected" },
        take: 1,
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connection = workspace.sourceConnections[0];
  if (!connection) {
    return NextResponse.json(
      { error: "No Drive connection" },
      { status: 404 },
    );
  }

  const previousFolderIds = new Set(connection.folderIds);
  const newFolderIds = new Set(folderIds);
  const removedFolders = [...previousFolderIds].filter((id) => !newFolderIds.has(id));

  // If folders were removed, delete all indexed files + chunks and re-index
  if (removedFolders.length > 0) {
    // Delete knowledge chunks for files in this connection
    await prisma.knowledgeChunk.deleteMany({
      where: {
        sourceFile: { sourceConnectionId: connection.id },
      },
    });

    // Delete source files for this connection
    await prisma.sourceFile.deleteMany({
      where: { sourceConnectionId: connection.id },
    });
  }

  // If no folders left, keep connected but clear folders
  if (folderIds.length === 0) {
    await prisma.sourceConnection.update({
      where: { id: connection.id },
      data: {
        folderIds: [],
        folderNames: [],
        status: "connected",
      },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.sourceConnection.update({
    where: { id: connection.id },
    data: { folderIds, folderNames: folderNames ?? [] },
  });

  return NextResponse.json({ ok: true });
}
