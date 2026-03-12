import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// GRAPH NODE TYPES
// ============================================================
var NODE_STYLES = {
  start: { color: C.blue, icon: "\u25B6", label: "INICIO" },
  classify: { color: C.amber, icon: "\uD83C\uDFAF", label: "CLASSIFICAR" },
  route: { color: C.purple, icon: "\u2934", label: "ROTEAR" },
  tool: { color: C.cyan, icon: "\uD83D\uDD27", label: "TOOL" },
  hitl: { color: C.orange, icon: "\u270B", label: "APROVACAO HUMANA" },
  fallback: { color: C.red, icon: "\u26A0", label: "FALLBACK" },
  respond: { color: C.green, icon: "\u2705", label: "RESPONDER" },
  error: { color: C.red, icon: "\u2717", label: "ERRO" },
};

// ============================================================
// GRAPH SCENARIOS
// ============================================================
var GRAPH_SCENARIOS = [
  {
    id: "normal",
    title: "Fluxo normal (consulta de obra)",
    input: "Qual a situacao da obra do Carlos?",
    nodes: [
      { id: "n1", type: "start", name: "Receber input", data: "Qual a situacao da obra do Carlos?", latency: 2, cost: 0 },
      { id: "n2", type: "classify", name: "Classificar intencao", data: '{ intencao: "CONSULTA", urgencia: "media" }', latency: 120, cost: 0.0003 },
      { id: "n3", type: "route", name: "Rotear", data: "urgencia=media -> fluxo_normal", latency: 2, cost: 0 },
      { id: "n4", type: "tool", name: "buscar_cliente", data: '{ nome: "Carlos Mendes", id: "cli_001" }', latency: 45, cost: 0 },
      { id: "n5", type: "tool", name: "listar_obras", data: '{ OBR-034, 35%, EM_ANDAMENTO }', latency: 62, cost: 0 },
      { id: "n6", type: "respond", name: "Gerar resposta", data: "OBR-034 esta em 35% de progresso...", latency: 380, cost: 0.0004 },
    ],
    edges: ["n1>n2", "n2>n3", "n3>n4", "n4>n5", "n5>n6"],
    success: true,
    hitl: false,
  },
  {
    id: "emergency",
    title: "Rota de emergencia (urgente)",
    input: "URGENTE: bomba parou e esta vazando no condominio!",
    nodes: [
      { id: "n1", type: "start", name: "Receber input", data: "URGENTE: bomba parou...", latency: 2, cost: 0 },
      { id: "n2", type: "classify", name: "Classificar intencao", data: '{ intencao: "MANUTENCAO", urgencia: "CRITICA" }', latency: 110, cost: 0.0003 },
      { id: "n3", type: "route", name: "Rotear", data: "urgencia=CRITICA -> rota_emergencial", latency: 2, cost: 0, highlight: true },
      { id: "n4", type: "tool", name: "criar_os (P0)", data: '{ OS-2026-000105, PENDENTE, P0 }', latency: 95, cost: 0 },
      { id: "n5", type: "hitl", name: "Confirmar envio", data: "Aprovar OS + agenda + WhatsApp?", latency: 0, cost: 0, paused: true },
      { id: "n6", type: "tool", name: "agendar_tecnico", data: '{ hoje 16h, Andre + Paulo }', latency: 85, cost: 0 },
      { id: "n7", type: "tool", name: "enviar_whatsapp", data: "Tecnico a caminho...", latency: 200, cost: 0 },
      { id: "n8", type: "respond", name: "Confirmar acoes", data: "OS criada, tecnico agendado, cliente notificado", latency: 250, cost: 0.0004 },
    ],
    edges: ["n1>n2", "n2>n3", "n3>n4", "n4>n5", "n5>n6", "n6>n7", "n7>n8"],
    success: true,
    hitl: true,
  },
  {
    id: "fallback",
    title: "Fallback (tool falha + recuperacao)",
    input: "Quanto tem de cimento no estoque?",
    nodes: [
      { id: "n1", type: "start", name: "Receber input", data: "Quanto cimento no estoque?", latency: 2, cost: 0 },
      { id: "n2", type: "classify", name: "Classificar", data: '{ intencao: "CONSULTA_ESTOQUE" }', latency: 100, cost: 0.0003 },
      { id: "n3", type: "tool", name: "buscar_estoque", data: "ERRO: Connection timeout (5s)", latency: 5000, cost: 0, error: true },
      { id: "n4", type: "fallback", name: "Retry #1 (backoff 2s)", data: "Tentando novamente...", latency: 2000, cost: 0 },
      { id: "n5", type: "tool", name: "buscar_estoque (retry)", data: "ERRO: Connection timeout", latency: 5000, cost: 0, error: true },
      { id: "n6", type: "fallback", name: "Fallback: cache", data: "Usando dados cacheados (2h atras)", latency: 5, cost: 0, recovered: true },
      { id: "n7", type: "respond", name: "Resposta degradada", data: "Dados de ~2h atras: cimento 48 sacos. Banco indisponivel - dados podem estar desatualizados.", latency: 200, cost: 0.0003, degraded: true },
    ],
    edges: ["n1>n2", "n2>n3", "n3>n4", "n4>n5", "n5>n6", "n6>n7"],
    success: true,
    hitl: false,
    degraded: true,
  },
  {
    id: "circuit_breaker",
    title: "Circuit breaker (falha total)",
    input: "Gera um relatorio completo de todas as obras",
    nodes: [
      { id: "n1", type: "start", name: "Receber input", data: "Relatorio completo...", latency: 2, cost: 0 },
      { id: "n2", type: "classify", name: "Classificar", data: '{ intencao: "RELATORIO", complexidade: "alta" }', latency: 110, cost: 0.0003 },
      { id: "n3", type: "tool", name: "listar_obras", data: "ERRO: 500 Internal Server Error", latency: 800, cost: 0, error: true },
      { id: "n4", type: "fallback", name: "Retry #1", data: "ERRO persistente", latency: 2000, cost: 0 },
      { id: "n5", type: "tool", name: "listar_obras (retry)", data: "ERRO: 500", latency: 800, cost: 0, error: true },
      { id: "n6", type: "fallback", name: "Retry #2", data: "ERRO persistente", latency: 4000, cost: 0 },
      { id: "n7", type: "tool", name: "listar_obras (retry 2)", data: "ERRO: 500", latency: 800, cost: 0, error: true },
      { id: "n8", type: "error", name: "CIRCUIT BREAKER", data: "3 erros consecutivos. Execucao interrompida. Escalando para humano.", latency: 5, cost: 0 },
    ],
    edges: ["n1>n2", "n2>n3", "n3>n4", "n4>n5", "n5>n6", "n6>n7", "n7>n8"],
    success: false,
    hitl: false,
  },
  {
    id: "hitl_write",
    title: "HITL para acoes de escrita",
    input: "Cria uma OS pra trocar a bomba do Carlos e agenda visita amanha 10h",
    nodes: [
      { id: "n1", type: "start", name: "Receber input", data: "Criar OS + agendar visita...", latency: 2, cost: 0 },
      { id: "n2", type: "classify", name: "Classificar", data: '{ intencao: "MULTI_ACAO", acoes: ["criar_os", "agendar"] }', latency: 130, cost: 0.0003 },
      { id: "n3", type: "tool", name: "buscar_cliente", data: '{ Carlos Mendes, cli_001 }', latency: 45, cost: 0 },
      { id: "n4", type: "hitl", name: "Preview de acoes", data: "1) Criar OS: 'Troca bomba - Carlos Mendes' (media)\n2) Agendar: 12/03 10h visita tecnica\n\nAprovar ambas as acoes?", latency: 0, cost: 0, paused: true },
      { id: "n5", type: "tool", name: "criar_os", data: '{ OS-2026-000106, PENDENTE }', latency: 110, cost: 0 },
      { id: "n6", type: "tool", name: "agendar_visita", data: '{ 12/03 10h, agendado }', latency: 90, cost: 0 },
      { id: "n7", type: "respond", name: "Confirmar", data: "OS criada + visita agendada. Tudo certo!", latency: 200, cost: 0.0004 },
    ],
    edges: ["n1>n2", "n2>n3", "n3>n4", "n4>n5", "n5>n6", "n6>n7"],
    success: true,
    hitl: true,
  },
];

