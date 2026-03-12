import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// PRODUCT HEALTH SCORE
// ============================================================
var HEALTH = {
  adoption: { value: 74, target: 70, label: "Adocao", unit: "%" },
  accuracy: { value: 93, target: 90, label: "Acuracia", unit: "%" },
  responseTime: { value: 5, target: 15, label: "Resp. lead", unit: "min", inverted: true },
  roi: { value: 1847, target: 500, label: "ROI", unit: "%" },
  costPerLead: { value: 0.03, target: 0.05, label: "Custo/lead", unit: "R$", inverted: true },
  ethicsScore: { value: 3.8, target: 3.5, label: "Score etico", unit: "/5" },
  compliance: { value: 65, target: 80, label: "LGPD", unit: "%" },
  drift: { value: -0.3, target: -1.0, label: "Drift", unit: "%/sem", inverted: true },
};

function metHealth(m) {
  if (m.inverted) return m.value <= m.target;
  return m.value >= m.target;
}

// ============================================================
// FEATURES WITH FULL DATA
// ============================================================
var FEATURES = [
  { id: "classify", name: "Classificar leads", rice: 1620, status: "production", phase: 1, accuracy: 93, adoption: 74, costMonth: 15, econMonth: 2200, ethicsAvg: 4.3, feedback: { correct: 42, corrected: 3 } },
  { id: "whatsapp", name: "Resposta WhatsApp", rice: 850, status: "production", phase: 1, accuracy: 88, adoption: 71, costMonth: 30, econMonth: 1800, ethicsAvg: 3.5, feedback: { correct: 35, corrected: 5 } },
  { id: "copilot", name: "Copiloto MCP", rice: 347, status: "production", phase: 1, accuracy: null, adoption: 45, costMonth: 45, econMonth: 1320, ethicsAvg: 4.0, feedback: { correct: 28, corrected: 2 } },
  { id: "smartfill", name: "Smart fill orcamento", rice: 192, status: "pilot", phase: 2, accuracy: 82, adoption: 30, costMonth: 5, econMonth: 500, ethicsAvg: 4.2, feedback: { correct: 8, corrected: 2 } },
  { id: "agent", name: "Agente multi-step", rice: 188, status: "development", phase: 2, accuracy: null, adoption: 0, costMonth: 0, econMonth: 0, ethicsAvg: 2.7, feedback: null },
  { id: "vision", name: "Analise foto", rice: 90, status: "prototype", phase: 2, accuracy: 87, adoption: 0, costMonth: 0, econMonth: 0, ethicsAvg: 3.5, feedback: null },
  { id: "search", name: "Busca semantica", rice: 175, status: "planned", phase: 3, accuracy: null, adoption: 0, costMonth: 0, econMonth: 0, ethicsAvg: 4.0, feedback: null },
];

var STATUS_MAP = {
  production: { color: C.green, label: "PROD", order: 1 },
  pilot: { color: C.amber, label: "PILOT", order: 2 },
  development: { color: C.cyan, label: "DEV", order: 3 },
  prototype: { color: C.purple, label: "PROTO", order: 4 },
  planned: { color: C.textDim, label: "PLAN", order: 5 },
};

// ============================================================
// WEEKLY SNAPSHOT
// ============================================================
var WEEKLY = [
  { week: "S1", accuracy: 85, adoption: 45, leads: 180, cost: 42, corrections: 12 },
  { week: "S2", accuracy: 88, adoption: 58, leads: 195, cost: 48, corrections: 9 },
  { week: "S3", accuracy: 90, adoption: 65, leads: 210, cost: 55, corrections: 7 },
  { week: "S4", accuracy: 91, adoption: 68, leads: 225, cost: 58, corrections: 6 },
  { week: "S5", accuracy: 92, adoption: 72, leads: 215, cost: 52, corrections: 4 },
  { week: "S6", accuracy: 93, adoption: 74, leads: 230, cost: 55, corrections: 3 },
];

