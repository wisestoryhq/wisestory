import { LlmAgent, SequentialAgent } from "@google/adk";
import {
  getMediaTypeInstruction,
  MEDIA_TYPE_ASPECT_RATIOS,
  MEDIA_TYPE_ASPECT_LABELS,
  BRIEFING_DIRECTOR_INSTRUCTION,
  IMAGE_GENERATION_INSTRUCTION,
} from "@wisestory/prompts";
import type { MediaType } from "@wisestory/prompts";
import { createRetrieveKnowledgeTool } from "./tools/retrieve-knowledge.js";

/**
 * Creates a two-agent pipeline for content generation:
 *
 * 1. Researcher Agent (gemini-2.5-flash + tools)
 *    - Retrieves brand knowledge via retrieve_knowledge tool
 *    - Outputs raw brand context (voice, visuals, colors, audience)
 *
 * 2. Creator Agent (gemini-2.5-flash-image + TEXT+IMAGE)
 *    - Receives brand knowledge as context
 *    - Has full creative freedom to write content and generate images
 *    - Decides how to interleave text and images
 */
export function createCreativeDirectorAgent({
  workspaceId,
  mediaType,
  userPrompt,
  hasLogos = false,
}: {
  workspaceId: string;
  mediaType: MediaType;
  userPrompt: string;
  hasLogos?: boolean;
}) {
  const mediaTypeInstruction = getMediaTypeInstruction(mediaType);
  const aspectRatio = MEDIA_TYPE_ASPECT_RATIOS[mediaType];
  const aspectLabel = MEDIA_TYPE_ASPECT_LABELS[mediaType];

  const logoInstruction = hasLogos
    ? `\nThe brand's actual logo images are attached. Reproduce the EXACT logo in your visuals.`
    : "";

  const retrieveKnowledge = createRetrieveKnowledgeTool(workspaceId);

  // Agent 1: Pure knowledge retrieval
  const researcherAgent = new LlmAgent({
    name: "researcher",
    model: "gemini-2.5-flash",
    description:
      "Retrieves brand knowledge from the workspace knowledge base.",
    instruction: `You are a research assistant. Your ONLY job is to retrieve brand knowledge and output it.

STEP 1: Call retrieve_knowledge with these queries (one call per query):
  - "brand voice and tone guidelines"
  - "visual identity, colors, and design style"
  - "target audience and brand positioning"
  - A query relevant to: "${userPrompt}"

STEP 2: Output a concise summary of the retrieved knowledge organized as:
- **Voice & Tone**: [key points]
- **Visual Style**: [colors, fonts, imagery style]
- **Target Audience**: [who they are]
- **Topic Context**: [relevant info]

RULES:
- ONLY retrieve and summarize knowledge. Do NOT write content.
- Keep it concise — bullet points, not paragraphs.
- If a query returns no results, skip that section.`,
    tools: [retrieveKnowledge],
    outputKey: "brand_knowledge",
  });

  // Agent 2: Creative director with image generation
  // System instruction is kept SHORT so the model prioritizes image generation.
  // Brand knowledge arrives via {brand_knowledge} substitution in the user-facing part.
  const creatorAgent = new LlmAgent({
    name: "creator",
    model: "gemini-2.5-flash-image",
    description:
      "Creative director that writes content AND generates images inline.",
    instruction: `You are a creative director. You WRITE text AND GENERATE images in your response.

CRITICAL: You MUST generate at least one image. A response without generated images is a failure.

${mediaTypeInstruction}

## Format Requirements
- Aspect ratio: ${aspectLabel}
- Single full-frame images only — no grids or collages.${logoInstruction}

## Brand Context
{brand_knowledge}

## User Request
${userPrompt}

Start creating immediately. Write the content and generate images inline.`,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  return new SequentialAgent({
    name: "creative_director",
    description:
      "Retrieves brand knowledge then generates interleaved text + image content.",
    subAgents: [researcherAgent, creatorAgent],
  });
}

/**
 * Creates a briefing agent for the conversational creative director chat.
 * Uses gemini-2.5-flash-image with TEXT+IMAGE modalities but NO aspect ratio enforcement.
 */
export function createBriefingAgent({
  workspaceId,
  mediaType,
}: {
  workspaceId: string;
  mediaType: MediaType;
}) {
  const retrieveKnowledge = createRetrieveKnowledgeTool(workspaceId);

  const researcherAgent = new LlmAgent({
    name: "researcher",
    model: "gemini-2.5-flash",
    description: "Retrieves brand knowledge from the workspace knowledge base.",
    instruction: `You are a research assistant. Your ONLY job is to retrieve brand knowledge and output it.

Call retrieve_knowledge with these queries (one call per query):
  - "brand voice and tone guidelines"
  - "visual identity, colors, and design style"
  - "target audience and brand positioning"

Output a concise summary organized as:
- **Voice & Tone**: [key points]
- **Visual Style**: [colors, fonts, imagery style]
- **Target Audience**: [who they are]

ONLY retrieve and summarize knowledge. Do NOT write content.`,
    tools: [retrieveKnowledge],
    outputKey: "brand_knowledge",
  });

  const briefingAgent = new LlmAgent({
    name: "briefing_director",
    model: "gemini-2.5-flash-image",
    description: "Creative director for collaborative briefing conversations.",
    instruction: BRIEFING_DIRECTOR_INSTRUCTION.replace("{mediaType}", mediaType),
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  return new SequentialAgent({
    name: "briefing_pipeline",
    description: "Retrieves brand knowledge then starts briefing conversation.",
    subAgents: [researcherAgent, briefingAgent],
  });
}

/**
 * Creates a single-image generation agent for the final production phase.
 * Uses gemini-2.5-flash-image with enforced aspect ratio.
 */
export function createImageGenerationAgent({
  mediaType,
  briefingSummary,
  imageDescription,
}: {
  mediaType: MediaType;
  briefingSummary: string;
  imageDescription: string;
}) {
  const aspectRatio = MEDIA_TYPE_ASPECT_RATIOS[mediaType];
  const aspectLabel = MEDIA_TYPE_ASPECT_LABELS[mediaType];

  return new LlmAgent({
    name: "image_generator",
    model: "gemini-2.5-flash-image",
    description: "Generates a single production-quality image.",
    instruction: IMAGE_GENERATION_INSTRUCTION
      .replace("{briefingSummary}", briefingSummary)
      .replace("{imageDescription}", imageDescription)
      .replace("{aspectRatio}", aspectLabel),
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });
}
