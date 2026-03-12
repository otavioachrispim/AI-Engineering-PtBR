import { useState, useCallback, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED METRICS (live-updating)
// ============================================================
function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min)); }

function generateMetricsSnapshot() {
  var aiLatency = randomInt(250, 600);
  var errorRate = Math.random() > 0.92 ? randomInt(3, 8) : randomInt(0, 2);
  var cacheHit = randomInt(38, 62);
  return {
    uptime: "99." + randomInt(5, 9) + "%",
    reqPerMin: randomInt(12, 35),
    p50: randomInt(30, 80) + "ms",
    p95: randomInt(200, 500) + "ms",
    errorRate: errorRate + "." + randomInt(0, 9) + "%",
    errorColor: errorRate > 3 ? C.red : errorRate > 1 ? C.amber : C.green,
    aiCallsMin: randomInt(3, 12),
    aiLatencyP50: aiLatency + "ms",
    aiLatencyP95: (aiLatency + randomInt(200, 800)) + "ms",
    aiCostHour: "$" + (Math.random() * 0.5 + 0.1).toFixed(2),
    aiCostDay: "$" + (Math.random() * 3 + 1).toFixed(2),
    cacheHit: cacheHit + "%",
    cacheColor: cacheHit < 35 ? C.red : cacheHit < 45 ? C.amber : C.green,
    fallbackRate: (Math.random() > 0.9 ? randomInt(1, 5) : 0) + "%",
    tokensHour: randomInt(8000, 25000),
    activeConns: randomInt(3, 12),
    cpuPct: randomInt(5, 35),
    memMb: randomInt(180, 320),
  };
}

function generateLog() {
  var types = [
    { level: "INFO", color: C.green, msg: "POST /api/leads/classify 200 " + randomInt(250, 500) + "ms", detail: "model=haiku tokens=" + randomInt(200, 400) + " cost=$0.000" + randomInt(2, 5) },
    { level: "INFO", color: C.green, msg: "MCP tool_call buscar_cliente " + randomInt(20, 80) + "ms", detail: "user=Felipe result=1_found" },
    { level: "INFO", color: C.green, msg: "GET /api/obras 200 " + randomInt(30, 90) + "ms", detail: "results=3 cached=false" },
    { level: "WARN", color: C.amber, msg: "AI cache MISS for classify_lead", detail: "key=hash_abc ttl=expired" },
    { level: "INFO", color: C.cyan, msg: "Agent trace completed " + randomInt(800, 2500) + "ms", detail: "agents=2 tools=4 hitl=0 cost=$0.00" + randomInt(3, 8) },
    { level: "INFO", color: C.green, msg: "POST /api/tarefas 201 " + randomInt(50, 150) + "ms", detail: "os=OS-2026-000109" },
    { level: "WARN", color: C.amber, msg: "AI latency above P95 threshold", detail: "model=sonnet latency=2840ms threshold=2000ms" },
    { level: "INFO", color: C.green, msg: "Cache HIT for classify_lead", detail: "key=hash_def saved=$0.0003 saved_ms=340" },
  ];
  var t = types[Math.floor(Math.random() * types.length)];
  return {
    time: new Date().toISOString().slice(11, 19),
    level: t.level,
    color: t.color,
    msg: t.msg,
    detail: t.detail,
  };
}

// ============================================================
// ALERTS
// ============================================================
var ALERTS = [
  { id: 1, severity: "critical", color: C.red, title: "API Anthropic timeout", desc: "3 timeouts consecutivos em 2min. Fallback ATIVADO.", time: "14:23:05", status: "active" },
  { id: 2, severity: "warning", color: C.amber, title: "Custo diario 82% do budget", desc: "Gasto: $8.20 de $10.00. Vision (Sonnet) responsavel por 68%.", time: "13:45:00", status: "active" },
  { id: 3, severity: "warning", color: C.amber, title: "Latencia P95 acima do threshold", desc: "Sonnet P95: 3.2s (threshold: 2s). Possivelmente throttling do provedor.", time: "12:30:15", status: "resolved" },
  { id: 4, severity: "info", color: C.blue, title: "Cache hit rate subiu para 55%", desc: "Nova politica de cache semantico ativa. Economia estimada: 40% dos custos.", time: "10:00:00", status: "resolved" },
  { id: 5, severity: "critical", color: C.red, title: "Agent loop detectado", desc: "Agente executou 15 tool calls sem resolver. Circuit breaker ativado. User: Sandra.", time: "09:15:22", status: "resolved" },
];

