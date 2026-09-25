import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import PageContainer from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Mono, Body, Meta } from "../../components/ui/Typography";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useSearchParams } from "react-router-dom";
import { useKnowledgeGraph } from "../../hooks/useGraph";
import { LoadingState } from "../../components/ui/Loading";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useI18n } from "../../i18n/index";

// ------------- Force Simulation (lightweight) ----------------
interface SimNode { id: string; label: string; type: string; x: number; y: number; vx: number; vy: number; }
interface SimEdge { source: string; target: string; relationship: string; }

function runForceSimulation(nodes: SimNode[], edges: SimEdge[], width: number, height: number, iterations = 150): SimNode[] {
  const ns = nodes.map(n => ({ ...n }));
  const REPEL = 8000;
  const ATTRACT = 0.04;
  const DAMPING = 0.85;
  const IDEAL = 160;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < ns.length; i++) {
      ns[i].vx = 0;
      ns[i].vy = 0;
    }
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x;
        const dy = ns[j].y - ns[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPEL / (dist * dist);
        ns[i].vx -= (dx / dist) * force;
        ns[i].vy -= (dy / dist) * force;
        ns[j].vx += (dx / dist) * force;
        ns[j].vy += (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const edge of edges) {
      const src = ns.find(n => n.id === edge.source);
      const tgt = ns.find(n => n.id === edge.target);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = ATTRACT * (dist - IDEAL);
      src.vx += (dx / dist) * force;
      src.vy += (dy / dist) * force;
      tgt.vx -= (dx / dist) * force;
      tgt.vy -= (dy / dist) * force;
    }
    // Gravity to center
    for (const n of ns) {
      n.vx += (width / 2 - n.x) * 0.004;
      n.vy += (height / 2 - n.y) * 0.004;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      // Boundary
      n.x = Math.max(80, Math.min(width - 80, n.x));
      n.y = Math.max(40, Math.min(height - 40, n.y));
    }
  }
  return ns;
}

// ------------- Node type colors (theme tokens) ----------------
const NODE_TYPE_MAP: Record<string, { color: string; label: string }> = {
  STANDARD:       { color: "text-accent", label: "Standard" },
  PRODUCT:        { color: "text-success", label: "Product / Family" },
  FAMILY:         { color: "text-success", label: "Family" },
  CERTIFICATION:  { color: "text-warning", label: "Certification" },
  REGULATORY:     { color: "text-warning", label: "Regulatory" },
  TEST_METHOD:    { color: "text-info", label: "Test Method" },
  INSTALLATION:   { color: "text-error", label: "Installation" },
  SAFETY:         { color: "text-error", label: "Safety" },
};
function getNodeStyle(type: string): { color: string; label: string } {
  const key = (type || "").toUpperCase();
  return NODE_TYPE_MAP[key] || { color: "text-text-secondary", label: type || "Other" };
}

// ------------- Edge filter types ----------------
const EDGE_FILTER_VALUES = ["ALL", "TEST_METHOD", "SAFETY", "NORMATIVE", "INSTALLATION"] as const;
type EdgeFilter = typeof EDGE_FILTER_VALUES[number];

function edgeMatchesFilter(relationship: string, filter: EdgeFilter): boolean {
  if (filter === "ALL") return true;
  const r = relationship.toUpperCase().replace(/-/g, "_");
  return r.includes(filter);
}

// ------------- Main Component ----------------
const CANVAS_W = 900;
const CANVAS_H = 560;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;

