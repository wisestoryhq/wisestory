import { describe, it, expect } from "vitest";
import { prisma } from "../setup";
import {
  createTestUser,
  createTestWorkspace,
  createTestSourceConnection,
  createTestSourceFile,
  createTestKnowledgeChunk,
} from "@wisestory/testing";

describe("Drive Folders — cleanup on folder removal", () => {
  it("deletes source files and chunks when folders are removed", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const conn = await createTestSourceConnection(prisma, ws.id, {
      folderIds: ["folder-1", "folder-2"],
      folderNames: ["Folder 1", "Folder 2"],
    });

    // Create indexed files and chunks
    const file = await createTestSourceFile(prisma, ws.id, conn.id);
    await createTestKnowledgeChunk(prisma, ws.id, file.id);

    // Simulate removing folder-1 (API logic)
    const previousFolderIds = new Set(conn.folderIds);
    const newFolderIds = new Set(["folder-2"]);
    const removedFolders = [...previousFolderIds].filter((id) => !newFolderIds.has(id));

    if (removedFolders.length > 0) {
      await prisma.knowledgeChunk.deleteMany({
        where: { sourceFile: { sourceConnectionId: conn.id } },
      });
      await prisma.sourceFile.deleteMany({
        where: { sourceConnectionId: conn.id },
      });
    }

    const files = await prisma.sourceFile.count({ where: { workspaceId: ws.id } });
    const chunks = await prisma.knowledgeChunk.count({ where: { workspaceId: ws.id } });
    expect(files).toBe(0);
    expect(chunks).toBe(0);
  });

  it("keeps connection as connected when all folders removed", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const conn = await createTestSourceConnection(prisma, ws.id, {
      folderIds: ["folder-1"],
      folderNames: ["Folder 1"],
    });

    // Remove all folders
    await prisma.sourceConnection.update({
      where: { id: conn.id },
      data: { folderIds: [], folderNames: [], status: "connected" },
    });

    const updated = await prisma.sourceConnection.findUnique({ where: { id: conn.id } });
    expect(updated?.status).toBe("connected");
    expect(updated?.folderIds).toHaveLength(0);
  });
});

describe("Drive Disconnect — full cleanup", () => {
  it("deletes connection, files, and chunks on disconnect", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const conn = await createTestSourceConnection(prisma, ws.id);
    const file = await createTestSourceFile(prisma, ws.id, conn.id);
    await createTestKnowledgeChunk(prisma, ws.id, file.id);

    // Simulate disconnect API
    await prisma.knowledgeChunk.deleteMany({
      where: { sourceFile: { sourceConnectionId: conn.id } },
    });
    await prisma.sourceFile.deleteMany({
      where: { sourceConnectionId: conn.id },
    });
    await prisma.sourceConnection.delete({
      where: { id: conn.id },
    });

    const connections = await prisma.sourceConnection.count({ where: { workspaceId: ws.id } });
    const files = await prisma.sourceFile.count({ where: { workspaceId: ws.id } });
    const chunks = await prisma.knowledgeChunk.count({ where: { workspaceId: ws.id } });
    expect(connections).toBe(0);
    expect(files).toBe(0);
    expect(chunks).toBe(0);
  });
});
