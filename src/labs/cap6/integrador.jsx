import { useState, useEffect, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

function ri(min, max) { return min + Math.floor(Math.random() * (max - min)); }

// ============================================================
// LIVE SYSTEM STATUS
// ============================================================
function genStatus() {
  var aiLat = ri(250, 650);
  var errRate = Math.random() > 0.9 ? ri(3, 7) : ri(0, 2);
  var cacheHit = ri(40, 62);
  var fallback = Math.random() > 0.92;
  return {
    uptime: "99." + ri(5, 9) + "%",
    reqMin: ri(12, 35),
    p95: ri(180, 500),
    errRate: errRate,
    aiCallsMin: ri(3, 14),
    aiP50: aiLat,
    aiP95: aiLat + ri(200, 900),
    cacheHit: cacheHit,
    fallback: fallback,
    costToday: (Math.random() * 3 + 1).toFixed(2),
    costMonth: (Math.random() * 20 + 50).toFixed(2),
    tokensH: ri(8000, 28000),
    cpu: ri(5, 40),
    mem: ri(180, 330),
    dbConns: ri(3, 12),
    healthy: errRate < 5 && !fallback,
  };
}

function genLog() {
  var pool = [
    { lvl: "INFO", c: C.green, msg: "POST /api/leads/classify 200 " + ri(250, 500) + "ms", d: "haiku tok=" + ri(200, 400) },
    { lvl: "INFO", c: C.green, msg: "MCP buscar_cliente " + ri(20, 80) + "ms", d: "user=Felipe" },
    { lvl: "INFO", c: C.cyan, msg: "Agent trace " + ri(800, 2500) + "ms", d: "agents=2 tools=" + ri(3, 6) },
    { lvl: "WARN", c: C.amber, msg: "AI cache MISS classify_lead", d: "ttl=expired" },
    { lvl: "INFO", c: C.green, msg: "Cache HIT classify_lead", d: "saved=$0.0003" },
    { lvl: "INFO", c: C.green, msg: "GET /api/obras 200 " + ri(30, 90) + "ms", d: "results=3" },
    { lvl: "WARN", c: C.amber, msg: "AI latency P95 above threshold", d: "sonnet " + ri(2000, 3500) + "ms" },
    { lvl: "INFO", c: C.green, msg: "POST /api/tarefas 201 " + ri(50, 150) + "ms", d: "OS-2026-" + ri(100, 115) },
  ];
  var p = pool[Math.floor(Math.random() * pool.length)];
  return { time: new Date().toISOString().slice(11, 19), lvl: p.lvl, c: p.c, msg: p.msg, d: p.d };
}

// ============================================================
// PIPELINE DATA
// ============================================================
var DEPLOY_HISTORY = [
  { version: "v1.26.0", time: "14:22", status: "success", stages: 11, duration: "2m48s", aiTests: "PASS", cost: "$0.014" },
  { version: "v1.25.1", time: "10:05", status: "success", stages: 11, duration: "2m52s", aiTests: "PASS", cost: "$0.012" },
  { version: "v1.25.0", time: "08:30", status: "failed", stages: 5, duration: "1m20s", aiTests: "FAIL (golden #3)", cost: "$0.008" },
  { version: "v1.24.0", time: "ontem", status: "success", stages: 11, duration: "3m05s", aiTests: "PASS", cost: "$0.015" },
  { version: "v1.23.2", time: "2 dias", status: "success", stages: 11, duration: "2m55s", aiTests: "PASS", cost: "$0.013" },
];

// ============================================================
// COMPLIANCE DATA
// ============================================================
var COMPLIANCE = {
  score: 65,
  categories: [
    { name: "Dados Pessoais", ok: 3, partial: 1, pending: 0, total: 4 },
    { name: "Base Legal", ok: 1, partial: 0, pending: 3, total: 4 },
    { name: "Provedor IA", ok: 2, partial: 1, pending: 1, total: 4 },
    { name: "Logging", ok: 3, partial: 1, pending: 0, total: 4 },
    { name: "Seguranca", ok: 4, partial: 1, pending: 1, total: 6 },
    { name: "Direitos Titular", ok: 1, partial: 0, pending: 3, total: 4 },
  ],
  alerts: [
    { text: "DPA com Anthropic nao assinado", severity: "alto" },
    { text: "Politica de privacidade nao menciona IA", severity: "alto" },
    { text: "Opt-in para analise de fotos pendente", severity: "medio" },
    { text: "Validacao de output nao implementada", severity: "medio" },
  ],
};

// ============================================================
// COST DATA
// ============================================================
var COST = {
  today: { total: 2.27, budget: 10.00, haiku: 0.42, sonnet: 1.85 },
  month: { total: 68.40, budget: 150.00 },
  byFeature: [
    { name: "Vision (fotos)", cost: 1.28, pct: 56, model: "Sonnet" },
    { name: "Agent pipeline", cost: 0.78, pct: 34, model: "Mixed" },
    { name: "Classificar leads", cost: 0.71, pct: 31, model: "Haiku" },
    { name: "Respostas WhatsApp", cost: 0.50, pct: 22, model: "Haiku" },
    { name: "Chat copiloto", cost: 0.27, pct: 12, model: "Haiku" },
  ],
  economy: { vendedor: 2200, coordenador: 1320, conversao: 10000, retrabalho: 500 },
  roi: 1847,
  optimizations: { cacheExact: 38, cacheImage: 8, modelRouting: 15, totalActive: 53 },
};

// ============================================================
// ALERTS
// ============================================================
var SYSTEM_ALERTS = [
  { id: 1, sev: "critical", c: C.red, title: "API timeout 3x consecutivo", desc: "Fallback ATIVADO. Classificacao via regras.", time: "14:23", active: true },
  { id: 2, sev: "warning", c: C.amber, title: "Custo diario 82% do budget", desc: "Vision (Sonnet) responsavel por 68%.", time: "13:45", active: true },
  { id: 3, sev: "info", c: C.green, title: "Deploy v1.26.0 sucesso", desc: "11 stages, AI tests PASS, health OK.", time: "14:22", active: false },
  { id: 4, sev: "warning", c: C.amber, title: "Cache hit rate 38% (< 45%)", desc: "Novas queries nao cacheadas. Verificar TTL.", time: "12:10", active: true },
];

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge(props) {
  var healthy = props.healthy;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "20px",
      background: healthy ? C.green + "15" : C.red + "15",
      border: "1px solid " + (healthy ? C.green : C.red) + "33",
    }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: healthy ? C.green : C.red,
        boxShadow: "0 0 6px " + (healthy ? C.green : C.red),
      }} />
      <span style={{ fontSize: "10px", fontWeight: 700, color: healthy ? C.green : C.red }}>
        {healthy ? "HEALTHY" : "DEGRADED"}
      </span>
    </div>
  );
}

