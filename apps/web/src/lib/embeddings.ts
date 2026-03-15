import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMBEDDING_MODEL = "gemini-embedding-2-preview";

/**
 * Generate embeddings for an array of text chunks using Gemini Embedding 2.
 * Returns an array of float arrays, one per chunk.
 */
export async function generateEmbeddings(
  chunks: string[],
): Promise<number[][]> {
  if (chunks.length === 0) return [];

  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

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

/**
 * Extract text from a PDF using Gemini, then return the text.
 */
export async function extractTextFromPdf(
  pdfBytes: Buffer,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBytes.toString("base64"),
      },
    },
    {
      text: "Extract all the text content from this PDF document. Return only the extracted text, preserving the structure (headings, paragraphs, lists). Do not add any commentary.",
    },
  ]);

  return result.response.text();
}
