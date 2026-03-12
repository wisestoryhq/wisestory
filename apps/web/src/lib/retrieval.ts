import { prisma } from "@/lib/db";
import { generateEmbeddings } from "@/lib/embeddings";

export type RetrievalResult = {
  content: string;
  chunkIndex: number;
  similarity: number;
  source: {
    fileId: string;
    fileName: string;
    mimeType: string;
    driveUrl: string | null;
  };
};

/**
 * Retrieve relevant knowledge chunks for a query using vector similarity search.
 * Scoped to a workspace to enforce tenant isolation.
 */
export async function retrieveKnowledge({
  workspaceId,
  query,
  maxResults = 15,
}: {
  workspaceId: string;
  query: string;
  maxResults?: number;
}): Promise<RetrievalResult[]> {
  // Embed the query using the same model as ingestion
  const [queryEmbedding] = await generateEmbeddings([query]);
  if (!queryEmbedding) return [];

  // Convert to pgvector format: [0.1, 0.2, ...]
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Vector similarity search using cosine distance
  // The embedding column is Float[] — we cast it to vector for the operator
  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      content: string;
      chunkIndex: number;
      similarity: number;
      sourceFileId: string;
      fileName: string;
      mimeType: string;
      driveUrl: string | null;
    }>
  >(
    `
    SELECT
      kc.id,
      kc.content,
      kc."chunkIndex",
      1 - (kc.embedding::vector <=> $1::vector) as similarity,
      kc."sourceFileId",
      sf.name as "fileName",
      sf."mimeType",
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
    maxResults,
  );

  return results.map((r) => ({
    content: r.content,
    chunkIndex: r.chunkIndex,
    similarity: r.similarity,
    source: {
      fileId: r.sourceFileId,
      fileName: r.fileName,
      mimeType: r.mimeType,
      driveUrl: r.driveUrl,
    },
  }));
}
