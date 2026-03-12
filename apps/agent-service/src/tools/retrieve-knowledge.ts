import { FunctionTool } from "@google/adk";
import { z } from "zod/v4";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function embedQuery(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.batchEmbedContents({
    requests: [{ content: { role: "user", parts: [{ text }] } }],
  });
  return result.embeddings[0]?.values ?? [];
}

/**
 * Creates a retrieve_knowledge tool scoped to a specific workspace.
 * The workspaceId is captured in the closure for tenant isolation.
 */
export function createRetrieveKnowledgeTool(workspaceId: string) {
  return new FunctionTool({
    name: "retrieve_knowledge",
    description:
      "Retrieves relevant brand knowledge, guidelines, and content from the workspace knowledge base. Use this to ground your creative output in actual brand materials. Call this multiple times with different queries to get comprehensive brand context.",
    parameters: z.object({
      query: z
        .string()
        .describe("Search query to find relevant brand knowledge"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of results to return (default 15)"),
    }),
    execute: async ({ query, maxResults }) => {
      const limit = maxResults ?? 15;

      const queryEmbedding = await embedQuery(query);
      if (queryEmbedding.length === 0) {
        return { results: [], error: "Failed to generate query embedding" };
      }

      const vectorStr = `[${queryEmbedding.join(",")}]`;

      const results: Array<{
        content: string;
        similarity: number;
        fileName: string;
        driveUrl: string | null;
      }> = await prisma.$queryRawUnsafe(
        `
        SELECT
          kc.content,
          1 - (kc.embedding::vector <=> $1::vector) as similarity,
          sf.name as "fileName",
          sf."driveUrl"
        FROM knowledge_chunks kc
        JOIN source_files sf ON sf.id = kc."sourceFileId"
        WHERE kc."workspaceId" = $2
          AND sf.status = 'indexed'
        ORDER BY kc.embedding::vector <=> $1::vector
        LIMIT $3
        `,
        vectorStr,
        workspaceId,
        limit,
      );

      return {
        results: results.map((r) => ({
          content: r.content,
          similarity: Math.round(r.similarity * 100) / 100,
          source: r.fileName,
          driveUrl: r.driveUrl,
        })),
      };
    },
  });
}
