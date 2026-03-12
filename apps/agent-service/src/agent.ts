import { LlmAgent, SequentialAgent } from "@google/adk";
import { buildAgentInstruction } from "@wisestory/prompts";
import type { MediaType, ProjectContext } from "@wisestory/prompts";
import { createRetrieveKnowledgeTool } from "./tools/retrieve-knowledge.js";

/**
 * Creates a two-agent pipeline for content generation:
 *
 * 1. Planner Agent (gemini-2.5-flash + tools)
 *    - Retrieves brand knowledge via retrieve_knowledge tool
 *    - Plans the creative package with detailed image descriptions
 *    - Outputs a structured creative brief with text + image prompts
 *
 * 2. Creator Agent (gemini-3.1-flash-image-preview + TEXT+IMAGE)
 *    - Takes the planner's output and generates the final interleaved content
 *    - Produces actual images inline with text
 *    - No tools needed — pure multimodal generation
 */
export function createCreativeDirectorAgent({
  workspaceId,
  mediaType,
  project,
  userPrompt,
}: {
  workspaceId: string;
  mediaType: MediaType;
  project: ProjectContext;
  userPrompt: string;
}) {
  const instruction = buildAgentInstruction({
    mediaType,
    project,
    userPrompt,
  });

  const retrieveKnowledge = createRetrieveKnowledgeTool(workspaceId);

  // Agent 1: Plans content using brand knowledge
  const plannerAgent = new LlmAgent({
    name: "planner",
    model: "gemini-2.5-flash",
    description:
      "Retrieves brand knowledge and creates a detailed creative brief with specific image generation instructions.",
    instruction: `${instruction}

## IMPORTANT: Your Role

You are the PLANNER. Your job is to:
1. Call retrieve_knowledge multiple times to gather brand context (voice, visual style, colors, audience, etc.)
2. Create a detailed creative brief that includes ALL text content AND specific image generation prompts
3. For each image needed, write a detailed prompt in [IMAGE: ...] format that describes exactly what to generate

Your output will be passed to an image generation model, so be extremely specific about:
- Visual style, colors, composition
- Brand elements to include
- Mood and aesthetic
- What text/elements should appear in the image

Format image prompts as: [IMAGE: detailed description of the image to generate]

Do NOT generate images yourself. Write the complete creative package with image prompts inline where images should appear.`,
    tools: [retrieveKnowledge],
    outputKey: "creative_brief",
  });

  // Agent 2: Generates final interleaved text + images
  const creatorAgent = new LlmAgent({
    name: "creator",
    model: "gemini-3.1-flash-image-preview",
    description:
      "Generates the final interleaved text and image content package.",
    instruction: `You are a visual content creator. You will receive a creative brief.

Your job is to take the creative brief below and generate the FINAL content with real images.

## Creative Brief
{creative_brief}

## Instructions
1. For every [IMAGE: ...] in the brief above, you MUST generate an actual image at that position
2. Keep and polish the text content from the brief
3. Output interleaved text and images as one cohesive creative package
4. Generate high-quality images that match the descriptions closely
5. Do NOT skip any images — every [IMAGE: ...] must become a real generated image`,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Sequential pipeline: planner → creator
  return new SequentialAgent({
    name: "creative_director",
    description:
      "A creative director pipeline that retrieves brand knowledge, plans content, and generates interleaved text + image packages.",
    subAgents: [plannerAgent, creatorAgent],
  });
}