// ============================================================
// OBSERVABILITY DATA
// ============================================================
function generateTraces(count) {
  var traces = [];
  var names = ["Felipe", "Sandra", "Marcos", "Camila"];
  var intents = ["CONSULTA", "MANUTENCAO", "CONSTRUCAO", "ORCAMENTO", "RECLAMACAO"];
  for (var i = 0; i < count; i++) {
    var nodes = 3 + Math.floor(Math.random() * 5);
    var success = Math.random() > 0.08;
    var hitl = Math.random() > 0.75;
    var latency = 200 + Math.floor(Math.random() * 2800);
    var cost = 0.002 + Math.random() * 0.008;
    traces.push({
      id: "tr_" + String(i + 1).padStart(4, "0"),
      user: names[Math.floor(Math.random() * names.length)],
      intent: intents[Math.floor(Math.random() * intents.length)],
      nodes: nodes,
      latencyMs: latency,
      cost: cost,
      success: success,
      hitl: hitl,
      time: (8 + Math.floor(i / (count / 10))) + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0"),
    });
  }
  return traces;
}

var TRACES = generateTraces(40);

function computeObsStats(traces) {
  var total = traces.length;
  var ok = traces.filter(function(t) { return t.success; }).length;
  var hitl = traces.filter(function(t) { return t.hitl; }).length;
  var avgLatency = Math.round(traces.reduce(function(s, t) { return s + t.latencyMs; }, 0) / total);
  var p95 = traces.map(function(t) { return t.latencyMs; }).sort(function(a, b) { return a - b; })[Math.floor(total * 0.95)];
  var totalCost = traces.reduce(function(s, t) { return s + t.cost; }, 0);
  var avgNodes = (traces.reduce(function(s, t) { return s + t.nodes; }, 0) / total).toFixed(1);

  var byIntent = {};
  traces.forEach(function(t) {
    if (!byIntent[t.intent]) byIntent[t.intent] = { count: 0, errors: 0 };
    byIntent[t.intent].count++;
    if (!t.success) byIntent[t.intent].errors++;
  });

  return { total: total, successRate: (ok / total * 100).toFixed(1), hitlRate: (hitl / total * 100).toFixed(1), avgLatency: avgLatency, p95: p95, totalCost: totalCost, avgNodes: avgNodes, byIntent: byIntent };
}

