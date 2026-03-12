import { useState, useCallback, useEffect, useRef } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED PRODUCTION DATA
// ============================================================

var CLIENTS = [
  { id: "claude_desktop", name: "Claude Desktop", icon: "D", color: C.purple, user: "Felipe (Vendedor)" },
  { id: "claude_code", name: "Claude Code", icon: "C", color: C.cyan, user: "Marcos (Admin)" },
  { id: "admin_chat", name: "Chat do Admin", icon: "A", color: C.blue, user: "Sandra (Coord)" },
  { id: "cron_agent", name: "Agente Cron", icon: "R", color: C.orange, user: "Sistema" },
];

var TOOL_NAMES = ["buscar_cliente", "listar_obras", "criar_os", "buscar_estoque", "consultar_agenda", "agendar_visita"];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min)); }

function generateMetrics(count) {
  var calls = [];
  var now = Date.now();
  for (var i = 0; i < count; i++) {
    var client = randomItem(CLIENTS);
    var tool = randomItem(TOOL_NAMES);
    var isWrite = tool === "criar_os" || tool === "agendar_visita";
    var latency = isWrite ? randomInt(80, 400) : randomInt(20, 200);
    var success = Math.random() > 0.03;
    var cached = !isWrite && Math.random() > 0.6;
    calls.push({
      id: "call_" + String(i + 1).padStart(5, "0"),
      timestamp: now - (count - i) * 30000 + randomInt(0, 15000),
      client: client,
      tool: tool,
      latencyMs: cached ? randomInt(2, 8) : latency,
      success: success,
      cached: cached,
      category: isWrite ? "write" : "read",
    });
  }
  return calls;
}

function computeStats(calls) {
  var total = calls.length;
  var errors = calls.filter(function(c) { return !c.success; }).length;
  var cached = calls.filter(function(c) { return c.cached; }).length;
  var avgLatency = total > 0 ? Math.round(calls.reduce(function(s, c) { return s + c.latencyMs; }, 0) / total) : 0;

  // Per tool stats
  var toolStats = {};
  TOOL_NAMES.forEach(function(t) {
    var toolCalls = calls.filter(function(c) { return c.tool === t; });
    var tc = toolCalls.length;
    toolStats[t] = {
      count: tc,
      avgLatency: tc > 0 ? Math.round(toolCalls.reduce(function(s, c) { return s + c.latencyMs; }, 0) / tc) : 0,
      errorRate: tc > 0 ? (toolCalls.filter(function(c) { return !c.success; }).length / tc * 100).toFixed(1) : "0",
      cacheRate: tc > 0 ? (toolCalls.filter(function(c) { return c.cached; }).length / tc * 100).toFixed(0) : "0",
    };
  });

  // Per client stats
  var clientStats = {};
  CLIENTS.forEach(function(cl) {
    var clCalls = calls.filter(function(c) { return c.client.id === cl.id; });
    clientStats[cl.id] = {
      count: clCalls.length,
      name: cl.name,
      color: cl.color,
    };
  });

  // Hourly distribution (last 12 "hours" = last 12 segments)
  var hourly = [];
  var segmentSize = Math.ceil(total / 12);
  for (var i = 0; i < 12; i++) {
    var segment = calls.slice(i * segmentSize, (i + 1) * segmentSize);
    hourly.push({
      label: (12 - i) + "h",
      reads: segment.filter(function(c) { return c.category === "read"; }).length,
      writes: segment.filter(function(c) { return c.category === "write"; }).length,
      errors: segment.filter(function(c) { return !c.success; }).length,
    });
  }

  return {
    total: total,
    errors: errors,
    errorRate: total > 0 ? (errors / total * 100).toFixed(1) : "0",
    cached: cached,
    cacheRate: total > 0 ? (cached / total * 100).toFixed(0) : "0",
    avgLatency: avgLatency,
    toolStats: toolStats,
    clientStats: clientStats,
    hourly: hourly.reverse(),
    uptime: "99.7%",
  };
}