function MetricMini(props) {
  return (
    <div style={{
      padding: "8px 6px", borderRadius: "6px",
      background: C.surface, border: "1px solid " + C.border,
      textAlign: "center", minWidth: "70px",
    }}>
      <div style={{ fontSize: "14px", fontWeight: 800, color: props.color || C.text }}>{props.value}</div>
      <div style={{ fontSize: "7px", color: C.textDim, marginTop: "1px" }}>{props.label}</div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function DevOpsCommandCenter() {
  var [activeTab, setActiveTab] = useState("overview");
  var [status, setStatus] = useState(genStatus);
  var [logs, setLogs] = useState(function() {
    var l = [];
    for (var i = 0; i < 12; i++) l.push(genLog());
    return l;
  });
  var [tick, setTick] = useState(0);

  useEffect(function() {
    var iv = setInterval(function() {
      setStatus(genStatus());
      setLogs(function(p) { return [genLog()].concat(p).slice(0, 15); });
      setTick(function(t) { return t + 1; });
    }, 3000);
    return function() { clearInterval(iv); };
  }, []);

  var activeAlerts = SYSTEM_ALERTS.filter(function(a) { return a.active; }).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "940px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
              color: C.blue, padding: "4px 10px", borderRadius: "4px",
              background: C.blue + "12", border: "1px solid " + C.blue + "33",
            }}>Projeto Integrador - Cap 6</span>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 2px", color: C.text }}>
              DevOps Command Center
            </h1>
            <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>
              Pipeline | Observabilidade | Compliance | Custos — tudo ao vivo
            </p>
          </div>
          <StatusBadge healthy={status.healthy} />
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "overview", label: "Visao Geral" },
            { id: "pipeline", label: "Pipeline" },
            { id: "compliance", label: "Compliance (" + COMPLIANCE.score + "%)" },
            { id: "costs", label: "Custos & ROI" },
            { id: "arch", label: "Arquitetura" },
          ].map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{
                flex: 1, padding: "9px", border: "none", borderRadius: "8px",
                fontSize: "10px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                background: activeTab === tab.id ? C.surfaceAlt : "transparent",
                color: activeTab === tab.id ? C.text : C.textDim,
              }}>{tab.label}</button>
            );
          })}
        </div>

        {/* =================== OVERVIEW =================== */}
        {activeTab === "overview" && (
          <div>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green, boxShadow: "0 0 6px " + C.green }} />
              <span style={{ fontSize: "10px", color: C.green, fontWeight: 700 }}>LIVE</span>
              <span style={{ fontSize: "9px", color: C.textDim }}>tick #{tick} | 3s refresh</span>
            </div>

            {/* Top metrics row */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "12px", flexWrap: "wrap" }}>
              <MetricMini label="Uptime" value={status.uptime} color={C.green} />
              <MetricMini label="Req/min" value={status.reqMin} />
              <MetricMini label="P95" value={status.p95 + "ms"} color={status.p95 > 400 ? C.amber : C.green} />
              <MetricMini label="Erro" value={status.errRate + "%"} color={status.errRate > 3 ? C.red : C.green} />
              <MetricMini label="AI/min" value={status.aiCallsMin} color={C.cyan} />
              <MetricMini label="AI P50" value={status.aiP50 + "ms"} color={C.cyan} />
              <MetricMini label="Cache" value={status.cacheHit + "%"} color={status.cacheHit < 40 ? C.red : C.green} />
              <MetricMini label="$/dia" value={"$" + status.costToday} color={parseFloat(status.costToday) > 8 ? C.red : C.amber} />
              <MetricMini label="$/mes" value={"$" + status.costMonth} color={C.amber} />
              <MetricMini label="Fallback" value={status.fallback ? "ON" : "OFF"} color={status.fallback ? C.red : C.green} />
            </div>

            {/* Alerts + Logs side by side */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
              {/* Alerts */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>
                  ALERTAS ({activeAlerts} ativos)
                </div>
                {SYSTEM_ALERTS.map(function(a) {
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 10px", borderRadius: "6px", marginBottom: "4px",
                      background: a.active ? a.c + "06" : C.surface,
                      border: "1px solid " + (a.active ? a.c + "18" : C.border),
                      opacity: a.active ? 1 : 0.5,
                      fontSize: "10px",
                    }}>
                      <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: a.c, boxShadow: a.active ? "0 0 4px " + a.c : "none",
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: a.active ? C.text : C.textDim }}>{a.title}</div>
                        <div style={{ fontSize: "9px", color: C.textDim }}>{a.desc}</div>
                      </div>
                      <span style={{ fontSize: "8px", color: C.textDim }}>{a.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Logs */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>LOGS AO VIVO</div>
                <div style={{
                  background: "#0a0e14", borderRadius: "8px", padding: "8px",
                  border: "1px solid " + C.border,
                  maxHeight: "180px", overflowY: "auto", fontSize: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {logs.map(function(l, i) {
                    return (
                      <div key={i} style={{ display: "flex", gap: "4px", marginBottom: "1px", opacity: 0.6 + (1 - i / logs.length) * 0.4 }}>
                        <span style={{ color: C.textDim, width: "50px", flexShrink: 0 }}>{l.time}</span>
                        <span style={{ color: l.c, fontWeight: 700, width: "30px", flexShrink: 0 }}>{l.lvl}</span>
                        <span style={{ color: C.textMuted, flex: 1 }}>{l.msg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick panels */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Deploy */}
              <div style={{ flex: 1, minWidth: "200px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>ULTIMO DEPLOY</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: C.green, marginBottom: "2px" }}>{DEPLOY_HISTORY[0].version}</div>
                <div style={{ fontSize: "10px", color: C.textMuted }}>{DEPLOY_HISTORY[0].stages} stages | {DEPLOY_HISTORY[0].duration} | AI: {DEPLOY_HISTORY[0].aiTests}</div>
              </div>

              {/* Compliance */}
              <div style={{ flex: 1, minWidth: "200px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>COMPLIANCE LGPD</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: COMPLIANCE.score >= 80 ? C.green : C.amber, marginBottom: "2px" }}>{COMPLIANCE.score}%</div>
                <div style={{ fontSize: "10px", color: C.textMuted }}>{COMPLIANCE.alerts.length} pendencias | DPA: pendente</div>
              </div>

              {/* ROI */}
              <div style={{ flex: 1, minWidth: "200px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>ROI MENSAL</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: C.green, marginBottom: "2px" }}>{COST.roi}%</div>
                <div style={{ fontSize: "10px", color: C.textMuted }}>R$720 custo | R$14.020 economia</div>
              </div>
            </div>
          </div>
        )}

        {/* =================== PIPELINE =================== */}
        {activeTab === "pipeline" && (
          <div>
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>HISTORICO DE DEPLOYS</div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {DEPLOY_HISTORY.map(function(d, i) {
                var sc = d.status === "success" ? C.green : C.red;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px", fontSize: "11px",
                    borderBottom: i < DEPLOY_HISTORY.length - 1 ? "1px solid " + C.border : "none",
                    background: d.status === "failed" ? C.red + "04" : "transparent",
                  }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: sc, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: C.text, width: "65px" }}>{d.version}</span>
                    <span style={{ color: C.textDim, width: "50px" }}>{d.time}</span>
                    <span style={{ color: C.textMuted, flex: 1 }}>{d.stages} stages | {d.duration}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                      background: d.aiTests.includes("PASS") ? C.green + "15" : C.red + "15",
                      color: d.aiTests.includes("PASS") ? C.green : C.red,
                    }}>AI: {d.aiTests}</span>
                    <span style={{ color: C.textDim, fontSize: "10px" }}>{d.cost}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "3px",
                      background: sc + "15", color: sc,
                    }}>{d.status.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>

            {/* Pipeline stages visualization */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, margin: "16px 0 8px" }}>STAGES DO PIPELINE (v1.26.0)</div>
            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
              {["Install", "Lint", "Types", "Unit", "AI Tests", "Integration", "E2E", "Build", "Deploy", "Health", "Notify"].map(function(name, i) {
                var isAI = name === "AI Tests" || name === "E2E" || name === "Health";
                return (
                  <div key={i} style={{
                    flex: 1, minWidth: "60px", padding: "8px 4px",
                    borderRadius: "6px", textAlign: "center",
                    background: C.green + "12", border: "1px solid " + C.green + "22",
                    fontSize: "9px", fontWeight: 600,
                    color: isAI ? C.cyan : C.green,
                  }}>
                    {name}
                    {isAI && <div style={{ fontSize: "7px", color: C.cyan, marginTop: "2px" }}>IA</div>}
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>Stages de IA no pipeline: </span>
              AI Tests (golden tests + schema + cost guards + fallback), E2E (12 cenarios com Playwright incluindo chat e busca semantica), Health Check (verifica API de IA + MCP + fallback). Deploy bloqueado se AI Tests falhar.
            </div>
          </div>
        )}

        {/* =================== COMPLIANCE =================== */}
        {activeTab === "compliance" && (
          <div>
            {/* Score */}
            <div style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "14px", borderRadius: "10px", marginBottom: "14px",
              background: C.amber + "08", border: "1px solid " + C.amber + "22",
            }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: C.amber }}>{COMPLIANCE.score}%</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>Score LGPD + IA</div>
                <div style={{ fontSize: "10px", color: C.textMuted }}>26 itens avaliados em 6 categorias</div>
              </div>
            </div>

            {/* Categories */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {COMPLIANCE.categories.map(function(cat) {
                var pct = Math.round((cat.ok + cat.partial * 0.5) / cat.total * 100);
                var color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red;
                return (
                  <div key={cat.name} style={{
                    padding: "10px 14px", borderRadius: "8px",
                    background: C.surface, border: "1px solid " + C.border,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: C.text }}>{cat.name}</span>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: color }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: "2px" }} />
                    </div>
                    <div style={{ fontSize: "8px", color: C.textDim, marginTop: "4px" }}>
                      {cat.ok} OK | {cat.partial} parcial | {cat.pending} pendente
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending alerts */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>PENDENCIAS PRIORITARIAS</div>
            {COMPLIANCE.alerts.map(function(a, i) {
              var sc = a.severity === "alto" ? C.red : C.amber;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 12px", borderRadius: "6px", marginBottom: "4px",
                  background: sc + "06", border: "1px solid " + sc + "18",
                  fontSize: "11px",
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc, flexShrink: 0 }} />
                  <span style={{ color: C.text, flex: 1 }}>{a.text}</span>
                  <span style={{
                    fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                    background: sc + "15", color: sc,
                  }}>{a.severity.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* =================== COSTS =================== */}
        {activeTab === "costs" && (
          <div>
            {/* Top metrics */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Custo hoje", value: "$" + COST.today.total, sub: (COST.today.total / COST.today.budget * 100).toFixed(0) + "% do budget", color: COST.today.total > COST.today.budget * 0.8 ? C.amber : C.green },
                { label: "Custo mes", value: "$" + COST.month.total, sub: (COST.month.total / COST.month.budget * 100).toFixed(0) + "% do budget", color: C.amber },
                { label: "Economia/mes", value: "R$14.020", sub: "tempo + conversao", color: C.green },
                { label: "ROI", value: COST.roi + "%", sub: "R$720 custo vs R$14k eco", color: C.green },
                { label: "Otimizacoes ativas", value: "-" + COST.optimizations.totalActive + "%", sub: "3 de 7 habilitadas", color: C.cyan },
              ].map(function(m) {
                return (
                  <div key={m.label} style={{
                    flex: 1, minWidth: "100px", padding: "12px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{m.label}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{m.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* By feature + Economy */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "260px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>CUSTO POR FEATURE (hoje)</div>
                {COST.byFeature.map(function(f) {
                  return (
                    <div key={f.name} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "5px 0", fontSize: "10px",
                    }}>
                      <span style={{ color: C.textMuted, flex: 1 }}>{f.name}</span>
                      <div style={{ width: "60px", height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: (f.cost / 1.5 * 100) + "%", height: "100%", background: C.cyan, borderRadius: "2px" }} />
                      </div>
                      <span style={{ color: C.amber, fontWeight: 700, width: "40px", textAlign: "right" }}>${f.cost.toFixed(2)}</span>
                      <span style={{ color: C.textDim, fontSize: "8px", width: "40px" }}>{f.model}</span>
                    </div>
                  );
                })}
                <div style={{
                  marginTop: "8px", paddingTop: "6px", borderTop: "1px solid " + C.border,
                  fontSize: "10px", color: C.amber,
                }}>
                  Insight: Vision = 56% do custo, 4% das chamadas. Cache de imagem reduziria ~$0.35/dia.
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "260px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>ECONOMIA GERADA (mensal)</div>
                {[
                  { name: "Vendedor: 2h/dia", value: COST.economy.vendedor },
                  { name: "Coordenador: 1h/dia", value: COST.economy.coordenador },
                  { name: "Conversao +15%", value: COST.economy.conversao },
                  { name: "Reducao retrabalho", value: COST.economy.retrabalho },
                ].map(function(e) {
                  return (
                    <div key={e.name} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0", fontSize: "10px", borderBottom: "1px solid " + C.border,
                    }}>
                      <span style={{ color: C.textMuted }}>{e.name}</span>
                      <span style={{ color: C.green, fontWeight: 700 }}>R${e.value.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  paddingTop: "8px", fontSize: "12px", fontWeight: 800,
                }}>
                  <span style={{ color: C.text }}>TOTAL</span>
                  <span style={{ color: C.green }}>R$14.020/mes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== ARCHITECTURE =================== */}
        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.blue,
                text: "Cap 6 completo integrado:\n\nM1 (CI/CD): Pipeline com 11 stages incluindo AI Tests, E2E e Health Check. Deploy bloqueado se golden tests falham.\n\nM2 (Observabilidade): Metricas ao vivo (3s refresh), logs streaming, alertas com severidade, status HEALTHY/DEGRADED.\n\nM3 (Compliance): Score LGPD 65% com 6 categorias, 4 pendencias prioritarias, mapeamento de dados por feature.\n\nM4 (Custos): ROI 1.847%, custo $2.27/dia, economia R$14.020/mes, otimizacoes ativas -53%.\n\nTudo num unico painel que o admin veria em /administracao/devops.",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: "1. OVERVIEW: observe as metricas mudando a cada 3s. Note quando fallback ativa (vermelho).\n\n2. PIPELINE: compare v1.25.0 (FAILED - golden #3) com v1.26.0 (PASS). O golden test impediu deploy com prompt quebrado.\n\n3. COMPLIANCE: clique na aba e veja que 'Base Legal' e 'Direitos Titular' sao as categorias mais fracas. As 4 pendencias no rodape sao o plano de acao.\n\n4. COSTS: compare custo de Vision ($1.28) vs Chat ($0.27). Vision e 5x mais caro. Cache de imagem e a otimizacao mais impactante.\n\n5. Volte pra OVERVIEW e observe: alertas ativos, ultimo deploy, compliance score e ROI — tudo visivel em 5 segundos.",
              },
              {
                title: "Implementacao no Costa Lima",
                color: C.green,
                text: "FRONTEND:\n  /administracao/devops -> este painel (Recharts + SSE)\n  Metricas via endpoint /api/admin/metrics\n  Logs via WebSocket /api/admin/logs\n\nBACKEND:\n  Metricas: middleware Express que registra em AICallLog\n  Alertas: cron job a cada 1min verifica thresholds\n  Health: GET /health com verificacao de DB + AI + MCP\n\nCI/CD:\n  GitHub Actions com stages de IA\n  Golden tests em tests/ai/golden/\n  Rollback automatico via Railway webhook\n\nCOMPLIANCE:\n  Checklist em Notion/Google Sheet (revisado mensalmente)\n  TTL automatico via Prisma cron job (limpa logs antigos)\n\nCUSTOS:\n  Dashboard com dados de AICallLog agregados por periodo\n  Budget alerts via Slack webhook",
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
