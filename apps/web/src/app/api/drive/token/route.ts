import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { createOAuth2Client } from "@/lib/google-drive";

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

  // Refresh the token if needed
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update stored tokens
  await prisma.sourceConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: credentials.access_token ?? connection.accessToken,
      tokenExpiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    },
  });

  return NextResponse.json({
    accessToken: credentials.access_token,
  });
}