// ============================================================
// TRACE EXAMPLE
// ============================================================
var TRACE_EXAMPLE = [
  { indent: 0, name: "POST /api/leads/process", duration: "1,247ms", color: C.text, type: "request" },
  { indent: 1, name: "auth middleware", duration: "3ms", color: C.textDim, type: "middleware" },
  { indent: 1, name: "validateInput", duration: "1ms", color: C.textDim, type: "middleware" },
  { indent: 1, name: "classifyLead", duration: "389ms", color: C.cyan, type: "ai" },
  { indent: 2, name: "cache.check", duration: "2ms", color: C.textDim, type: "cache", result: "MISS" },
  { indent: 2, name: "buildPrompt (classify_lead_v3)", duration: "1ms", color: C.amber, type: "prompt" },
  { indent: 2, name: "anthropic.messages.create", duration: "342ms", color: C.purple, type: "api" },
  { indent: 3, name: "model: haiku-4.5", duration: "", color: C.textDim, type: "detail" },
  { indent: 3, name: "tokens: 280 in, 95 out", duration: "", color: C.textDim, type: "detail" },
  { indent: 3, name: "cost: $0.0003", duration: "", color: C.green, type: "detail" },
  { indent: 2, name: "zodParse (ClassificationSchema)", duration: "1ms", color: C.green, type: "validate", result: "OK" },
  { indent: 2, name: "cache.set (ttl: 24h)", duration: "2ms", color: C.blue, type: "cache" },
  { indent: 1, name: "enrichProfile", duration: "412ms", color: C.cyan, type: "ai" },
  { indent: 2, name: "anthropic.messages.create", duration: "398ms", color: C.purple, type: "api" },
  { indent: 3, name: "tokens: 450 in, 180 out", duration: "", color: C.textDim, type: "detail" },
  { indent: 3, name: "cost: $0.0005", duration: "", color: C.green, type: "detail" },
  { indent: 1, name: "generateWhatsApp", duration: "380ms", color: C.cyan, type: "ai" },
  { indent: 2, name: "cache.check", duration: "1ms", color: C.textDim, type: "cache", result: "MISS" },
  { indent: 2, name: "anthropic.messages.create", duration: "365ms", color: C.purple, type: "api" },
  { indent: 1, name: "prisma.aiCallLog.createMany", duration: "8ms", color: C.textDim, type: "db" },
  { indent: 1, name: "prisma.lead.update", duration: "5ms", color: C.textDim, type: "db" },
  { indent: 0, name: "Response 200 OK", duration: "1,247ms total", color: C.green, type: "response" },
];

