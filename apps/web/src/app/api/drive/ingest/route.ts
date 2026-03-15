import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/google-drive";
import { chunkText } from "@/lib/chunker";
import { generateEmbeddings, extractTextFromPdf } from "@/lib/embeddings";
import { isLikelyLogo } from "@/lib/logo-detection";
import type { SourceFileContentType } from "@wisestory/db";

// Mime types we can extract text from
const EXPORTABLE_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};

const DOWNLOADABLE_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

const MAX_LOGO_SIZE = 1_048_576; // 1 MB

// Gemini vision supported image formats
const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];

function classifyFile(
  mimeType: string,
  name: string,
): SourceFileContentType {
  if (
    Object.keys(EXPORTABLE_TYPES).includes(mimeType) ||
    DOWNLOADABLE_TEXT_TYPES.some((t) => mimeType.startsWith(t))
  ) {
    return "document";
  }
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) {
    return isLikelyLogo(name) ? "logo" : "photo";
  }
  return "other";
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceSlug } = (await request.json()) as {
    workspaceSlug: string;
  };

  if (!workspaceSlug) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
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
  if (!connection || connection.folderIds.length === 0) {
    return NextResponse.json(
      { error: "No folders selected" },
      { status: 400 },
    );
  }

  // Mark as syncing
  await prisma.sourceConnection.update({
    where: { id: connection.id },
    data: { status: "syncing" },
  });

  // Set up Drive client
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
  });

  // Refresh token
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await prisma.sourceConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: credentials.access_token ?? connection.accessToken,
        tokenExpiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    });
  } catch {
    await prisma.sourceConnection.update({
      where: { id: connection.id },
      data: { status: "error" },
    });
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    );
  }

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Start background processing — respond immediately
  processFiles(drive, workspace.id, connection.id, connection.folderIds).catch(
    async (err) => {
      console.error("Ingestion error:", err);
      await prisma.sourceConnection.update({
        where: { id: connection.id },
        data: { status: "error" },
      });
    },
  );

  return NextResponse.json({ status: "started" });
}