// ============================================================
// COMMUNICATION TEMPLATES
// ============================================================
var REPORTS = {
  executive: "RESUMO EXECUTIVO - IA no Costa Lima (Marco 2026)\n\nRESULTADOS:\n- Leads respondidos em 5min (antes: 2h)\n- Conversao: 17.5% (antes: 12%)\n- 3 features em producao, 1 em piloto\n\nFINANCEIRO:\n- Custo IA: R$720/mes\n- Economia gerada: R$14.020/mes\n- ROI: 1.847%\n\nPROXIMOS PASSOS:\n- Abril: analise de fotos (economia adicional ~R$2k/mes)\n- Maio: busca inteligente\n\nO investimento se pagou na primeira semana.",
  team: "ATUALIZACAO DO TIME - IA (Semana 6)\n\nO QUE MELHOROU:\n- Acuracia subiu para 93% (meta era 90 - atingida!)\n- Felipe usa copiloto em 74% das interacoes\n- 3 correcoes na semana (menor numero ate agora)\n\nPROBLEMAS:\n- Leads em ingles ainda classificados errado (corrigindo)\n- Sandra nao esta usando copiloto (vamos conversar)\n\nPEDIDOS:\n- Felipe: 'quero smart fill no orcamento' -> em piloto\n- Sandra: 'quero relatorio automatico segunda de manha' -> planejado",
  technical: "METRICAS TECNICAS - Semana 6\n\nCLASSIFICACAO: F1 91.4%, P 94%, R 89%, drift -0.3%/sem\nLATENCIA: Haiku P50 340ms, P95 580ms | Sonnet P50 1.1s\nCACHE: hit rate 48% (exato) + 12% (semantico) = 60%\nCUSTO: $2.27/dia ($68/mes) | Vision 56% do custo\nCI/CD: 14 deploys, 0 falhas pos-golden-test\nPROMPT: v4 (93%), 14 golden tests, 0 regressoes\n\nACOES:\n- Implementar cache imagem (SHA256) -> -$15/mes\n- Adicionar few-shot ingles no v5\n- Testar timeout retry mais agressivo",
};

// ============================================================
// FEEDBACK LOG
// ============================================================
var FEEDBACK = [
  { date: "10/03", lead: "Quero trocar o vinil", ai: "MANUTENCAO", human: "REFORMA", feature: "classify" },
  { date: "10/03", lead: "Minha piscina esta verde", ai: "MANUTENCAO", human: null, feature: "classify" },
  { date: "09/03", lead: "Want to build a pool", ai: "INDEFINIDO", human: "CONSTRUCAO", feature: "classify" },
  { date: "09/03", lead: "Preciso limpeza mensal", ai: "MANUTENCAO", human: null, feature: "classify" },
  { date: "08/03", lead: "Iluminacao LED na piscina", ai: "CONSTRUCAO", human: "REFORMA", feature: "classify" },
  { date: "08/03", lead: "Ola, resposta sugerida usada", ai: "OK", human: null, feature: "whatsapp" },
  { date: "07/03", lead: "Resposta editada antes de enviar", ai: "EDITADA", human: "AJUSTADA", feature: "whatsapp" },
  { date: "07/03", lead: "Copiloto: obra do Carlos", ai: "CORRETO", human: null, feature: "copilot" },
];