// ============================================================
// MULTI-MCP COMPOSITION DEMO
// ============================================================
var COMPOSITION_SCENARIOS = [
  {
    id: 1,
    title: "Agendar visita com notificacao",
    userMessage: "Agenda uma visita tecnica pro Carlos Mendes amanha as 14h e manda uma mensagem confirmando no WhatsApp",
    steps: [
      { mcp: "Costa Lima", tool: "buscar_cliente", params: '{ query: "Carlos Mendes" }', result: '{ nome: "Carlos Mendes", tel: "24 99999-1234" }', color: C.cyan },
      { mcp: "Costa Lima", tool: "agendar_visita", params: '{ data: "2026-03-12", hora: "14:00", desc: "Visita tecnica" }', result: '{ status: "agendado", id: "ag_042" }', color: C.cyan },
      { mcp: "Google Calendar", tool: "create_event", params: '{ title: "Visita - Carlos Mendes", date: "2026-03-12T14:00" }', result: '{ eventId: "evt_abc", link: "calendar.google.com/..." }', color: C.green },
      { mcp: "WhatsApp (Z-API)", tool: "send_message", params: '{ to: "5524999991234", msg: "Ola Carlos! Confirmada visita amanha 14h." }', result: '{ sent: true, msgId: "wpp_123" }', color: C.amber },
    ],
    response: "Pronto! Agendei a visita tecnica pro Carlos Mendes amanha as 14h. Ja criei o evento no Google Calendar e enviei confirmacao no WhatsApp dele.",
  },
  {
    id: 2,
    title: "Relatorio de obras com email",
    userMessage: "Me manda por email um resumo das obras em andamento com progresso e valor",
    steps: [
      { mcp: "Costa Lima", tool: "listar_obras", params: '{ status: "EM_ANDAMENTO" }', result: '[ { codigo: "OBR-034", prog: 35%, valor: 85k }, { codigo: "OBR-038", prog: 60%, valor: 42k } ]', color: C.cyan },
      { mcp: "Costa Lima", tool: "consultar_financeiro", params: '{ tipo: "obras_ativas" }', result: '{ recebido: 58k, pendente: 69k }', color: C.cyan },
      { mcp: "Gmail", tool: "send_email", params: '{ to: "sandra@costalima.com", subject: "Resumo Obras Ativas", body: "..." }', result: '{ sent: true, messageId: "msg_xyz" }', color: C.red },
    ],
    response: "Enviei o relatorio por email! 2 obras ativas: OBR-034 (35%, R$85k) e OBR-038 (60%, R$42k). Total recebido: R$58k, pendente: R$69k.",
  },
  {
    id: 3,
    title: "Alerta automatico de estoque",
    userMessage: "[CRON] Verificar estoque abaixo do minimo e alertar no Slack",
    steps: [
      { mcp: "Costa Lima", tool: "buscar_estoque", params: '{ abaixo_minimo: true }', result: '[ { nome: "Kit LED", estoque: 1, min: 3 }, { nome: "Aquec. Solar", estoque: 2, min: 2 } ]', color: C.cyan },
      { mcp: "Costa Lima", tool: "buscar_estoque", params: '{ query: "Kit LED" }', result: '{ fornecedor: "PoolTech", ultimo_preco: 480 }', color: C.cyan },
      { mcp: "Slack", tool: "post_message", params: '{ channel: "#estoque", msg: "ALERTA: Kit LED (1/3) e Aquec. Solar (2/2) abaixo do minimo" }', result: '{ posted: true, ts: "1710..." }', color: C.purple },
    ],
    response: "Alerta enviado no #estoque do Slack. 2 itens abaixo do minimo: Kit LED (1/3, fornecedor PoolTech R$480) e Aquecimento Solar (2/2).",
  },
];

