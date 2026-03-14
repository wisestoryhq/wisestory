import { CREATIVE_DIRECTOR_BASE } from "./base";
import { getMediaTypeInstruction } from "./media-types";
import type { MediaType } from "./types";

/**
 * Build the complete agent instruction for a generation request.
 * This becomes the `instruction` field on the ADK LlmAgent.
 */
export function buildAgentInstruction({
  mediaType,
  userPrompt,
}: {
  mediaType: MediaType;
  userPrompt: string;
}): string {
  const mediaInstruction = getMediaTypeInstruction(mediaType);

  return `${CREATIVE_DIRECTOR_BASE}

${mediaInstruction}

## User Request

${userPrompt}

## Retrieval Instructions

Before generating content, you MUST:
1. Call \`retrieve_knowledge\` with a query about the brand's voice, tone, and guidelines
2. Call \`retrieve_knowledge\` with a query about the brand's visual identity and colors
3. Call \`retrieve_knowledge\` with a query related to the user's specific topic/request
4. Use the retrieved knowledge to ground ALL text and visual output

Do not skip retrieval. Do not generate generic content. Every output must be grounded in the actual brand materials.`;
}