// ============================================================
// RETRO DATA
// ============================================================
var RETRO = {
  good: ["Acuracia 93% (meta 90 atingida)", "Adocao 74% (meta 70 atingida)", "Golden tests preveniram deploy quebrado", "ROI 1.847% (payback < 1 semana)", "Feedback loop funcionando (correcoes -> melhoria)"],
  bad: ["REFORMA vs MANUTENCAO persiste", "Leads em ingles", "Sandra nao usa copiloto", "Vision caro (56% do custo)", "3 timeouts de API no mes"],
  insights: ["Flywheel esta girando: menos correcoes por semana", "Model routing esta otimo (Haiku para 80% das chamadas)", "Cache semantico vai ser o proximo grande ganho"],
  nextActions: [
    { action: "Prompt v5: few-shot ingles + REFORMA edge cases", owner: "Dev", pri: "alta" },
    { action: "Cache de imagem (SHA256)", owner: "Dev", pri: "alta" },
    { action: "Entrevistar Sandra sobre copiloto", owner: "PO", pri: "media" },
    { action: "Pilotar Vision com 2 tecnicos", owner: "Dev", pri: "media" },
    { action: "Preparar relatorio automatico para Sandra", owner: "Dev", pri: "baixa" },
  ],
};

// ============================================================
// COMPONENTS
// ============================================================

