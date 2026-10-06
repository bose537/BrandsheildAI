import React, { useState, useMemo } from "react";
import { Network, X } from "lucide-react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
export default function ThreatGraph({ graph, findings, onSelect }) {
  const [node, setNode] = useState(null);
  const [campaignOnly, setCampaignOnly] = useState(true);
  const model = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    const linked = new Set(
      findings.filter((f) => f.campaign_id).map((f) => f.id),
    );
    const selected = graph.nodes.filter(
      (n) =>
        !campaignOnly ||
        n.kind === "brand" ||
        n.kind === "campaign" ||
        linked.has(n.id) ||
        (n.kind === "domain" &&
          graph.edges.some((e) => e.target === n.id && linked.has(e.source))),
    );
    const ids = new Set(selected.map((n) => n.id));
    const counts = {};
    return {
      nodes: selected.map((n) => {
        const index = counts[n.column] || 0;
        counts[n.column] = index + 1;
        return {
          id: n.id,
          position: { x: n.column * 300, y: index * 100 },
          data: {
            label: (
              <>
                <small>
                  {n.kind.toUpperCase()}
                  {n.risk !== undefined ? " · " + n.risk + "/100" : ""}
                </small>
                <strong>{n.label}</strong>
              </>
            ),
          },
          className: "graph-node " + n.kind,
          sourcePosition: "right",
          targetPosition: "left",
        };
      }),
      edges: graph.edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .map((e) => ({
          ...e,
          type: "smoothstep",
          style: { stroke: "#50647a" },
          labelStyle: { fill: "#b5c3d3", fontSize: 10 },
          labelBgStyle: { fill: "#161f2b" },
        })),
    };
  }, [graph, campaignOnly, findings]);
  return (
    <>
      <div className="graph-intro">
        <p>
          Connections come from exact shared domains. They suggest coordination;
          they do not prove common ownership.
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={campaignOnly}
            onChange={(e) => setCampaignOnly(e.target.checked)}
          />{" "}
          Focus on campaigns
        </label>
      </div>
      <div className="graph-wrap">
        <ReactFlow
          key={campaignOnly ? "campaigns" : "all"}
          nodes={model.nodes}
          edges={model.edges}
          fitView
          minZoom={0.15}
          maxZoom={1.5}
          nodesDraggable={false}
          onNodeClick={(_, n) => {
            const raw = graph.nodes.find((x) => x.id === n.id);
            if (raw.finding_id)
              onSelect(findings.find((f) => f.id === raw.finding_id));
            else setNode(raw);
          }}
        >
          <Background color="#344154" gap={24} />
          <Controls />
          <MiniMap
            nodeColor={(n) =>
              n.className.includes("campaign") ? "#dca466" : "#5b9fa0"
            }
            maskColor="#10151ec0"
          />
        </ReactFlow>
        {model.nodes.length <= 1 && (
          <div className="graph-empty">
            {findings.length
              ? "No matching campaign relationships. Turn off the campaign filter to inspect individual assets."
              : "Run a scan to discover evidenced relationships."}
          </div>
        )}
      </div>
      {node && (
        <div className="notice">
          <Network size={20} />
          <p>
            <strong>{node.label}</strong>
            <br />
            {node.evidence ||
              "Select a connected asset to inspect its evidence and risk calculation."}
          </p>
          <button className="icon-button" onClick={() => setNode(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="graph-legend">
        <span>Trusted brand</span>
        <span>Social / app</span>
        <span>Shared domain</span>
        <span>Possible campaign</span>
      </div>
    </>
  );
}
