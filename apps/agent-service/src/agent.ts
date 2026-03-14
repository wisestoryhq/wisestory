import { LlmAgent } from "@google/adk";
import { BRIEFING_CHAT_INSTRUCTION, BRIEFING_DOCUMENT_INSTRUCTION, MEDIA_TYPE_ASPECT_RATIOS } from "@wisestory/prompts";
import type { MediaType } from "@wisestory/prompts";

/**
 * Creates a briefing chat agent — single LlmAgent with gemini-2.5-flash-image.
 * No tools. Brand knowledge is pre-fetched and injected into the instruction.
 * The model generates text AND images inline naturally.
 */
export function createBriefingChatAgent({
  mediaType,
  brandKnowledge,
}: {
  mediaType: MediaType;
  brandKnowledge?: string;
}): LlmAgent {
  let instruction = BRIEFING_CHAT_INSTRUCTION.replace("{mediaType}", mediaType);

  if (brandKnowledge) {
    instruction = instruction.replace(
      "## Target Platform",
      `## Brand Context\n${brandKnowledge}\n\n## Target Platform`
    );
  }

  const aspectRatio = MEDIA_TYPE_ASPECT_RATIOS[mediaType] ?? "1:1";

  return new LlmAgent({
    name: "briefing_director",
    model: "gemini-2.5-flash-image",
    instruction,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
      },
    },
  });
}

/**
 * Creates a briefing document agent that generates a multimodal briefing
 * document from the knowledge graph summary. Uses gemini-2.5-flash-image
 * to produce text + inline images.
 */
export function createBriefingDocumentAgent({
  graphSummary,
  mediaType,
}: {
  graphSummary: string;
  mediaType: MediaType;
}): LlmAgent {
  const instruction = `${BRIEFING_DOCUMENT_INSTRUCTION}

## Campaign Platform
${mediaType}

## Knowledge Graph Summary
${graphSummary}

Write the briefing document now. Include generated reference images where appropriate.`;

  const aspectRatio = MEDIA_TYPE_ASPECT_RATIOS[mediaType] ?? "1:1";

  return new LlmAgent({
    name: "briefing_document",
    model: "gemini-2.5-flash-image",
    instruction,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
      },
    },
  });
}
