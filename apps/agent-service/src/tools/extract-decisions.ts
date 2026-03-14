import { GoogleGenerativeAI } from "@google/generative-ai";
import { DECISION_EXTRACTION_INSTRUCTION } from "@wisestory/prompts";
import { prisma } from "../db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type ExtractedNode = {
  nodeType: string;
  title: string;
  content: string;
  imageIndex?: number | null;
};

type ExtractedEdge = {
  sourceTitle: string;
  targetTitle: string;
  relationshipType: string;
};

type ExtractionResult = {
  nodes: ExtractedNode[];
  edges: ExtractedEdge[];
};

/**
 * Extracts briefing decisions from an assistant response and upserts them
 * into the BriefingNode/BriefingEdge tables. Fire-and-forget — failures
 * are logged but never propagate to the caller.
 */
export async function extractBriefingDecisions(
  campaignId: string,
  assistantText: string,
  assistantImages: Array<{ data: string; mimeType: string }>,
  conversationContext: string
): Promise<void> {
  try {
    if (!assistantText.trim()) return;

    console.log(`[extract-decisions] Starting extraction for campaign ${campaignId} (${assistantText.length} chars, ${assistantImages.length} images)`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${DECISION_EXTRACTION_INSTRUCTION}

## Conversation Context
${conversationContext}

## Assistant Response to Analyze
${assistantText}

${assistantImages.length > 0 ? `(The assistant also generated ${assistantImages.length} image(s) in this response)` : ""}

Extract decisions and concepts from the assistant response above. Output JSON only.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log(`[extract-decisions] Gemini response (${responseText.length} chars): ${responseText.substring(0, 200)}...`);

    // Parse JSON from response (may be wrapped in ```json blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[extract-decisions] No JSON found in response");
      return;
    }

    let extraction: ExtractionResult;
    try {
      extraction = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[extract-decisions] JSON parse failed:", parseErr, "Raw:", jsonMatch[0].substring(0, 300));
      return;
    }

    if (!extraction.nodes || extraction.nodes.length === 0) {
      console.log("[extract-decisions] No nodes extracted");
      return;
    }

    // Upsert nodes — use campaignId + title as logical key
    const nodeMap = new Map<string, string>(); // title -> id

    for (const node of extraction.nodes) {
      const validTypes = ["decision", "concept", "visual_direction", "copy_direction", "liked_image", "brand_element", "rejected_option"];
      if (!validTypes.includes(node.nodeType)) continue;

      // Check for existing node with same title in this campaign
      const existing = await prisma.briefingNode.findFirst({
        where: { campaignId, title: node.title },
      });

      let nodeId: string;

      if (existing) {
        // Update content if node already exists
        await prisma.briefingNode.update({
          where: { id: existing.id },
          data: {
            content: node.content,
            nodeType: node.nodeType,
          },
        });
        nodeId = existing.id;
      } else {
        // Attach image data for liked_image nodes
        let imageData: string | undefined;
        let imageMimeType: string | undefined;
        if (node.nodeType === "liked_image" && node.imageIndex != null && assistantImages[node.imageIndex]) {
          imageData = assistantImages[node.imageIndex].data;
          imageMimeType = assistantImages[node.imageIndex].mimeType;
        }

        const created = await prisma.briefingNode.create({
          data: {
            campaignId,
            nodeType: node.nodeType,
            title: node.title,
            content: node.content,
            imageData,
            imageMimeType,
          },
        });
        nodeId = created.id;
      }

      nodeMap.set(node.title, nodeId);
    }

    // Create edges
    for (const edge of extraction.edges ?? []) {
      const sourceId = nodeMap.get(edge.sourceTitle);
      const targetId = nodeMap.get(edge.targetTitle);

      if (!sourceId || !targetId || sourceId === targetId) continue;

      const validRelTypes = ["leads_to", "refines", "replaces", "supports", "rejected_for"];
      if (!validRelTypes.includes(edge.relationshipType)) continue;

      // Also check if source/target titles exist from previous extractions
      await prisma.briefingEdge.upsert({
        where: {
          sourceId_targetId: { sourceId, targetId },
        },
        update: {
          relationshipType: edge.relationshipType,
        },
        create: {
          sourceId,
          targetId,
          relationshipType: edge.relationshipType,
        },
      });
    }

    console.log(`[extract-decisions] Extracted ${extraction.nodes.length} nodes, ${extraction.edges?.length ?? 0} edges for campaign ${campaignId}`);
  } catch (err) {
    console.error("[extract-decisions] Failed:", err);
    // Never propagate — this is fire-and-forget
  }
}
