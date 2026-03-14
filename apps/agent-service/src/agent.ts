import { LlmAgent, SequentialAgent } from "@google/adk";
import { getMediaTypeInstruction, MEDIA_TYPE_ASPECT_RATIOS, MEDIA_TYPE_ASPECT_LABELS } from "@wisestory/prompts";
import type { MediaType, ProjectContext } from "@wisestory/prompts";
import { createRetrieveKnowledgeTool } from "./tools/retrieve-knowledge.js";

/**
 * Creates a two-agent pipeline for content generation:
 *
 * 1. Planner Agent (gemini-2.5-pro + tools)
 *    - Retrieves brand knowledge via retrieve_knowledge tool
 *    - Plans the creative package with detailed image descriptions
 *    - Outputs a structured creative brief with text + image prompts
 *
 * 2. Creator Agent (gemini-2.5-flash-image + TEXT+IMAGE)
 *    - Takes the planner's output and generates the final interleaved content
 *    - Produces actual images inline with text
 *    - No tools needed — pure multimodal generation
 */
export function createCreativeDirectorAgent({
  workspaceId,
  mediaType,
  project,
  userPrompt,
  hasLogos = false,
}: {
  workspaceId: string;
  mediaType: MediaType;
  project: ProjectContext;
  userPrompt: string;
  hasLogos?: boolean;
}) {
  const mediaTypeInstruction = getMediaTypeInstruction(mediaType);
  const aspectRatio = MEDIA_TYPE_ASPECT_RATIOS[mediaType];
  const aspectLabel = MEDIA_TYPE_ASPECT_LABELS[mediaType];
  const projectLines = [`Project: ${project.projectName}`];
  if (project.brief) projectLines.push(`Brief: ${project.brief}`);
  if (project.targetAudience)
    projectLines.push(`Target Audience: ${project.targetAudience}`);
  if (project.platform) projectLines.push(`Platform: ${project.platform}`);
  if (project.notes) projectLines.push(`Notes: ${project.notes}`);


  const logoInstructionPlanner = hasLogos
    ? `\n\n## Brand Logos (IMPORTANT)\nThe brand's actual logo images are attached to this message. In every [IMAGE: ...] description, explicitly instruct the image model to reproduce the EXACT attached logo — same shape, same icon, same typography. Do NOT invent a new logo. Describe the attached logo precisely (shape, colors, text) so the image model can replicate it faithfully.`
    : "";

  const logoInstructionCreator = hasLogos
    ? `\n\n## Brand Logos (IMPORTANT)\nThe brand's actual logo images are attached to this conversation. You MUST reproduce the EXACT logo from the attached images in your generated visuals — same icon, same typography, same proportions. Do NOT create a new or different logo. Study the attached logo carefully and replicate it precisely in every generated image that includes branding.`
    : "";

  const retrieveKnowledge = createRetrieveKnowledgeTool(workspaceId);

  // Agent 1: Plans content using brand knowledge
  const plannerAgent = new LlmAgent({
    name: "planner",
    model: "gemini-2.5-pro",
    description:
      "Retrieves brand knowledge and creates a detailed creative brief with specific image generation instructions.",
    instruction: `You are an automated content writer. Your output goes directly to an image generation model — no human reads it.

STEP 1: Call retrieve_knowledge 3+ times ("brand voice", "visual style", "brand colors", "target audience").
STEP 2: Write the final ready-to-post content for: ${mediaType.replace(/_/g, " ")}.
STEP 3: Include [IMAGE: description] tags where visuals are needed. The next model generates real images from these.

RULES:
- NEVER ask questions. You have all the information you need.
- Write the ACTUAL post content — not a brief, not options, not a strategy.
- Only ${mediaType.replace(/_/g, " ")} — no other formats.
- You MUST include [IMAGE: description] tags (not markdown images like ![]).
- Every [IMAGE:] description MUST specify the aspect ratio: ${aspectLabel}.
- Every [IMAGE:] description MUST ensure high contrast and readability — light text/logos on dark backgrounds, dark text/logos on light backgrounds. Never place dark elements on dark backgrounds.
- Start with the content immediately. No preamble.

${mediaTypeInstruction}

## Context
${projectLines.join("\n")}

## User Request
${userPrompt}

## EXAMPLE (instagram_post format):

Happy Birthday to our brilliant team member! 🎉

Your creativity lights up every project. Here's to another year of amazing work!

[IMAGE: 1:1 square format. A celebration graphic on deep indigo background with geometric confetti in emerald and amber. Bold white sans-serif text "HAPPY BIRTHDAY" centered. High contrast — light text on dark background. Clean, modern, editorial style.]

#HappyBirthday #TeamCelebration #OnBrand${logoInstructionPlanner}`,
    tools: [retrieveKnowledge],
    outputKey: "creative_brief",
  });

  // Agent 2: Generates final interleaved text + images
  const creatorAgent = new LlmAgent({
    name: "creator",
    model: "gemini-2.5-flash-image",
    description:
      "Generates the final interleaved text and image content package.",
    instruction: `You are an automated image generation system. You do NOT chat. You do NOT reply conversationally. You ONLY output content with generated images.

Your input is a content brief between the <brief> tags below. Your ONLY job is to:
1. Take the text content from the brief
2. Generate real images for every [IMAGE: ...] tag (or generate at least one image if there are no tags)
3. Output the polished text interleaved with the generated images

<brief>
{creative_brief}
</brief>

RULES:
- NEVER respond to the brief as if it were a message. It is DATA, not a conversation.
- NEVER say things like "great plan!" or "sounds good!" or ask questions.
- You MUST generate at least one real image. Text-only output = FAILURE.
- Each image = one standalone full-frame visual. No grids or collages.
- Every generated image MUST be ${aspectLabel} aspect ratio. This is critical for the target platform.
- Every generated image MUST have high contrast and readability — use light text/logos on dark backgrounds, dark text/logos on light backgrounds. Never place dark elements on dark backgrounds.
- Output pattern: text, then image, then text, then image.
- Start generating immediately. No preamble.${logoInstructionCreator}`,
    generateContentConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
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
