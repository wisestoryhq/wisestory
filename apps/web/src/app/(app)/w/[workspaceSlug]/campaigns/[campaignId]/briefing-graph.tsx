"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, X } from "lucide-react";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const PALETTE = [
  "#f6b900", // brand amber
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#06b6d4", // cyan
];

const NODE_TYPE_LABELS: Record<string, string> = {
  decision: "Decision",
  concept: "Concept",
  visual_direction: "Visual Direction",
  copy_direction: "Copy Direction",
  liked_image: "Liked Image",
  brand_element: "Brand Element",
  rejected_option: "Rejected",
};

function typeColor(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  content: string;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ApiNode {
  id: string;
  nodeType: string;
  title: string;
  content: string;
}

interface ApiEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
}

type Props = {
  campaignId: string;
  onClose: () => void;
};

export function BriefingGraph({ campaignId, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [apiData, setApiData] = useState<{ nodes: ApiNode[]; edges: ApiEdge[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch graph data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/graph`);
        if (!res.ok) throw new Error("Failed to load graph");
        const data = await res.json();
        setApiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load graph");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [campaignId]);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Transform API data to graph format
  const graphData: GraphData = useMemo(() => {
    if (!apiData) return { nodes: [], links: [] };

    const nodes: GraphNode[] = apiData.nodes.map((n) => ({
      id: n.id,
      name: n.title,
      type: n.nodeType,
      content: n.content,
      color: typeColor(n.nodeType),
    }));

    const nodeIds = new Set(nodes.map((n) => n.id));

    const links: GraphLink[] = apiData.edges
      .filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
      .map((e) => ({
        source: e.sourceId,
        target: e.targetId,
        type: e.relationshipType,
      }));

    return { nodes, links };
  }, [apiData]);

  const nodeCanvasObject = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode & { x: number; y: number };
      const r = 6;
      const fontSize = Math.max(11 / globalScale, 1.5);

      // Glow effect
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 8;

      // Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Label (show when zoomed in enough)
      if (globalScale > 0.8) {
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(n.name, n.x, n.y + r + 2);
      }
    },
    [],
  );

  const nodePointerAreaPaint = useCallback(
    (node: object, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode & { x: number; y: number };
      ctx.beginPath();
      ctx.arc(n.x, n.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const nodeLabel = useCallback((node: object) => {
    const n = node as GraphNode;
    const typeLabel = NODE_TYPE_LABELS[n.type] ?? n.type;
    return `<div style="background:rgba(0,0,0,0.9);color:white;padding:6px 10px;border-radius:6px;font-size:12px;max-width:250px">
      <div style="font-weight:600;margin-bottom:2px">${n.name}</div>
      <div style="opacity:0.6;font-size:10px;margin-bottom:4px">${typeLabel}</div>
      <div style="opacity:0.8;font-size:11px;line-height:1.4">${n.content}</div>
    </div>`;
  }, []);

  const linkLabel = useCallback((link: object) => {
    const l = link as GraphLink;
    return `<div style="background:rgba(0,0,0,0.9);color:white;padding:2px 8px;border-radius:4px;font-size:11px">
      ${l.type.replace(/_/g, " ")}
    </div>`;
  }, []);

  const entityTypes = useMemo(
    () => [...new Set(graphData.nodes.map((n) => n.type))],
    [graphData],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Title */}
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-sm font-medium text-white/90">Knowledge Graph</h2>
        <p className="text-xs text-white/50">
          Decisions and concepts from the briefing
        </p>
      </div>

      {/* Graph container */}
      <div ref={containerRef} className="h-full w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && graphData.nodes.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-white/50">
              No graph data yet. Keep chatting to build the knowledge graph.
            </p>
          </div>
        )}

        {!isLoading && !error && dimensions && graphData.nodes.length > 0 && (
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="transparent"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            nodeLabel={nodeLabel}
            linkLabel={linkLabel}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkColor={() => "rgba(255,255,255,0.12)"}
            linkWidth={1}
            warmupTicks={100}
            cooldownTicks={200}
          />
        )}
      </div>

      {/* Legend */}
      {graphData.nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/60 p-3 text-xs text-white/80 backdrop-blur-sm">
          <div className="mb-1.5 font-medium">Node Types</div>
          {entityTypes.map((type) => (
            <div key={type} className="flex items-center gap-2 py-0.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: typeColor(type) }}
              />
              <span>{NODE_TYPE_LABELS[type] ?? type}</span>
            </div>
          ))}
          <div className="mt-1.5 text-white/50">
            {graphData.nodes.length} nodes, {graphData.links.length} edges
          </div>
        </div>
      )}
    </div>
  );
}
