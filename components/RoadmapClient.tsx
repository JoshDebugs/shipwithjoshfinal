"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  useReactFlow,
} from "@xyflow/react";
import dagre from "dagre";
import { initialNodes, initialEdges } from "@/lib/roadmap-data";

const nodeTypes = {
  custom: CustomNode,
};

type CustomNodeData = {
  category: string;
  label: string;
  description?: string;
  details?: string[];
  status?: "current" | "planned" | "done";
};

function CustomNode({ id, data }: NodeProps<Node<CustomNodeData>>) {
  const isCurrent = data.status === "current";
  const isDone = data.status === "done";
  const { setNodes } = useReactFlow();

  const setStatus = async (newStatus: "current" | "planned" | "done") => {
    const finalStatus = data.status === newStatus ? "planned" : newStatus;
    
    // Update local state for immediate feedback
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, status: finalStatus },
          };
        }
        return n;
      })
    );

    // Persist to JSON file via API
    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: finalStatus }),
      });
    } catch (e) {
      console.error("Failed to save roadmap status", e);
    }
  };

  return (
    <div className={`group px-5 py-4 shadow-2xl rounded-xl border backdrop-blur-md min-w-[300px] transition-all duration-500 ${
      isCurrent ? "bg-accent/10 border-accent scale-[1.02]" : 
      isDone ? "bg-bg-soft/40 border-line/50 opacity-75" : 
      "bg-bg-soft/90 border-line"
    }`}>
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-bg ${isDone ? '!bg-line' : '!bg-accent'}`} />
      
      <div className="flex items-start justify-between mb-2">
        <div className={`font-mono text-[10px] uppercase tracking-[0.2em] mt-1 ${isDone ? 'text-fg-soft' : 'text-accent'}`}>
          {data.category}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100 focus-within:opacity-100" style={{ opacity: isCurrent || isDone ? 1 : undefined }}>
          {/* Current Button */}
          <button 
            onClick={() => setStatus("current")}
            className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
              isCurrent 
                ? "bg-accent text-bg animate-pulse" 
                : "border border-line text-muted hover:text-accent hover:border-accent"
            }`}
            title="Mark as Currently Studying"
          >
            {isCurrent ? "Studying RN" : "Focus"}
          </button>
          
          {/* Done Button */}
          <button 
            onClick={() => setStatus("done")}
            className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
              isDone 
                ? "bg-fg text-bg" 
                : "border border-line text-muted hover:text-fg hover:border-fg"
            }`}
            title="Mark as Completed"
          >
            {isDone ? "Completed ✓" : "Done"}
          </button>
        </div>
      </div>

      <div className={`font-sans text-lg font-medium mb-1 ${isDone ? 'text-fg-soft line-through decoration-fg-soft/30' : 'text-fg'}`}>
        {data.label}
      </div>
      
      {data.description && (
        <div className="mt-1 text-xs text-fg-soft leading-relaxed border-b border-line/50 pb-3 mb-3">
          {data.description}
        </div>
      )}
      
      {data.details && data.details.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {data.details.map((detail, idx) => (
            <li key={idx} className={`flex gap-2 text-[11px] leading-snug ${isDone ? 'text-muted' : 'text-fg-soft'}`}>
              <span className={`${isDone ? 'text-line' : 'text-accent/50'} opacity-70`}>▹</span> {detail}
            </li>
          ))}
        </ul>
      )}

      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-bg ${isDone ? '!bg-line' : '!bg-accent'}`} />
    </div>
  );
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 340;
const nodeHeight = 260;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 120, ranksep: 200 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

function CustomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-left" className="!mb-4 !ml-6 flex flex-col gap-1 bg-bg/80 backdrop-blur-xl border border-line rounded-xl p-1 shadow-2xl">
      <button 
        onClick={() => zoomIn()}
        className="w-8 h-8 flex items-center justify-center text-fg-soft hover:text-fg hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        aria-label="Zoom in"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <button 
        onClick={() => zoomOut()}
        className="w-8 h-8 flex items-center justify-center text-fg-soft hover:text-fg hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        aria-label="Zoom out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <div className="h-px bg-line/50 w-full my-0.5" />
      <button 
        onClick={() => fitView({ duration: 800 })}
        className="w-8 h-8 flex items-center justify-center text-fg-soft hover:text-fg hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        aria-label="Fit view"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
    </Panel>
  );
}

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
);

export function RoadmapClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(layoutedEdges);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-bg"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1.5} />
        <CustomControls />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.category === "Mathematics") return "#06B6D4";
            if (n.data?.category === "Statistics") return "#3ECF8E";
            if (n.data?.category === "Computer Science") return "#635BFF";
            if (n.data?.category === "Data Science") return "#E03E2F";
            if (n.data?.category === "AI / ML") return "#D97757";
            if (n.data?.category === "Finance") return "#88CE02";
            return "#555";
          }}
          className="!mb-4 !mr-6 !bg-bg-soft/90 !border !border-line !rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl"
          maskColor="rgba(0,0,0,0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
