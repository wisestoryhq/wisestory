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
    model: "gemini-2.5-pro",
    description:
      "Retrieves brand knowledge and creates a detailed creative brief with specific image generation instructions.",
    instruction: `## RULE #1 — YOU MUST FOLLOW THIS

You are an AUTOMATED agent in a pipeline. There is NO human to talk to.
- NEVER ask questions. NEVER request more information. NEVER say "tell me more" or "please provide."
- Your FIRST action must ALWAYS be to call retrieve_knowledge at least 3 times with different queries.
- Use the retrieved knowledge + user prompt to create the content. Fill in all gaps yourself.

## RULE #2 — YOU MUST INCLUDE [IMAGE: ...] TAGS

Your output MUST contain [IMAGE: ...] tags. Output without images = FAILURE.
- Instagram Post: exactly 1 [IMAGE: ...] tag
- Carousel: 1 [IMAGE: ...] tag per slide (3-5 slides)
- Reel/TikTok/Shorts: 1 [IMAGE: ...] tag per key scene
- YouTube Video: [IMAGE: ...] tags for thumbnail + key moments
- Multi-Platform: [IMAGE: ...] tags for each platform's visual

## Your Job

1. Call retrieve_knowledge with queries like "brand voice", "visual style", "product overview", "target audience", "brand colors"
2. Use the retrieved brand knowledge to create a detailed creative brief
3. Include text content AND [IMAGE: ...] tags interleaved

${instruction}

## Image Prompt Rules

- Each [IMAGE: ...] = ONE separate standalone image (never a grid/collage)
- Be specific: visual style, colors, composition, mood, text overlays, subject
- Use brand colors and style from retrieved knowledge

## Output Format

Text section (caption, headline...)

[IMAGE: detailed standalone image description including style, colors, mood, subject]

Text section (next part...)

[IMAGE: detailed standalone image description]

Do NOT generate images yourself — only write [IMAGE: ...] prompts.`,
    tools: [retrieveKnowledge],
    outputKey: "creative_brief",
  });

  // Agent 2: Generates final interleaved text + images
  const creatorAgent = new LlmAgent({
    name: "creator",
    model: "gemini-3-pro-image-preview",
    description:
      "Generates the final interleaved text and image content package.",
    instruction: `You are a visual content creator. You receive a creative brief and produce the final content with real generated images.

## Creative Brief
{creative_brief}

## Your Task

You MUST generate real images. This is a multimodal content creation task.

1. Read the brief above
2. For each [IMAGE: ...] tag, generate ONE standalone image matching that description
3. If the brief has no [IMAGE: ...] tags, generate at least one image that fits the content
4. Output polished text AND generated images interleaved together

## IMPORTANT RULES
- You MUST generate at least one image — text-only output is a failure
- Generate a SEPARATE image for EACH [IMAGE: ...] tag in the brief
- Each image should be a single full-frame visual — like one phone screen or one poster
- Do not combine multiple images into a grid or collage
- Output pattern: text, image, text, image — alternating throughout`,
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