// ============================================================
// SCALE SCENARIOS
// ============================================================
var SCALE_SCENARIOS = [
  {
    name: "Atual (5 usuarios)",
    calls: "~50/dia",
    cost: "~R$3/dia",
    infra: "Railway Starter ($5/mo) + Neon Free",
    cache: "In-memory (suficiente)",
    queue: "Nao necessario (sincrono)",
    bottleneck: "Nenhum",
  },
  {
    name: "Crescimento (20 usuarios)",
    calls: "~200/dia",
    cost: "~R$12/dia",
    infra: "Railway Pro ($20/mo) + Neon Pro ($19/mo)",
    cache: "Redis (Upstash free tier)",
    queue: "BullMQ para fotos e relatorios",
    bottleneck: "Vision (Sonnet) custo. Solucao: cache de fotos por hash.",
  },
  {
    name: "Escala (100 usuarios)",
    calls: "~1000/dia",
    cost: "~R$60/dia",
    infra: "Railway + horizontal scaling (2 instancias)",
    cache: "Redis dedicado. Cache semantico com pgvector.",
    queue: "Worker separado para agentes. WebSocket para resultados.",
    bottleneck: "Rate limits da API. Solucao: Batch API + queue com retry.",
  },
  {
    name: "Enterprise (500+ usuarios)",
    calls: "~5000/dia",
    cost: "~R$300/dia",
    infra: "Kubernetes ou Railway com auto-scale",
    cache: "Redis cluster. CDN para assets. pgvector dedicado.",
    queue: "Kafka ou RabbitMQ. Workers por tipo de processamento.",
    bottleneck: "Custo de IA. Solucao: fine-tune modelo menor, batch processing, cache agressivo.",
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function MetricBox(props) {
  var label = props.label;
  var value = props.value;
  var color = props.color || C.text;
  var sub = props.sub;
  return (
    <div style={{
      flex: 1, minWidth: "80px", padding: "10px 8px",
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "8px", textAlign: "center",
    }}>
      <div style={{ fontSize: "16px", fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{label}</div>
      {sub && <div style={{ fontSize: "8px", color: C.textDim }}>{sub}</div>}
    </div>
  );
}

function LiveLogs(props) {
  var logs = props.logs;
  return (
    <div style={{
      background: "#0a0e14", border: "1px solid " + C.border,
      borderRadius: "8px", padding: "8px 10px",
      maxHeight: "200px", overflowY: "auto",
      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
    }}>
      {logs.map(function(log, i) {
        return (
          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px", opacity: i === 0 ? 1 : 0.7 + (1 - i / logs.length) * 0.3 }}>
            <span style={{ color: C.textDim, width: "55px", flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: log.color, fontWeight: 700, width: "35px", flexShrink: 0 }}>{log.level}</span>
            <span style={{ color: C.textMuted }}>{log.msg}</span>
            <span style={{ color: C.textDim, marginLeft: "auto", flexShrink: 0 }}>{log.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function ObservabilityLab() {
  var [activeTab, setActiveTab] = useState("dashboard");
  var [metrics, setMetrics] = useState(generateMetricsSnapshot);
  var [logs, setLogs] = useState(function() {
    var initial = [];
    for (var i = 0; i < 10; i++) initial.push(generateLog());
    return initial;
  });
  var [tick, setTick] = useState(0);

  // Live update every 3 seconds
  useEffect(function() {
    var interval = setInterval(function() {
      setMetrics(generateMetricsSnapshot());
      setLogs(function(prev) { return [generateLog()].concat(prev).slice(0, 20); });
      setTick(function(t) { return t + 1; });
    }, 3000);
    return function() { clearInterval(interval); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.cyan, padding: "4px 10px", borderRadius: "4px",
            background: C.cyan + "12", border: "1px solid " + C.cyan + "33",
          }}>Cap 6 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Observabilidade e Escala
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Metricas ao vivo | Logs | Alertas | Traces | Estrategias de escala
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "dashboard", label: "Dashboard Live" },
            { id: "alerts", label: "Alertas (" + ALERTS.filter(function(a) { return a.status === "active"; }).length + ")" },
            { id: "traces", label: "Traces" },
            { id: "scale", label: "Escala" },
          ].map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                fontSize: "10px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                background: activeTab === tab.id ? C.surfaceAlt : "transparent",
                color: activeTab === tab.id ? C.text : C.textDim,
              }}>{tab.label}</button>
            );
          })}
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: C.green,
                animation: "none",
                boxShadow: "0 0 6px " + C.green,
              }} />
              <span style={{ fontSize: "10px", color: C.green, fontWeight: 700 }}>LIVE</span>
              <span style={{ fontSize: "9px", color: C.textDim }}>Atualiza a cada 3s | Tick #{tick}</span>
            </div>

            {/* Infra metrics */}
            <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>INFRAESTRUTURA</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
              <MetricBox label="Uptime" value={metrics.uptime} color={C.green} />
              <MetricBox label="Req/min" value={metrics.reqPerMin} />
              <MetricBox label="P50" value={metrics.p50} color={C.green} />
              <MetricBox label="P95" value={metrics.p95} color={parseInt(metrics.p95) > 400 ? C.amber : C.green} />
              <MetricBox label="Erro" value={metrics.errorRate} color={metrics.errorColor} />
              <MetricBox label="CPU" value={metrics.cpuPct + "%"} color={metrics.cpuPct > 70 ? C.red : C.green} />
              <MetricBox label="RAM" value={metrics.memMb + "MB"} />
              <MetricBox label="Conns" value={metrics.activeConns} />
            </div>

            {/* AI metrics */}
            <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>INTELIGENCIA ARTIFICIAL</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
              <MetricBox label="AI calls/min" value={metrics.aiCallsMin} color={C.cyan} />
              <MetricBox label="AI P50" value={metrics.aiLatencyP50} color={parseInt(metrics.aiLatencyP50) > 500 ? C.amber : C.cyan} />
              <MetricBox label="AI P95" value={metrics.aiLatencyP95} color={parseInt(metrics.aiLatencyP95) > 2000 ? C.red : C.amber} />
              <MetricBox label="Custo/hora" value={metrics.aiCostHour} color={C.amber} />
              <MetricBox label="Custo/dia" value={metrics.aiCostDay} color={parseFloat(metrics.aiCostDay.slice(1)) > 8 ? C.red : C.amber} />
              <MetricBox label="Cache hit" value={metrics.cacheHit} color={metrics.cacheColor} />
              <MetricBox label="Fallback" value={metrics.fallbackRate} color={parseInt(metrics.fallbackRate) > 0 ? C.red : C.green} />
              <MetricBox label="Tokens/h" value={(metrics.tokensHour / 1000).toFixed(1) + "k"} />
            </div>

            {/* Live logs */}
            <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>LOGS AO VIVO</div>
            <LiveLogs logs={logs} />
          </div>
        )}

        {/* ALERTS */}
        {activeTab === "alerts" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Alertas baseados em thresholds. Criticos notificam Slack + SMS. Warnings notificam Slack. Info aparece no dashboard.
            </p>
            {ALERTS.map(function(alert) {
              var isActive = alert.status === "active";
              return (
                <div key={alert.id} style={{
                  display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "10px",
                  marginBottom: "8px", alignItems: "flex-start",
                  background: isActive ? alert.color + "08" : C.surface,
                  border: "1px solid " + (isActive ? alert.color + "22" : C.border),
                  opacity: isActive ? 1 : 0.6,
                }}>
                  <div style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: alert.color, flexShrink: 0, marginTop: "4px",
                    boxShadow: isActive ? "0 0 8px " + alert.color : "none",
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                        background: alert.color + "15", color: alert.color,
                      }}>{alert.severity.toUpperCase()}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: isActive ? C.text : C.textMuted }}>{alert.title}</span>
                      <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{alert.time}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.5 }}>{alert.desc}</div>
                  </div>
                  <span style={{
                    fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "3px",
                    background: isActive ? C.red + "15" : C.green + "15",
                    color: isActive ? C.red : C.green,
                  }}>{isActive ? "ACTIVE" : "RESOLVED"}</span>
                </div>
              );
            })}

            {/* Threshold config */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginTop: "12px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>THRESHOLDS CONFIGURADOS</div>
              {[
                { metric: "API IA indisponivel", threshold: "> 2min", severity: "Critical", channel: "Slack + SMS" },
                { metric: "Taxa de erro", threshold: "> 5% por 5min", severity: "Critical", channel: "Slack + SMS" },
                { metric: "Custo diario", threshold: "> 80% budget", severity: "Warning", channel: "Slack" },
                { metric: "AI latencia P95", threshold: "> 3s por 10min", severity: "Warning", channel: "Slack" },
                { metric: "Cache hit rate", threshold: "< 30%", severity: "Warning", channel: "Slack" },
                { metric: "HITL rate", threshold: "> 40%", severity: "Warning", channel: "Dashboard" },
                { metric: "Agent loop", threshold: "> 15 tool calls", severity: "Critical", channel: "Slack" },
              ].map(function(t, i) {
                var sc = t.severity === "Critical" ? C.red : t.severity === "Warning" ? C.amber : C.blue;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 0", fontSize: "10px",
                    borderBottom: i < 6 ? "1px solid " + C.border : "none",
                  }}>
                    <span style={{ color: C.textMuted, flex: 1 }}>{t.metric}</span>
                    <span style={{ color: C.amber, fontWeight: 600 }}>{t.threshold}</span>
                    <span style={{ fontSize: "8px", color: sc, fontWeight: 700 }}>{t.severity}</span>
                    <span style={{ fontSize: "8px", color: C.textDim }}>{t.channel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TRACES */}
        {activeTab === "traces" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Trace completo de um request POST /api/leads/process. Mostra cada etapa com duracao, modelo, tokens e custo.
            </p>
            <div style={{
              background: "#0a0e14", border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px",
            }}>
              <div style={{
                padding: "6px 10px", marginBottom: "10px", borderRadius: "6px",
                background: C.surfaceAlt, fontSize: "10px", color: C.textDim,
                display: "flex", gap: "12px",
              }}>
                <span>Trace ID: <span style={{ color: C.cyan }}>tr_00421</span></span>
                <span>Total: <span style={{ color: C.amber }}>1,247ms</span></span>
                <span>AI: <span style={{ color: C.purple }}>3 calls</span></span>
                <span>Cost: <span style={{ color: C.green }}>$0.0011</span></span>
              </div>
              {TRACE_EXAMPLE.map(function(span, i) {
                var paddingLeft = span.indent * 20;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    paddingLeft: paddingLeft + "px",
                    marginBottom: "2px", fontSize: "10px",
                  }}>
                    {span.indent > 0 && <span style={{ color: C.border }}>{"├─"}</span>}
                    <span style={{
                      color: span.type === "ai" ? C.cyan : span.type === "api" ? C.purple : span.type === "cache" ? C.blue : span.type === "validate" ? C.green : span.color,
                      fontWeight: span.type === "request" || span.type === "response" ? 700 : 400,
                    }}>{span.name}</span>
                    {span.result && (
                      <span style={{
                        fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px",
                        background: span.result === "OK" || span.result === "HIT" ? C.green + "15" : C.amber + "15",
                        color: span.result === "OK" || span.result === "HIT" ? C.green : C.amber,
                      }}>{span.result}</span>
                    )}
                    {span.duration && <span style={{ color: C.textDim, marginLeft: "auto", fontSize: "9px" }}>{span.duration}</span>}
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>Analise do trace:</span> 3 chamadas de IA totalizam 1,105ms (89% do request). classifyLead usa cache com TTL 24h. enrichProfile e generateWhatsApp nao tem cache — oportunidade de otimizacao. Custo total $0.0011 dentro do budget ($0.05/request).
            </div>
          </div>
        )}

        {/* SCALE */}
        {activeTab === "scale" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Estrategia de escala progressiva. Comece simples, escale conforme a demanda.
            </p>
            {SCALE_SCENARIOS.map(function(s, i) {
              var isNow = i === 0;
              var colors = [C.green, C.cyan, C.amber, C.purple];
              return (
                <div key={i} style={{
                  background: C.surface, border: "1px solid " + (isNow ? C.green + "33" : C.border),
                  borderRadius: "10px", padding: "16px", marginBottom: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: colors[i] }}>{s.name}</span>
                    {isNow && <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "3px", background: C.green + "15", color: C.green }}>ATUAL</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px" }}>
                    {[
                      { label: "Chamadas IA", value: s.calls },
                      { label: "Custo IA", value: s.cost },
                      { label: "Infra", value: s.infra },
                      { label: "Cache", value: s.cache },
                      { label: "Queue", value: s.queue },
                      { label: "Gargalo", value: s.bottleneck },
                    ].map(function(item) {
                      return (
                        <div key={item.label}>
                          <span style={{ color: C.textDim, fontSize: "9px" }}>{item.label}: </span>
                          <span style={{ color: C.textMuted }}>{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{
              background: C.green + "08", border: "1px solid " + C.green + "22",
              borderRadius: "10px", padding: "14px", fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>Regra de ouro:</span> escale quando o gargalo aparecer, nao antes. O Costa Lima com 5 usuarios nao precisa de Redis, Kafka ou Kubernetes. Precisa de bons logs, bom cache in-memory, e monitoramento de custos. Quando ultrapassar 200 calls/dia, adicione Redis. Quando ultrapassar 1000, adicione workers. Cada passo resolve o gargalo atual sem over-engineering.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