export default function KnowledgeGraphPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get("standard_id") || "IS 13947";
  const { data: graphData, isLoading, error } = useKnowledgeGraph(familyId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>("ALL");
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Force layout nodes
  const positionedNodes = useMemo(() => {
    if (!graphData || !graphData.nodes.length) return [];
    const initNodes: SimNode[] = graphData.nodes.map((n, i) => ({
      ...n,
      x: CANVAS_W / 2 + (Math.random() - 0.5) * 300,
      y: CANVAS_H / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));
    const edges: SimEdge[] = graphData.edges.map(e => ({ source: e.source, target: e.target, relationship: e.relationship }));
    return runForceSimulation(initNodes, edges, CANVAS_W, CANVAS_H, 200);
  }, [graphData]);

  // Dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localNodes, setLocalNodes] = useState<SimNode[]>([]);
  useEffect(() => { setLocalNodes(positionedNodes); }, [positionedNodes]);

  const edges = graphData?.edges || [];

  // Filter edges
  const visibleEdges = useMemo(() =>
    edges.filter(e => edgeMatchesFilter(e.relationship, edgeFilter)),
    [edges, edgeFilter]
  );

  // Edge types present in data
  const presentEdgeTypes = useMemo(() => {
    const types = new Set(edges.map(e => e.relationship.toUpperCase().replace(/-/g, "_")));
    return EDGE_FILTER_VALUES.filter(f => f === "ALL" || [...types].some(t => t.includes(f)));
  }, [edges]);

  const selectedNode = localNodes.find(n => n.id === selectedNodeId);
  const connectedIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const s = new Set<string>([selectedNodeId]);
    edges.forEach(e => {
      if (e.source === selectedNodeId) s.add(e.target);
      if (e.target === selectedNodeId) s.add(e.source);
    });
    return s;
  }, [selectedNodeId, edges]);

  // Pan handlers on SVG background
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      isPanningRef.current = true;
      panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    }
  };
  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      setPan({ x: panStartRef.current.px + e.clientX - panStartRef.current.mx, y: panStartRef.current.py + e.clientY - panStartRef.current.my });
    }
    if (draggingId) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = (e.clientX - rect.left - pan.x) / zoom;
      const ny = (e.clientY - rect.top - pan.y) / zoom;
      setLocalNodes(ns => ns.map(n => n.id === draggingId ? { ...n, x: nx, y: ny } : n));
    }
  };
  const handleSvgMouseUp = () => {
    isPanningRef.current = false;
    setDraggingId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.001)));
  };

  const handleFitView = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); };
  const handleReset = () => { setLocalNodes(positionedNodes); setZoom(1.0); setPan({ x: 0, y: 0 }); setSelectedNodeId(null); };

  if (isLoading) return <LoadingState message={t("state.loading")} />;
  if (error) return <PageContainer><ErrorState title={t("state.error")} description="Failed to load knowledge graph from backend." /></PageContainer>;
  if (!graphData || localNodes.length === 0) return <PageContainer><EmptyState title={t("state.noData")} description="No graph data returned for this standard." /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="KNOWLEDGE GRAPH"
        title="STANDARD RELATIONSHIP MAP"
        description={`Explore relationships for ${familyId}. Force-directed layout — drag nodes, scroll to zoom, drag canvas to pan.`}
      />

      <div className="flex flex-col gap-6 pb-24">
        {/* Controls row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Meta className="mr-2">EDGE FILTER:</Meta>
          {EDGE_FILTER_VALUES.map(f => (
            <button
              key={f}
              onClick={() => setEdgeFilter(f)}
              disabled={f !== "ALL" && !presentEdgeTypes.includes(f)}
              className={`mono text-xs px-3 py-1.5 border rounded-sm transition-colors focus-visible:outline-none disabled:opacity-30 disabled:cursor-not-allowed
                ${edgeFilter === f
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-text-muted hover:border-text-muted hover:text-text-secondary"
                }`}
            >
              {f === "TEST_METHOD" ? "TEST METHOD" : f}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))} className="mono text-xs px-2 py-1.5 border border-border text-text-muted hover:border-text-muted rounded-sm transition-colors" aria-label={t("graph.zoom.in")}>+</button>
            <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))} className="mono text-xs px-2 py-1.5 border border-border text-text-muted hover:border-text-muted rounded-sm transition-colors" aria-label={t("graph.zoom.out")}>−</button>
            <button onClick={handleFitView} className="mono text-xs px-3 py-1.5 border border-border text-text-muted hover:border-text-muted rounded-sm transition-colors">{t("btn.fitView")}</button>
            <button onClick={handleReset} className="mono text-xs px-3 py-1.5 border border-border text-text-muted hover:border-text-muted rounded-sm transition-colors">{t("btn.reset")}</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Canvas */}
          <div className="relative flex-1 border border-border bg-surface rounded-sm overflow-hidden" style={{ height: 560 }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
              onWheel={handleWheel}
              style={{ cursor: isPanningRef.current ? "grabbing" : "grab", userSelect: "none" }}
            >
              <rect width="100%" height="100%" fill="transparent" />
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" className="fill-border" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {visibleEdges.map((edge, i) => {
                  const src = localNodes.find(n => n.id === edge.source);
                  const tgt = localNodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;
                  const isHighlighted = selectedNodeId ? (edge.source === selectedNodeId || edge.target === selectedNodeId) : true;
                  const isDimmed = selectedNodeId && !isHighlighted;
                  const mx = (src.x + tgt.x) / 2;
                  const my = (src.y + tgt.y) / 2;
                  return (
                    <g key={`e${i}`} opacity={isDimmed ? 0.08 : 1} className="transition-opacity duration-200">
                      <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        strokeWidth={isHighlighted && selectedNodeId ? 1.5 : 1}
                        markerEnd="url(#arrow)"
                        className={isHighlighted && selectedNodeId ? "stroke-accent" : "stroke-border"}
                      />
                      {!selectedNodeId || isHighlighted ? (
                        <text x={mx} y={my} dy={-4} textAnchor="middle" fontSize={9} className={`fill-current ${isHighlighted && selectedNodeId ? "text-accent" : "text-text-muted"} font-mono`}>
                          {edge.relationship.replace(/_/g, " ")}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                {/* Nodes */}
                {localNodes.map(node => {
                  const isSelected = selectedNodeId === node.id;
                  const isConn = connectedIds.has(node.id);
                  const isDimmed = selectedNodeId && !isConn;
                  const style = getNodeStyle(node.type);
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      opacity={isDimmed ? 0.15 : 1}
                      className="transition-opacity duration-200"
                      onMouseDown={e => { e.stopPropagation(); setDraggingId(node.id); }}
                      onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={-70} y={-24} width={140} height={48}
                        rx={2}
                        className={`transition-all ${isSelected ? "fill-accent/10 stroke-accent" : "fill-surface stroke-border hover:stroke-text-muted"}`}
                        strokeWidth={isSelected ? 1.5 : 1}
                      />
                      <text x={0} y={-8} textAnchor="middle" fontSize={9} className={`font-mono fill-current ${style.color} uppercase`}>{node.type}</text>
                      <text x={0} y={8} textAnchor="middle" fontSize={11} className={`font-mono fill-current font-bold ${isSelected ? "text-accent" : "text-text-primary"}`}>{node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label}</text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-background/90 border border-border p-3 rounded-sm flex flex-col gap-1.5 pointer-events-none" style={{ backdropFilter: "blur(4px)" }}>
              <Meta className="text-[10px] mb-1">{t("graph.legend.nodes")}</Meta>
              {Object.entries(NODE_TYPE_MAP).slice(0, 5).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-sm border ${val.color === "text-accent" ? "border-accent bg-accent/20" : val.color === "text-success" ? "border-success bg-success/20" : val.color === "text-warning" ? "border-warning bg-warning/20" : val.color === "text-error" ? "border-error bg-error/20" : "border-border"}`} />
                  <Mono className="text-[9px] text-text-muted">{val.label.toUpperCase()}</Mono>
                </div>
              ))}
            </div>

            {/* Zoom indicator */}
            <div className="absolute top-3 right-3 bg-background/80 border border-border px-2 py-1 rounded-sm pointer-events-none" style={{ backdropFilter: "blur(4px)" }}>
              <Mono className="text-[10px] text-text-muted">{Math.round(zoom * 100)}%</Mono>
            </div>
          </div>

          {/* Selected node panel */}
          <div className="xl:w-64 flex flex-col gap-4 sticky top-8">
            <SectionHeader number="" title={t("graph.selectedNode")} />
            <div className="p-5 border border-border bg-surface flex flex-col gap-4 rounded-sm min-h-[200px]">
              {selectedNode ? (
                <>
                  <div className="flex flex-col gap-1">
                    <Meta>{t("graph.legend.nodes")}: {getNodeStyle(selectedNode.type).label}</Meta>
                    <Mono className="text-base font-bold text-text-primary leading-tight">{selectedNode.label}</Mono>
                  </div>
                  <div className="flex flex-col gap-1 pt-3 border-t border-border">
                    <Meta>TYPE</Meta>
                    <Mono className="text-sm">{selectedNode.type.replace(/_/g, " ")}</Mono>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Meta>RELATIONSHIPS</Meta>
                    <Mono className="text-sm">{edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length.toString().padStart(2, "0")} CONNECTED</Mono>
                  </div>
                  <div className="flex flex-col gap-2 pt-3 border-t border-border">
                    <Meta>CONNECTED EDGES</Meta>
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).slice(0, 5).map((e, i) => (
                      <Mono key={i} className="text-[10px] text-text-secondary">{e.source === selectedNode.id ? `→ ${e.target}` : `← ${e.source}`} [{e.relationship.replace(/_/g, " ")}]</Mono>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted gap-2 opacity-50 mt-8">
                  <Meta>{t("state.noNodeSelected")}</Meta>
                  <Body className="text-xs">Click a node in the graph to view its details.</Body>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="p-4 border border-border bg-surface rounded-sm flex flex-col gap-2">
              <Meta>GRAPH STATS</Meta>
              <div className="flex justify-between">
                <Meta>NODES</Meta>
                <Mono className="text-sm">{localNodes.length}</Mono>
              </div>
              <div className="flex justify-between">
                <Meta>EDGES</Meta>
                <Mono className="text-sm">{edges.length}</Mono>
              </div>
              <div className="flex justify-between">
                <Meta>VISIBLE EDGES</Meta>
                <Mono className="text-sm">{visibleEdges.length}</Mono>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