// ============================================================
// MINI BAR CHART
// ============================================================
function MiniBarChart(props) {
  var data = props.data;
  var height = props.height || 80;
  var maxVal = Math.max.apply(null, data.map(function(d) { return d.reads + d.writes + d.errors; }).concat([1]));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: height + "px" }}>
      {data.map(function(d, i) {
        var total = d.reads + d.writes + d.errors;
        var h = (total / maxVal) * height;
        var readH = total > 0 ? (d.reads / total) * h : 0;
        var writeH = total > 0 ? (d.writes / total) * h : 0;
        var errH = total > 0 ? (d.errors / total) * h : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
              {errH > 0 && <div style={{ height: errH + "px", background: C.red, borderRadius: "2px 2px 0 0" }} />}
              {writeH > 0 && <div style={{ height: writeH + "px", background: C.amber }} />}
              {readH > 0 && <div style={{ height: readH + "px", background: C.green, borderRadius: errH > 0 || writeH > 0 ? "0" : "2px 2px 0 0" }} />}
            </div>
            <div style={{ fontSize: "7px", color: C.textDim, marginTop: "3px" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MCPProductionLab() {
  var [activeTab, setActiveTab] = useState("dashboard");
  var [calls] = useState(function() { return generateMetrics(200); });
  var [expandedScenario, setExpandedScenario] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(99);

  var stats = computeStats(calls);

  var playScenario = useCallback(function(id) {
    setExpandedScenario(id);
    setVisibleSteps(0);
    var scenario = COMPOSITION_SCENARIOS.find(function(s) { return s.id === id; });
    if (!scenario) return;
    scenario.steps.forEach(function(_, i) {
      setTimeout(function() { setVisibleSteps(i + 1); }, (i + 1) * 700);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.green, padding: "4px 10px", borderRadius: "4px",
            background: C.green + "12", border: "1px solid " + C.green + "33",
          }}>Cap 3 - Modulo 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            MCP em Producao
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Dashboard | Multi-client | Composicao entre MCPs | Deploy
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "composition", label: "Composicao Multi-MCP" },
            { id: "deploy", label: "Deploy e CI/CD" },
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

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            {/* Top metrics */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Total calls", value: stats.total, color: C.text },
                { label: "Uptime", value: stats.uptime, color: C.green },
                { label: "Latencia media", value: stats.avgLatency + "ms", color: stats.avgLatency > 200 ? C.amber : C.green },
                { label: "Taxa de erro", value: stats.errorRate + "%", color: parseFloat(stats.errorRate) > 2 ? C.red : C.green },
                { label: "Cache hit", value: stats.cacheRate + "%", color: C.blue },
                { label: "Erros", value: stats.errors, color: stats.errors > 5 ? C.red : C.amber },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "80px", padding: "12px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Activity chart */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "16px", marginBottom: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>
                ATIVIDADE (ultimas 12h)
              </div>
              <MiniBarChart data={stats.hourly} height={70} />
              <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "9px" }}>
                <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.green, marginRight: "4px" }} />Read</span>
                <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.amber, marginRight: "4px" }} />Write</span>
                <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.red, marginRight: "4px" }} />Error</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
              {/* Tool stats */}
              <div style={{
                flex: 1.2, minWidth: "300px",
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", overflow: "hidden",
              }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>
                  TOOLS - METRICAS
                </div>
                {TOOL_NAMES.map(function(t, i) {
                  var ts = stats.toolStats[t];
                  var isWrite = t === "criar_os" || t === "agendar_visita";
                  return (
                    <div key={t} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 14px", fontSize: "10px",
                      borderBottom: i < TOOL_NAMES.length - 1 ? "1px solid " + C.border : "none",
                    }}>
                      <span style={{
                        fontSize: "7px", fontWeight: 800, padding: "2px 4px", borderRadius: "3px",
                        background: (isWrite ? C.amber : C.green) + "15",
                        color: isWrite ? C.amber : C.green,
                        flexShrink: 0,
                      }}>{isWrite ? "W" : "R"}</span>
                      <span style={{ color: C.text, fontWeight: 600, flex: 1 }}>{t}</span>
                      <span style={{ color: C.textMuted }}>{ts.count} calls</span>
                      <span style={{ color: ts.avgLatency > 200 ? C.amber : C.green }}>{ts.avgLatency}ms</span>
                      <span style={{ color: parseFloat(ts.errorRate) > 2 ? C.red : C.textDim }}>{ts.errorRate}% err</span>
                      <span style={{ color: C.blue, fontSize: "9px" }}>{ts.cacheRate}% cache</span>
                    </div>
                  );
                })}
              </div>

              {/* Client stats */}
              <div style={{
                flex: 0.8, minWidth: "220px",
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", overflow: "hidden",
              }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>
                  CLIENTS CONECTADOS
                </div>
                {CLIENTS.map(function(cl, i) {
                  var cs = stats.clientStats[cl.id];
                  return (
                    <div key={cl.id} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", fontSize: "11px",
                      borderBottom: i < CLIENTS.length - 1 ? "1px solid " + C.border : "none",
                    }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: cl.color + "20", border: "1px solid " + cl.color + "44",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 800, color: cl.color, flexShrink: 0,
                      }}>{cl.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: "11px" }}>{cl.name}</div>
                        <div style={{ fontSize: "9px", color: C.textDim }}>{cl.user}</div>
                      </div>
                      <span style={{ color: cl.color, fontWeight: 700, fontSize: "13px" }}>{cs.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent calls */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", overflow: "hidden",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>
                ULTIMAS CALLS
              </div>
              {calls.slice(-15).reverse().map(function(call, i) {
                return (
                  <div key={call.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "6px 14px", fontSize: "10px",
                    borderBottom: i < 14 ? "1px solid " + C.border : "none",
                    background: !call.success ? C.red + "04" : "transparent",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: !call.success ? C.red : call.cached ? C.blue : C.green, flexShrink: 0,
                    }} />
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: call.client.color + "15",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "8px", fontWeight: 800, color: call.client.color, flexShrink: 0,
                    }}>{call.client.icon}</span>
                    <span style={{ color: C.cyan, fontWeight: 600, minWidth: "120px" }}>{call.tool}</span>
                    <span style={{ color: C.textDim, flex: 1 }}>{call.client.name}</span>
                    <span style={{ color: call.latencyMs > 200 ? C.amber : C.textDim }}>{call.latencyMs}ms</span>
                    {call.cached && <span style={{ fontSize: "7px", color: C.blue, fontWeight: 700 }}>CACHE</span>}
                    {!call.success && <span style={{ fontSize: "7px", color: C.red, fontWeight: 700 }}>ERRO</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPOSITION TAB */}
        {activeTab === "composition" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              O LLM orquestra tools de multiplos MCP Servers numa unica conversa. Clique para reproduzir cada cenario.
            </p>

            {COMPOSITION_SCENARIOS.map(function(scenario) {
              var isExpanded = expandedScenario === scenario.id;
              return (
                <div key={scenario.id} style={{
                  background: C.surface, border: "1px solid " + (isExpanded ? C.blue + "44" : C.border),
                  borderRadius: "10px", overflow: "hidden", marginBottom: "10px",
                }}>
                  {!isExpanded ? (
                    <button onClick={function() { playScenario(scenario.id); }} style={{
                      width: "100%", textAlign: "left", padding: "14px",
                      border: "none", background: "transparent",
                      color: C.text, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px", color: C.blue }}>{"▶"}</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700 }}>{scenario.title}</div>
                          <div style={{ fontSize: "10px", color: C.textDim }}>{scenario.steps.length + " tools em " + new Set(scenario.steps.map(function(s) { return s.mcp; })).size + " MCPs"}</div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{scenario.title}</span>
                        <button onClick={function() { setExpandedScenario(null); }} style={{
                          padding: "4px 10px", borderRadius: "4px", border: "1px solid " + C.border,
                          background: "transparent", color: C.textDim, fontSize: "10px",
                          fontFamily: "inherit", cursor: "pointer",
                        }}>Fechar</button>
                      </div>

                      {/* User message */}
                      <div style={{
                        padding: "10px 12px", borderRadius: "8px", marginBottom: "12px",
                        background: C.blue + "10", border: "1px solid " + C.blue + "22",
                        fontSize: "12px", color: C.text,
                      }}>
                        <div style={{ fontSize: "9px", color: C.blue, fontWeight: 700, marginBottom: "4px" }}>USUARIO</div>
                        {scenario.userMessage}
                      </div>

                      {/* Steps */}
                      {scenario.steps.map(function(step, i) {
                        if (i >= visibleSteps) return null;
                        return (
                          <div key={i} style={{
                            padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
                            background: C.surfaceAlt, border: "1px solid " + C.border, fontSize: "10px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <span style={{
                                fontSize: "8px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                                background: step.color + "15", color: step.color,
                              }}>{step.mcp}</span>
                              <span style={{ color: C.cyan, fontWeight: 700 }}>{step.tool}</span>
                            </div>
                            <div style={{ color: C.textDim, marginBottom: "4px" }}>Params: {step.params}</div>
                            <div style={{ color: C.green, fontSize: "9px" }}>Result: {step.result}</div>
                          </div>
                        );
                      })}

                      {/* Final response */}
                      {visibleSteps >= scenario.steps.length && (
                        <div style={{
                          padding: "10px 12px", borderRadius: "8px",
                          background: C.green + "08", border: "1px solid " + C.green + "22",
                          fontSize: "12px", color: C.text, lineHeight: 1.6,
                        }}>
                          <div style={{ fontSize: "9px", color: C.green, fontWeight: 700, marginBottom: "4px" }}>ASSISTENTE</div>
                          {scenario.response}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* DEPLOY TAB */}
        {activeTab === "deploy" && (
          <div>
            {[
              {
                title: "Opcao recomendada: junto com Express",
                color: C.green,
                text: "O MCP Server roda dentro do backend Express na porta 3333, expondo SSE em /mcp/sse. Deploy unico no Railway. Compartilha processo, conexao Prisma e variaveis de ambiente.\n\nbackend/src/mcp/\n  server.ts      <- McpServer com tools\n  transport.ts   <- SSE handler no Express\n  tools/         <- mesmo padrao de services/\n\nNo app.ts:\n  app.get('/mcp/sse', mcpSseHandler)\n  app.post('/mcp/messages', mcpMessageHandler)\n\nVantagem: simples, barato, suficiente pro volume do Costa Lima.\nQuando migrar: se tool calls > 1000/dia ou se precisar escalar separadamente.",
              },
              {
                title: "CI/CD e testes",
                color: C.cyan,
                text: "Mesmo pipeline do backend existente (Vitest, 68+ testes):\n\n1. Testes unitarios por tool (input/output)\n2. Testes de RBAC (cada nivel x cada tool)\n3. Testes de sanitizacao (campos sensiveis nunca retornados)\n4. Testes de resiliencia (banco indisponivel, input malicioso)\n5. Testes de integracao (handshake + tool call completo)\n\nnpx vitest run -> merge -> deploy automatico (Railway)\n\nThresholds adicionais: cobertura de tools 80%, RBAC 100%.",
              },
              {
                title: "Monitoramento",
                color: C.amber,
                text: "Metricas essenciais (dashboard do admin /administracao/mcp):\n- Tool calls/hora (grafico 24h)\n- Latencia P50/P95 por tool\n- Taxa de erro por tool\n- Cache hit rate\n- Top usuarios\n- Alertas: erro > 5%, latencia P95 > 1s, uptime < 99%\n\nUse a tabela MCPCallLog + Recharts (ja no admin) para o dashboard.\nAlertas via webhook para Slack do time.",
              },
              {
                title: "Composicao com MCPs externos",
                color: C.purple,
                text: "MCPs que o Costa Lima pode conectar hoje:\n\n- Google Calendar (agenda de visitas)\n  URL: gcal.mcp.claude.com/mcp\n\n- Gmail (envio de relatorios)\n  URL: gmail.mcp.claude.com/mcp\n\n- Costa Lima (seu MCP custom)\n  URL: api.costalima.com/mcp/sse\n\nO vendedor configura os tres no Claude Desktop. O LLM orquestra tools de todos numa conversa unica.\n\nO MCP do Costa Lima e o CORE. Os outros sao satelites que complementam.",
              },
              {
                title: "Visao de produto interno",
                color: C.orange,
                text: "O MCP Server nao e um projeto tech - e um PRODUTO INTERNO.\n\nUsuarios: vendedores, coordenador, admin\nCanais: Claude Desktop, Chat do Admin, agentes automaticos\nSLA: 99.5% uptime, < 200ms latencia, < 2% erro\nRoadmap:\n  v1.0 - 6 tools basicas (clientes, obras, OS, estoque, agenda)\n  v1.1 - Financeiro (read-only para coordenadores)\n  v2.0 - Agentes automaticos (alertas, relatorios)\n  v2.1 - Composicao com Conta Azul MCP\n  v3.0 - Chat embutido no admin e PWA\n\nDocumentacao: cada tool tem descricao, parametros, exemplos e permissoes.\nOnboarding: vendedor instala Claude Desktop, configura MCP, esta operacional em 10 min.",
              },
            ].map(function(section) {
              return (
                <div key={section.title} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "20px", marginBottom: "12px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>{section.title}</h3>
                  <pre style={{
                    margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit",
                    fontSize: "12px", lineHeight: 1.7, color: C.textMuted,
                  }}>
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