function HealthDashboard() {
  var keys = Object.keys(HEALTH);
  var metCount = keys.filter(function(k) { return metHealth(HEALTH[k]); }).length;
  var overallPct = Math.round(metCount / keys.length * 100);
  var overallColor = overallPct >= 80 ? C.green : overallPct >= 60 ? C.amber : C.red;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "14px", borderRadius: "10px", marginBottom: "14px",
        background: overallColor + "08", border: "1px solid " + overallColor + "22",
      }}>
        <div style={{ fontSize: "32px", fontWeight: 800, color: overallColor }}>{overallPct}%</div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>Product Health Score</div>
          <div style={{ fontSize: "10px", color: C.textMuted }}>{metCount}/{keys.length} metas atingidas | Semana 6 - Marco 2026</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {keys.map(function(key) {
          var m = HEALTH[key];
          var met = metHealth(m);
          return (
            <div key={key} style={{
              padding: "10px 8px", borderRadius: "8px",
              background: C.surface, border: "1px solid " + (met ? C.green + "22" : C.red + "22"),
              textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: met ? C.green : C.red }}>{m.value}{m.unit}</div>
              <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{m.label}</div>
              <div style={{ fontSize: "8px", color: met ? C.green : C.red, marginTop: "2px" }}>
                {met ? "\u2713" : "\u2717"} meta: {m.target}{m.unit}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeaturePortfolio() {
  var sorted = FEATURES.slice().sort(function(a, b) { return b.rice - a.rice; });
  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
      {sorted.map(function(f, i) {
        var st = STATUS_MAP[f.status];
        var hasData = f.status === "production" || f.status === "pilot";
        return (
          <div key={f.id} style={{
            padding: "10px 14px", fontSize: "10px",
            borderBottom: i < sorted.length - 1 ? "1px solid " + C.border : "none",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{
              fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
              background: st.color + "15", color: st.color, width: "36px", textAlign: "center",
            }}>{st.label}</span>
            <span style={{ fontWeight: 600, color: C.text, flex: 1 }}>{f.name}</span>
            <span style={{ color: C.amber, fontWeight: 700, width: "40px", textAlign: "right" }}>{f.rice}</span>
            {hasData && f.accuracy && <span style={{ color: f.accuracy >= 90 ? C.green : C.amber, width: "35px", textAlign: "right" }}>{f.accuracy}%</span>}
            {hasData && <span style={{ color: C.cyan, width: "35px", textAlign: "right" }}>{f.adoption}%</span>}
            {hasData && f.econMonth > 0 && <span style={{ color: C.green, width: "55px", textAlign: "right" }}>R${(f.econMonth / 1000).toFixed(1)}k</span>}
            {f.ethicsAvg && (
              <span style={{
                color: f.ethicsAvg >= 4 ? C.green : f.ethicsAvg >= 3 ? C.amber : C.red,
                width: "30px", textAlign: "right", fontSize: "9px",
              }}>{f.ethicsAvg}</span>
            )}
          </div>
        );
      })}
      <div style={{
        padding: "8px 14px", background: C.surfaceAlt, fontSize: "8px", color: C.textDim,
        display: "flex", gap: "16px",
      }}>
        <span>RICE</span><span>Acuracia</span><span>Adocao</span><span>Economia</span><span>Etica</span>
      </div>
    </div>
  );
}

function TrendChart() {
  var maxLeads = Math.max.apply(null, WEEKLY.map(function(w) { return w.leads; }));
  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "10px", padding: "14px",
    }}>
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>TENDENCIA SEMANAL (6 semanas)</div>
      <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "70px", marginBottom: "8px" }}>
        {WEEKLY.map(function(w) {
          var hLeads = (w.leads / maxLeads) * 60;
          var hAcc = (w.accuracy / 100) * 60;
          return (
            <div key={w.week} style={{ flex: 1, textAlign: "center", position: "relative" }}>
              <div style={{ position: "relative", height: "60px" }}>
                <div style={{
                  position: "absolute", bottom: 0, left: "10%", width: "35%",
                  height: hLeads + "px", background: C.blue + "40", borderRadius: "2px 2px 0 0",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: "55%", width: "35%",
                  height: hAcc + "px", background: C.green, borderRadius: "2px 2px 0 0",
                }} />
              </div>
              <div style={{ fontSize: "7px", color: C.textDim, marginTop: "4px" }}>{w.week}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "16px", fontSize: "9px" }}>
        <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.blue + "40", marginRight: "4px" }} />Leads</span>
        <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.green, marginRight: "4px" }} />Acuracia</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "9px", color: C.textDim }}>
        <span>Correcoes: {WEEKLY[0].corrections} {"->"} {WEEKLY[WEEKLY.length - 1].corrections} (flywheel!)</span>
        <span>Custo: ${WEEKLY[WEEKLY.length - 1].cost}/sem</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function ProductHQ() {
  var [activeTab, setActiveTab] = useState("health");
  var [selectedReport, setSelectedReport] = useState("executive");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Projeto Integrador - Cap 7</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Product HQ — Gestao de Produto de IA
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Health score | Portfolio | Tendencias | Comunicacao | Feedback | Retro
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "health", label: "Product Health" },
            { id: "portfolio", label: "Portfolio" },
            { id: "comms", label: "Comunicacao" },
            { id: "feedback", label: "Feedback Loop" },
            { id: "retro", label: "Retrospectiva" },
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

        {/* HEALTH */}
        {activeTab === "health" && (
          <div>
            <HealthDashboard />
            <div style={{ marginTop: "14px" }}>
              <TrendChart />
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Portfolio de features de IA com RICE score, metricas de producao, economia e score etico. Ordenado por RICE.
            </p>
            <FeaturePortfolio />

            {/* Summary cards */}
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Em producao", value: FEATURES.filter(function(f) { return f.status === "production"; }).length, color: C.green },
                { label: "Em piloto", value: FEATURES.filter(function(f) { return f.status === "pilot"; }).length, color: C.amber },
                { label: "Em dev", value: FEATURES.filter(function(f) { return f.status === "development" || f.status === "prototype"; }).length, color: C.cyan },
                { label: "Economia total/mes", value: "R$" + (FEATURES.reduce(function(s, f) { return s + f.econMonth; }, 0) / 1000).toFixed(1) + "k", color: C.green },
                { label: "Custo IA total/mes", value: "R$" + (FEATURES.reduce(function(s, f) { return s + f.costMonth; }, 0) * 5.8).toFixed(0), color: C.amber },
                { label: "Score etico medio", value: (FEATURES.filter(function(f) { return f.ethicsAvg; }).reduce(function(s, f) { return s + f.ethicsAvg; }, 0) / FEATURES.filter(function(f) { return f.ethicsAvg; }).length).toFixed(1) + "/5", color: C.purple },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "90px", padding: "10px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMMS */}
        {activeTab === "comms" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              O mesmo resultado, comunicado para 3 audiencias. Selecione o formato:
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {[
                { id: "executive", label: "Diretoria", color: C.amber },
                { id: "team", label: "Time", color: C.cyan },
                { id: "technical", label: "Tecnico", color: C.green },
              ].map(function(r) {
                return (
                  <button key={r.id} onClick={function() { setSelectedReport(r.id); }} style={{
                    flex: 1, padding: "10px", borderRadius: "8px", fontSize: "11px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                    border: "1px solid " + (selectedReport === r.id ? r.color : C.border),
                    background: selectedReport === r.id ? r.color + "12" : C.surface,
                    color: selectedReport === r.id ? r.color : C.textDim,
                  }}>{r.label}</button>
                );
              })}
            </div>

            <pre style={{
              margin: 0, padding: "18px", borderRadius: "10px",
              background: C.surface, border: "1px solid " + C.border,
              fontSize: "11px", color: C.text, lineHeight: 1.7,
              whiteSpace: "pre-wrap", fontFamily: "inherit",
            }}>
              {REPORTS[selectedReport]}
            </pre>

            <div style={{
              marginTop: "12px", padding: "10px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Regra: </span>
              Diretoria quer ROI e proximos passos. Time quer o que melhorou e o que falta. Tecnico quer metricas e acoes. Mesmos dados, 3 tons.
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && (
          <div>
            {/* Stats */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {[
                { label: "Total", value: FEEDBACK.length, color: C.text },
                { label: "Corretos", value: FEEDBACK.filter(function(f) { return !f.human; }).length, color: C.green },
                { label: "Corrigidos", value: FEEDBACK.filter(function(f) { return f.human; }).length, color: C.red },
                { label: "Taxa correcao", value: Math.round(FEEDBACK.filter(function(f) { return f.human; }).length / FEEDBACK.length * 100) + "%", color: C.amber },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, padding: "10px 8px", borderRadius: "8px",
                    background: C.surface, border: "1px solid " + C.border, textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Log */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
              {FEEDBACK.map(function(f, i) {
                var corrected = !!f.human;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < FEEDBACK.length - 1 ? "1px solid " + C.border : "none",
                    background: corrected ? C.red + "04" : "transparent",
                  }}>
                    <span style={{ color: C.textDim, width: "38px", flexShrink: 0 }}>{f.date}</span>
                    <span style={{
                      fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                      background: C.cyan + "15", color: C.cyan, width: "40px", textAlign: "center",
                    }}>{f.feature}</span>
                    <span style={{ color: C.textMuted, flex: 1 }}>{f.lead.length > 40 ? f.lead.substring(0, 40) + "..." : f.lead}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                      background: (corrected ? C.red : C.green) + "15",
                      color: corrected ? C.red : C.green,
                    }}>{f.ai}</span>
                    {corrected && <span style={{ color: C.textDim }}>{"\u2192"}</span>}
                    {corrected && (
                      <span style={{
                        fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                        background: C.amber + "15", color: C.amber,
                      }}>{f.human}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: "12px 14px", borderRadius: "8px",
              background: C.amber + "08", border: "1px solid " + C.amber + "22",
              fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Padroes detectados: </span>
              1) REFORMA vs MANUTENCAO ("trocar vinil" e "iluminacao LED" classificados errado).
              2) Leads em ingles vao para INDEFINIDO.
              3) Respostas WhatsApp editadas antes de enviar = tom nao ideal.
              Acao: prompt v5 com novos few-shots para esses 3 padroes.
            </div>
          </div>
        )}

        {/* RETRO */}
        {activeTab === "retro" && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>
              Retrospectiva de Produto - Sprint 6 (Marco 2026)
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {/* Good */}
              <div style={{ flex: 1, minWidth: "250px", background: C.green + "06", border: "1px solid " + C.green + "18", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.green, marginBottom: "8px" }}>{"\uD83D\uDE00"} Funcionou</div>
                {RETRO.good.map(function(g, i) {
                  return <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "3px" }}>{"\u2713"} {g}</div>;
                })}
              </div>
              {/* Bad */}
              <div style={{ flex: 1, minWidth: "250px", background: C.red + "06", border: "1px solid " + C.red + "18", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.red, marginBottom: "8px" }}>{"\uD83D\uDE15"} Nao funcionou</div>
                {RETRO.bad.map(function(b, i) {
                  return <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "3px" }}>{"\u2717"} {b}</div>;
                })}
              </div>
            </div>

            {/* Insights */}
            <div style={{
              background: C.purple + "06", border: "1px solid " + C.purple + "18",
              borderRadius: "10px", padding: "12px", marginBottom: "12px",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.purple, marginBottom: "6px" }}>{"\uD83D\uDCA1"} Insights</div>
              {RETRO.insights.map(function(ins, i) {
                return <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "3px" }}>{"\u2022"} {ins}</div>;
              })}
            </div>

            {/* Actions */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "11px", fontWeight: 700, color: C.amber }}>
                Acoes
              </div>
              {RETRO.nextActions.map(function(a, i) {
                var pc = a.pri === "alta" ? C.red : a.pri === "media" ? C.amber : C.textDim;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < RETRO.nextActions.length - 1 ? "1px solid " + C.border : "none",
                  }}>
                    <span style={{ color: C.text, flex: 1 }}>{a.action}</span>
                    <span style={{ color: C.cyan, fontSize: "9px" }}>{a.owner}</span>
                    <span style={{
                      fontSize: "7px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                      background: pc + "15", color: pc,
                    }}>{a.pri.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ARCH */}
        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.orange,
                text: "Cap 7 completo integrado:\n\nM1 (Discovery + Metricas): Product Health Score com 8 KPIs, portfolio RICE com 7 features, tendencia semanal mostrando flywheel.\n\nM2 (Comunicacao + Etica): 3 relatorios para 3 audiencias (diretoria/time/tecnico). Score etico por feature no portfolio.\n\nM3 (Roadmap + Iteracao): Feedback loop com 8 entradas + padroes detectados. Retrospectiva com good/bad/insights/acoes.\n\nResultado: um painel que o PO usaria semanalmente para gerenciar o produto de IA do Costa Lima.",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: '1. HEALTH: observe que 6/8 metas foram atingidas. As 2 pendentes: LGPD (65% < 80%) e drift nao e um problema (estavel).\n\n2. PORTFOLIO: compare features em producao vs planejadas. Note que "Agente multi-step" tem score etico 2.7 (mais baixo) — precisa de design cuidadoso.\n\n3. COMMS: alterne entre Diretoria/Time/Tecnico. A mesma informacao, 3 tons: ROI vs problemas vs metricas.\n\n4. FEEDBACK: veja os 3 padroes detectados. Cada um vira uma acao concreta (few-shot no prompt v5).\n\n5. RETRO: note que "Flywheel girando" aparece como insight. Correcoes: 12 na S1 -> 3 na S6. O sistema melhora sozinho.',
              },
              {
                title: "Como usar este painel no Costa Lima real",
                color: C.green,
                text: "SEMANAL (15min):\n  1. Olhar Health Score (metas atingidas?)\n  2. Checar feedback loop (padroes novos?)\n  3. Decidir: ajustar prompt? Mudar prioridade?\n\nMENSAL (30min):\n  1. Gerar relatorio para diretoria (aba Comunicacao)\n  2. Retrospectiva com time (aba Retro)\n  3. Atualizar portfolio e RICE scores\n\nTRIMESTRAL (1h):\n  1. Revisar roadmap (horizontes atualizados?)\n  2. Avaliar ROI acumulado\n  3. Planejar proxima fase\n\nO painel NAO e para microgerenciar — e para tomar decisoes informadas sobre o produto de IA.",
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