async function processFiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drive: any,
  workspaceId: string,
  connectionId: string,
  folderIds: string[],
) {
  // List all files in selected folders
  const allFiles: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    webViewLink?: string;
  }> = [];

  for (const folderId of folderIds) {
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "nextPageToken, files(id, name, mimeType, size, webViewLink)",
        pageSize: 100,
        pageToken,
      });
      if (res.data.files) {
        allFiles.push(...res.data.files);
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  let processedCount = 0;

  for (const file of allFiles) {
    try {
      const contentType = classifyFile(file.mimeType, file.name);

      // Upsert SourceFile record
      const sourceFile = await prisma.sourceFile.upsert({
        where: {
          workspaceId_externalId: {
            workspaceId,
            externalId: file.id,
          },
        },
        create: {
          workspaceId,
          sourceConnectionId: connectionId,
          externalId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          driveUrl: file.webViewLink ?? null,
          size: file.size ? parseInt(file.size) : null,
          status: "processing",
          contentType,
        },
        update: {
          name: file.name,
          mimeType: file.mimeType,
          status: "processing",
          contentType,
        },
      });

      // Extract text
      let text: string | null = null;

      if (EXPORTABLE_TYPES[file.mimeType]) {
        // Google Docs, Slides, Sheets — export as text
        const exportRes = await drive.files.export({
          fileId: file.id,
          mimeType: EXPORTABLE_TYPES[file.mimeType],
        });
        text = typeof exportRes.data === "string" ? exportRes.data : null;
      } else if (
        DOWNLOADABLE_TEXT_TYPES.some((t) => file.mimeType?.startsWith(t))
      ) {
        // Plain text files — download directly
        const downloadRes = await drive.files.get({
          fileId: file.id,
          alt: "media",
        });
        text =
          typeof downloadRes.data === "string"
            ? downloadRes.data
            : JSON.stringify(downloadRes.data);
      } else if (file.mimeType === "application/pdf") {
        // PDFs — download and extract text via Gemini (max 6 pages)
        try {
          const pdfRes = await drive.files.get(
            { fileId: file.id!, alt: "media" },
            { responseType: "arraybuffer" },
          );
          const pdfBuffer = Buffer.from(pdfRes.data as ArrayBuffer);
          // Skip large PDFs (>6 pages ≈ >500KB heuristic, or check actual pages)
          if (pdfBuffer.length > 2_000_000) {
            console.log(`[ingest] Skipping large PDF (${(pdfBuffer.length / 1024 / 1024).toFixed(1)}MB): ${file.name}`);
            text = `[PDF too large to index: ${file.name}]`;
          } else {
            text = await extractTextFromPdf(pdfBuffer);
            console.log(`[ingest] Extracted ${text.length} chars from PDF: ${file.name}`);
          }
        } catch (pdfErr) {
          console.error(`[ingest] PDF extraction failed for ${file.name}:`, pdfErr);
          text = `[PDF document: ${file.name}]`;
        }
      } else if (file.mimeType?.startsWith("image/")) {
        // Images — store reference
        text = `[Image: ${file.name}]`;

        // Download image data for logos (raster only, up to 1 MB)
        if (
          contentType === "logo" &&
          SUPPORTED_IMAGE_TYPES.includes(file.mimeType) &&
          (!file.size || parseInt(file.size) <= MAX_LOGO_SIZE)
        ) {
          try {
            const imgRes = await drive.files.get(
              { fileId: file.id, alt: "media" },
              { responseType: "arraybuffer" },
            );
            const base64 = Buffer.from(imgRes.data as ArrayBuffer).toString(
              "base64",
            );
            await prisma.sourceFile.update({
              where: { id: sourceFile.id },
              data: { imageData: base64 },
            });
          } catch (imgErr) {
            console.error(`Failed to download logo ${file.name}:`, imgErr);
          }
        }
      }

      if (!text || text.trim().length === 0) {
        await prisma.sourceFile.update({
          where: { id: sourceFile.id },
          data: {
            status: "indexed",
            extractedText: null,
            indexedAt: new Date(),
          },
        });
        continue;
      }

      // Store extracted text
      await prisma.sourceFile.update({
        where: { id: sourceFile.id },
        data: { extractedText: text },
      });

      // Chunk the text
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        await prisma.sourceFile.update({
          where: { id: sourceFile.id },
          data: { status: "indexed", indexedAt: new Date() },
        });
        continue;
      }

      // Generate embeddings
      const embeddings = await generateEmbeddings(chunks);

      // Delete existing chunks for this file (re-index)
      await prisma.knowledgeChunk.deleteMany({
        where: { sourceFileId: sourceFile.id },
      });

      // Store chunks with embeddings
      await prisma.knowledgeChunk.createMany({
        data: chunks.map((content, index) => ({
          workspaceId,
          sourceFileId: sourceFile.id,
          content,
          embedding: embeddings[index] ?? [],
          chunkIndex: index,
        })),
      });

      // Mark file as indexed
      await prisma.sourceFile.update({
        where: { id: sourceFile.id },
        data: { status: "indexed", indexedAt: new Date() },
      });

      processedCount++;
    } catch (err) {
      console.error(`Error processing file ${file.name}:`, err);
      // Mark individual file as error, continue with others
      const existing = await prisma.sourceFile.findFirst({
        where: { workspaceId, externalId: file.id },
      });
      if (existing) {
        await prisma.sourceFile.update({
          where: { id: existing.id },
          data: {
            status: "error",
            errorMessage:
              err instanceof Error ? err.message : "Unknown error",
          },
        });
      }
    }
  }

  // Mark connection as connected (done syncing)
  await prisma.sourceConnection.update({
    where: { id: connectionId },
    data: { status: "connected" },
  });

  console.log(
    `Ingestion complete: ${processedCount}/${allFiles.length} files processed`,
  );
}
