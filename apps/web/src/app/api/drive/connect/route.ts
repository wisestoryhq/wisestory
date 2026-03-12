import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createOAuth2Client, DRIVE_SCOPES } from "@/lib/google-drive";

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

  const oauth2Client = createOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: DRIVE_SCOPES,
    prompt: "consent",
    state: JSON.stringify({ workspaceSlug, userId: session.user.id }),
  });

  return NextResponse.redirect(authUrl);
}
