/**
 * Graph traversal for briefing generation.
 *
 * Instead of dumping all nodes flat, this module:
 * 1. Identifies "final" nodes (not replaced by anything)
 * 2. Scores nodes by connectivity (more connections = more important)
 * 3. Follows decision chains backward to show reasoning
 * 4. Excludes replaced/outdated concepts
 * 5. Builds a narrative-ordered summary
 */

type GraphNode = {
  id: string;
  nodeType: string;
  title: string;
  content: string;
  imageData: string | null;
  imageMimeType: string | null;
  metadata: unknown;
  createdAt: Date;
  outgoingEdges: Array<{
    relationshipType: string;
    weight: number;
    target: { id: string; title: string };
  }>;
  incomingEdges: Array<{
    relationshipType: string;
    weight: number;
    source: { id: string; title: string };
  }>;
};

type ScoredNode = GraphNode & {
  score: number;
  isReplaced: boolean;
  supportedBy: string[];
  refinedFrom: string[];
  leadsTo: string[];
};

/**
 * Score and rank nodes by importance in the creative process.
 */
function scoreNodes(nodes: GraphNode[]): ScoredNode[] {
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Track which nodes have been replaced
  const replacedIds = new Set<string>();
  for (const node of nodes) {
    for (const edge of node.outgoingEdges) {
      if (edge.relationshipType === "replaces") {
        replacedIds.add(edge.target.id);
      }
    }
  }

  return nodes.map((node) => {
    let score = 0;

    // Base score by type (decisions and final concepts matter most)
    const typeScores: Record<string, number> = {
      decision: 10,
      concept: 7,
      visual_direction: 8,
      copy_direction: 8,
      liked_image: 6,
      brand_element: 5,
      rejected_option: 0,
    };
    score += typeScores[node.nodeType] ?? 3;

    // Connectivity bonus: more edges = more central
    score += node.outgoingEdges.length * 2;
    score += node.incomingEdges.length * 2;

    // "supports" edges boost importance
    const supportedBy = node.incomingEdges
      .filter((e) => e.relationshipType === "supports")
      .map((e) => e.source.title);
    score += supportedBy.length * 3;

    // Nodes that "lead to" decisions are part of the reasoning chain
    const leadsTo = node.outgoingEdges
      .filter((e) => e.relationshipType === "leads_to")
      .map((e) => e.target.title);
    score += leadsTo.length * 2;

    // Track refinement chain
    const refinedFrom = node.incomingEdges
      .filter((e) => e.relationshipType === "refines")
      .map((e) => e.source.title);

    // Recency bonus (newer nodes are more relevant)
    const ageMs = Date.now() - node.createdAt.getTime();
    const ageMinutes = ageMs / 60_000;
    if (ageMinutes < 30) score += 3;
    else if (ageMinutes < 60) score += 1;

    // Penalize replaced nodes heavily
    const isReplaced = replacedIds.has(node.id);
    if (isReplaced) score -= 20;

    return {
      ...node,
      score,
      isReplaced,
      supportedBy,
      refinedFrom,
      leadsTo,
    };
  });
}

/**
 * Follow the decision chain backward from a node to find its reasoning path.
 */
function traceDecisionChain(
  node: ScoredNode,
  allNodes: Map<string, ScoredNode>,
  visited: Set<string> = new Set(),
  depth: number = 0,
): string[] {
  if (depth > 5 || visited.has(node.id)) return [];
  visited.add(node.id);

  const chain: string[] = [];

  // Follow "refines" and "leads_to" incoming edges backward
  for (const edge of node.incomingEdges) {
    if (edge.relationshipType === "refines" || edge.relationshipType === "leads_to") {
      const source = allNodes.get(edge.source.id);
      if (source && !source.isReplaced) {
        chain.push(...traceDecisionChain(source, allNodes, visited, depth + 1));
        chain.push(`${source.title} → [${edge.relationshipType}] → ${node.title}`);
      }
    }
  }

  return chain;
}

