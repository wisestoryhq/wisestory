import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate embeddings for an array of text chunks using Gemini text-embedding-004.
 * Returns an array of float arrays, one per chunk.
 */
export async function generateEmbeddings(
  chunks: string[],
): Promise<number[][]> {
  if (chunks.length === 0) return [];

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  // Process in batches of 100 (API limit)
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const result = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { role: "user", parts: [{ text }] },
      })),
    });
    allEmbeddings.push(...result.embeddings.map((e) => e.values));
  }

  return allEmbeddings;
}
