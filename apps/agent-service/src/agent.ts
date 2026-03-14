import { LlmAgent } from "@google/adk";
import { BRIEFING_CHAT_INSTRUCTION } from "@wisestory/prompts";
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

  return new LlmAgent({
    name: "briefing_director",
    model: "gemini-2.5-flash-image",
    instruction,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });
}