/**
 * Build a narrative-structured summary from the knowledge graph.
 * Returns a summary that shows reasoning chains, not just flat lists.
 */
export function buildGraphNarrative(
  nodes: GraphNode[],
  rejectedImageData: Set<string>,
): string {
  if (nodes.length === 0) return "";

  const scored = scoreNodes(nodes);
  const nodeMap = new Map<string, ScoredNode>();
  for (const n of scored) nodeMap.set(n.id, n);

  // Filter out replaced and rejected nodes
  const active = scored.filter((n) => {
    if (n.isReplaced) return false;
    if (n.nodeType === "rejected_option") return false;
    if (n.nodeType === "liked_image" && n.imageData && rejectedImageData.has(n.imageData)) {
      return false;
    }
    return true;
  });

  // Sort by score (highest first)
  active.sort((a, b) => b.score - a.score);

  let summary = "";

  // Section 1: Key Decisions (the most important outcomes)
  const decisions = active.filter((n) => n.nodeType === "decision");
  if (decisions.length > 0) {
    summary += "\n### Key Decisions\n";
    for (const d of decisions) {
      summary += `- **${d.title}**: ${d.content}\n`;
      // Show reasoning chain
      const chain = traceDecisionChain(d, nodeMap);
      if (chain.length > 0) {
        summary += `  Reasoning: ${chain.join(" → ")}\n`;
      }
      if (d.supportedBy.length > 0) {
        summary += `  Supported by: ${d.supportedBy.join(", ")}\n`;
      }
    }
  }

  // Section 2: Creative Direction (visual + copy, ranked by score)
  const direction = active.filter(
    (n) => n.nodeType === "visual_direction" || n.nodeType === "copy_direction",
  );
  if (direction.length > 0) {
    summary += "\n### Creative Direction\n";
    for (const d of direction) {
      const type = d.nodeType === "visual_direction" ? "Visual" : "Copy";
      summary += `- **[${type}] ${d.title}**: ${d.content}\n`;
      if (d.refinedFrom.length > 0) {
        summary += `  Refined from: ${d.refinedFrom.join(", ")}\n`;
      }
      if (d.leadsTo.length > 0) {
        summary += `  Leads to: ${d.leadsTo.join(", ")}\n`;
      }
    }
  }

  // Section 3: Creative Concepts
  const concepts = active.filter((n) => n.nodeType === "concept");
  if (concepts.length > 0) {
    summary += "\n### Creative Concepts\n";
    for (const c of concepts) {
      summary += `- **${c.title}**: ${c.content}\n`;
      if (c.leadsTo.length > 0) {
        summary += `  Leads to: ${c.leadsTo.join(", ")}\n`;
      }
    }
  }

  // Section 4: Approved Visuals
  const approved = active.filter((n) => n.nodeType === "liked_image");
  if (approved.length > 0) {
    summary += "\n### Approved Visual References\n";
    for (const a of approved) {
      summary += `- **${a.title}**: ${a.content}\n`;
    }
  }

  // Section 5: Brand Elements
  const brand = active.filter((n) => n.nodeType === "brand_element");
  if (brand.length > 0) {
    summary += "\n### Brand Elements\n";
    for (const b of brand) {
      summary += `- **${b.title}**: ${b.content}\n`;
    }
  }

  // Section 6: Evolution (what was refined/replaced — shows creative process)
  const replaced = scored.filter((n) => n.isReplaced && n.nodeType !== "rejected_option");
  if (replaced.length > 0) {
    summary += "\n### Creative Evolution (superseded ideas)\n";
    for (const r of replaced) {
      const replacedBy = scored.find((n) =>
        n.outgoingEdges.some(
          (e) => e.relationshipType === "replaces" && e.target.id === r.id,
        ),
      );
      summary += `- ~~${r.title}~~ → replaced by ${replacedBy?.title ?? "newer direction"}\n`;
    }
  }

  return summary;
}