// ============================================================
// COMPONENTS
// ============================================================

function GraphNode(props) {
  var node = props.node;
  var visible = props.visible;
  var isActive = props.isActive;
  if (!visible) return null;

  var ns = NODE_STYLES[node.type] || NODE_STYLES.tool;
  var borderColor = node.error ? C.red : node.paused ? C.orange : node.recovered ? C.amber : node.degraded ? C.amber : ns.color;

  return (
    <div style={{
      display: "flex", gap: "12px", marginBottom: "6px",
      opacity: isActive ? 1 : 0.7,
    }}>
      {/* Connector line */}
      <div style={{ width: "24px", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: "20px", height: "20px", borderRadius: "50%",
          background: borderColor + "20", border: "2px solid " + borderColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px",
        }}>
          {ns.icon}
        </div>
        <div style={{ width: "2px", flex: 1, background: C.border, minHeight: "8px" }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, padding: "10px 12px", borderRadius: "8px",
        background: node.error ? C.red + "08" : node.paused ? C.orange + "08" : C.surfaceAlt,
        border: "1px solid " + borderColor + "22",
        marginBottom: "2px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span style={{ fontSize: "8px", fontWeight: 800, color: borderColor, letterSpacing: "0.5px" }}>{ns.label}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: node.error ? C.red : C.text }}>{node.name}</span>
          {node.latency > 0 && <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{node.latency >= 1000 ? (node.latency / 1000).toFixed(1) + "s" : node.latency + "ms"}</span>}
          {node.cost > 0 && <span style={{ fontSize: "9px", color: C.green }}>{"$" + node.cost.toFixed(4)}</span>}
        </div>
        <div style={{
          fontSize: "10px", color: node.error ? C.red : node.paused ? C.orange : C.textMuted,
          lineHeight: 1.5, whiteSpace: "pre-wrap",
        }}>
          {node.data}
        </div>
        {node.paused && (
          <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
            <button style={{
              padding: "4px 12px", borderRadius: "4px", border: "none",
              background: C.green, color: "#fff", fontSize: "9px",
              fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}>Aprovar</button>
            <button style={{
              padding: "4px 12px", borderRadius: "4px",
              border: "1px solid " + C.red + "44", background: "transparent",
              color: C.red, fontSize: "9px", fontFamily: "inherit", cursor: "pointer",
            }}>Rejeitar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentGraphLab() {
  var [activeTab, setActiveTab] = useState("graphs");
  var [selectedGraph, setSelectedGraph] = useState(null);
  var [visibleNodes, setVisibleNodes] = useState(0);
  var [playing, setPlaying] = useState(false);

  var obsStats = computeObsStats(TRACES);

  var playGraph = useCallback(function(graph) {
    setSelectedGraph(graph);
    setVisibleNodes(0);
    setPlaying(true);
    graph.nodes.forEach(function(n, i) {
      var delay = 0;
      for (var j = 0; j <= i; j++) delay += Math.min(graph.nodes[j].latency, 500) + 300;
      setTimeout(function() {
        setVisibleNodes(i + 1);
        if (i === graph.nodes.length - 1) setPlaying(false);
      }, delay);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.cyan, padding: "4px 10px", borderRadius: "4px",
            background: C.cyan + "12", border: "1px solid " + C.cyan + "33",
          }}>Cap 4 - Modulo 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Grafos, Observabilidade e Limites
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Roteamento | Fallback | HITL | Circuit Breaker | Traces
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "graphs", label: "Grafos de Execucao" },
            { id: "observability", label: "Observabilidade" },
            { id: "guide", label: "Guia" },
          ].map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                fontSize: "11px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                background: activeTab === tab.id ? C.surfaceAlt : "transparent",
                color: activeTab === tab.id ? C.text : C.textDim,
              }}>{tab.label}</button>
            );
          })}
        </div>

        {/* GRAPHS TAB */}
        {activeTab === "graphs" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {GRAPH_SCENARIOS.map(function(g) {
                var isSel = selectedGraph && selectedGraph.id === g.id;
                var statusColor = !g.success ? C.red : g.degraded ? C.amber : g.hitl ? C.orange : C.green;
                var statusLabel = !g.success ? "FALHA" : g.degraded ? "DEGRADADO" : g.hitl ? "COM HITL" : "SUCESSO";
                return (
                  <button key={g.id} onClick={function() { playGraph(g); }} disabled={playing} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    border: "1px solid " + (isSel ? C.blue + "44" : C.border),
                    background: isSel ? C.blue + "08" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer", fontFamily: "inherit",
                    opacity: playing && !isSel ? 0.5 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, flex: 1 }}>{g.title}</span>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                        background: statusColor + "15", color: statusColor,
                      }}>{statusLabel}</span>
                      <span style={{ fontSize: "10px", color: C.textDim }}>{g.nodes.length} nos</span>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px" }}>{g.input}</div>
                  </button>
                );
              })}
            </div>

            {selectedGraph && (
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <div style={{ flex: 1.5, minWidth: "350px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                    GRAFO DE EXECUCAO
                    {playing && <span style={{ color: C.amber, marginLeft: "8px" }}>executando...</span>}
                  </div>
                  {selectedGraph.nodes.map(function(node, i) {
                    return (
                      <GraphNode
                        key={node.id}
                        node={node}
                        visible={i < visibleNodes}
                        isActive={i === visibleNodes - 1}
                      />
                    );
                  })}
                </div>

                <div style={{ flex: 0.7, minWidth: "220px" }}>
                  <div style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "14px",
                  }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>TRACE SUMMARY</div>
                    {[
                      { label: "Nos executados", value: Math.min(visibleNodes, selectedGraph.nodes.length) + "/" + selectedGraph.nodes.length, color: C.text },
                      { label: "Latencia total", value: selectedGraph.nodes.slice(0, visibleNodes).reduce(function(s, n) { return s + n.latency; }, 0) + "ms", color: C.cyan },
                      { label: "Custo", value: "$" + selectedGraph.nodes.slice(0, visibleNodes).reduce(function(s, n) { return s + n.cost; }, 0).toFixed(4), color: C.green },
                      { label: "Erros", value: selectedGraph.nodes.slice(0, visibleNodes).filter(function(n) { return n.error; }).length, color: C.red },
                      { label: "HITL", value: selectedGraph.hitl ? "Sim" : "Nao", color: selectedGraph.hitl ? C.orange : C.textDim },
                      { label: "Status", value: selectedGraph.success ? (selectedGraph.degraded ? "Degradado" : "Sucesso") : "Falha", color: selectedGraph.success ? (selectedGraph.degraded ? C.amber : C.green) : C.red },
                    ].map(function(m, i) {
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "4px 0", fontSize: "10px",
                          borderBottom: i < 5 ? "1px solid " + C.border : "none",
                        }}>
                          <span style={{ color: C.textMuted }}>{m.label}</span>
                          <span style={{ color: m.color, fontWeight: 700 }}>{m.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "14px", marginTop: "10px",
                    fontSize: "9px",
                  }}>
                    <div style={{ color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>LEGENDA</div>
                    {Object.keys(NODE_STYLES).map(function(key) {
                      var ns = NODE_STYLES[key];
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "10px" }}>{ns.icon}</span>
                          <span style={{ color: ns.color }}>{ns.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OBSERVABILITY TAB */}
        {activeTab === "observability" && (
          <div>
            {/* Top metrics */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Total traces", value: obsStats.total, color: C.text },
                { label: "Taxa sucesso", value: obsStats.successRate + "%", color: parseFloat(obsStats.successRate) > 95 ? C.green : C.amber },
                { label: "Taxa HITL", value: obsStats.hitlRate + "%", color: parseFloat(obsStats.hitlRate) > 30 ? C.amber : C.green },
                { label: "Latencia media", value: obsStats.avgLatency + "ms", color: obsStats.avgLatency > 2000 ? C.amber : C.green },
                { label: "P95 latencia", value: obsStats.p95 + "ms", color: obsStats.p95 > 3000 ? C.red : C.amber },
                { label: "Custo total", value: "$" + obsStats.totalCost.toFixed(2), color: C.green },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "80px", padding: "12px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* By intent */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>POR INTENCAO</div>
              {Object.keys(obsStats.byIntent).map(function(intent) {
                var data = obsStats.byIntent[intent];
                var errRate = data.count > 0 ? (data.errors / data.count * 100).toFixed(0) : "0";
                return (
                  <div key={intent} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "6px 0", fontSize: "11px",
                  }}>
                    <span style={{ color: C.text, fontWeight: 600, width: "120px" }}>{intent}</span>
                    <div style={{ flex: 1, height: "8px", background: C.bg, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: (data.count / obsStats.total * 100) + "%",
                        height: "100%", background: C.cyan, borderRadius: "4px",
                      }} />
                    </div>
                    <span style={{ color: C.textMuted, width: "40px", textAlign: "right" }}>{data.count}</span>
                    <span style={{
                      color: parseFloat(errRate) > 5 ? C.red : C.textDim,
                      width: "50px", textAlign: "right", fontSize: "10px",
                    }}>{errRate}% err</span>
                  </div>
                );
              })}
            </div>

            {/* Recent traces */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", overflow: "hidden",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>
                TRACES RECENTES
              </div>
              {TRACES.slice(0, 15).map(function(t, i) {
                return (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "7px 14px", fontSize: "10px",
                    borderBottom: i < 14 ? "1px solid " + C.border : "none",
                    background: !t.success ? C.red + "04" : "transparent",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: !t.success ? C.red : t.hitl ? C.orange : C.green, flexShrink: 0,
                    }} />
                    <span style={{ color: C.textDim, width: "50px" }}>{t.id}</span>
                    <span style={{ color: C.textDim, width: "35px" }}>{t.time}</span>
                    <span style={{ color: C.textMuted, width: "50px" }}>{t.user}</span>
                    <span style={{ color: C.cyan, fontWeight: 600, flex: 1 }}>{t.intent}</span>
                    <span style={{ color: C.textDim }}>{t.nodes} nos</span>
                    <span style={{ color: t.latencyMs > 2000 ? C.amber : C.textDim }}>{t.latencyMs}ms</span>
                    <span style={{ color: C.green }}>${t.cost.toFixed(3)}</span>
                    {t.hitl && <span style={{ fontSize: "7px", color: C.orange, fontWeight: 700 }}>HITL</span>}
                    {!t.success && <span style={{ fontSize: "7px", color: C.red, fontWeight: 700 }}>ERRO</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Grafos > Loops",
                color: C.cyan,
                text: "Um agente real nao e um while loop. E um grafo de estados com roteamento condicional. O roteador decide o caminho com base na intencao, urgencia e complexidade. Caminhos diferentes = subgrafos diferentes.\n\nFluxo normal: classificar -> buscar -> responder (3 nos)\nEmergencia: classificar -> OS P0 -> tecnico -> WhatsApp (6 nos)\nRelatorio: classificar -> planejar -> N tools -> sintetizar (8+ nos)\n\nCada caminho tem seus guardrails e pontos de HITL.",
              },
              {
                title: "Fallback e Circuit Breaker",
                color: C.red,
                text: "Nivel 1 - RETRY: tool falha -> espera -> tenta de novo (max 2x)\nNivel 2 - FALLBACK: retries esgotados -> usa cache ou tool alternativa\nNivel 3 - DEGRADACAO: fallback parcial -> responde com dados incompletos + aviso\nNivel 4 - CIRCUIT BREAKER: 3 erros seguidos -> para tudo, escala para humano\n\nO cenario 'Fallback' mostra niveis 1-3 em acao. O 'Circuit breaker' mostra nivel 4.\n\nSem esses niveis, o agente fica preso em loop de erro infinito.",
              },
              {
                title: "HITL (Human-in-the-Loop)",
                color: C.orange,
                text: "O grafo PAUSA em nos de HITL. O estado fica congelado ate o humano aprovar.\n\nQuando usar HITL:\n- Acoes de escrita (criar OS, agendar, enviar mensagem)\n- Decisoes financeiras (aprovar desconto, confirmar valor)\n- Comunicacao externa (WhatsApp, email)\n- Primeira vez que o agente faz uma acao nova\n\nNo Costa Lima: o vendedor ve um preview das acoes e clica 'Aprovar' ou 'Rejeitar'. O grafo continua ou cancela.",
              },
              {
                title: "Observabilidade - o que monitorar",
                color: C.green,
                text: "TRACES: sequencia completa de nos por execucao\nMETRICAS: latencia P50/P95, taxa sucesso, taxa HITL, custo\nALERTAS:\n  - Erro > 5% -> investigar tools com falha\n  - HITL > 30% -> agente nao resolve sozinho, melhorar prompts/tools\n  - P95 > 5s -> gargalo em algum no, otimizar\n  - Custo/dia > budget -> revisar model routing\n\nNo Costa Lima: tabela AgentTrace no Prisma + dashboard Recharts no admin (/administracao/agentes).",
              },
              {
                title: "Implementacao no Costa Lima",
                color: C.purple,
                text: "O grafo e implementado como maquina de estados no backend:\n\nbackend/src/agent/\n  graph.ts       <- definicao do grafo (nos + arestas)\n  nodes/\n    classify.ts  <- no de classificacao\n    router.ts    <- no de roteamento\n    tools.ts     <- nos de tool call (reusa MCP)\n    hitl.ts      <- no de aprovacao humana\n    respond.ts   <- no de resposta\n  state.ts       <- interface AgentState\n  runner.ts      <- executor do grafo\n  traces.ts      <- registro de traces\n\nO agente usa as mesmas tools do MCP Server (Cap 3). O grafo e a camada de orquestracao em cima.",
              },
            ].map(function(section) {
              return (
                <div key={section.title} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "20px", marginBottom: "12px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>{section.title}</h3>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "12px", lineHeight: 1.7, color: C.textMuted }}>
                    {section.text}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
