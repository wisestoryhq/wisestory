import { google } from "googleapis";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/drive/callback`,
  );
}

export const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
