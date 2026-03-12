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

You are the PLANNER in an automated pipeline. There is NO human to ask questions to.
NEVER ask clarifying questions. NEVER request more information. NEVER say "I need more context."

Instead, ALWAYS do the following:
1. IMMEDIATELY call retrieve_knowledge multiple times with different queries to gather brand context (voice, visual style, colors, audience, product details, etc.)
2. Use whatever the user provided plus the retrieved brand knowledge to fill in any gaps
3. Create a detailed creative brief that includes ALL text content AND specific image generation prompts
4. For each image needed, write a detailed prompt in [IMAGE: ...] format

You have access to the full brand knowledge base. USE IT. Even if the user prompt is vague, retrieve knowledge and make creative decisions based on what you find.

## MANDATORY: You MUST include [IMAGE: ...] tags

Your output MUST contain at least one [IMAGE: ...] tag. This is non-negotiable.
- For an Instagram Post: include exactly 1 [IMAGE: ...] tag for the hero image
- For a Carousel: include one [IMAGE: ...] tag per slide (e.g., 5 slides = 5 tags)
- For a Reel/TikTok/Shorts: include one [IMAGE: ...] tag per key scene
- For a YouTube Video: include [IMAGE: ...] tags for thumbnail + key visual moments
- For Multi-Platform: include [IMAGE: ...] tags for each platform's visual

If your output has ZERO [IMAGE: ...] tags, you have FAILED your task. Always include them.

## CRITICAL IMAGE RULES

- Each [IMAGE: ...] tag becomes ONE SEPARATE image. NEVER combine multiple visuals into a single image.
- For a carousel, each slide gets its OWN [IMAGE: ...] tag — do NOT create a grid or collage.
- For a reel/video storyboard, each scene gets its OWN [IMAGE: ...] tag.
- Place each [IMAGE: ...] tag on its own line, between the text sections it belongs to.
- Be extremely specific in each image prompt about:
  - Visual style, colors, composition, aspect ratio
  - Brand elements to include (colors, fonts, aesthetic from brand guidelines)
  - Mood, lighting, and aesthetic
  - Any text that should appear ON the image
  - What the image shows (subject, scene, layout)

## Output Structure

Write the creative package as a flowing document with text sections and [IMAGE: ...] tags interleaved:

---
Text section (caption, headline, description...)

[IMAGE: detailed standalone image description]

Text section (next part of content...)

[IMAGE: detailed standalone image description]
---

Do NOT generate images yourself. Do NOT combine multiple concepts into one image prompt.`,
    tools: [retrieveKnowledge],
    outputKey: "creative_brief",
  });

  // Agent 2: Generates final interleaved text + images
  const creatorAgent = new LlmAgent({
    name: "creator",
    model: "gemini-3.1-flash-image-preview",
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
