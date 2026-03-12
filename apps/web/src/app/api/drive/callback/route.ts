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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/w", request.url));
  }

  let state: { workspaceSlug: string; userId: string };
  try {
    state = JSON.parse(stateParam);
  } catch {
    return NextResponse.redirect(new URL("/w", request.url));
  }

  // Verify user matches
  if (state.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/w", request.url));
  }

  // Verify workspace membership
  const workspace = await prisma.workspace.findUnique({
    where: { slug: state.workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return NextResponse.redirect(new URL("/w", request.url));
  }

  // Exchange code for tokens
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Upsert source connection
  const existing = await prisma.sourceConnection.findFirst({
    where: { workspaceId: workspace.id, provider: "google_drive" },
  });

  if (existing) {
    await prisma.sourceConnection.update({
      where: { id: existing.id },
      data: {
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? existing.refreshToken,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        status: "connected",
      },
    });
  } else {
    await prisma.sourceConnection.create({
      data: {
        workspaceId: workspace.id,
        provider: "google_drive",
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        status: "connected",
      },
    });
  }

  return NextResponse.redirect(
    new URL(`/w/${state.workspaceSlug}/sources`, request.url),
  );
}
