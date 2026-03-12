import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// MODEL REGISTRY
// ============================================================
var MODELS = [
  { v: "v1", name: "Zero-shot", date: "15/01", acc: 78.0, cost: 0.0005, lat: 340, status: "archived", technique: "Zero-shot prompt", dataset: "N/A", f1: 74.2 },
  { v: "v2", name: "Few-shot (5)", date: "01/02", acc: 91.0, cost: 0.0008, lat: 380, status: "archived", technique: "5 few-shot examples", dataset: "5 exemplos manuais", f1: 88.5 },
  { v: "v3", name: "Few-shot + RAG", date: "15/02", acc: 93.0, cost: 0.001, lat: 450, status: "archived", technique: "Few-shot + RAG pgvector", dataset: "14 docs indexados", f1: 91.4 },
  { v: "v4", name: "Destilado LoRA", date: "01/03", acc: 94.5, cost: 0.0003, lat: 175, status: "production", technique: "Destilacao Sonnet + LoRA rank 16", dataset: "2.300 destilados", f1: 93.2 },
  { v: "v5", name: "Destilado + RAG", date: "10/03", acc: 96.0, cost: 0.0006, lat: 280, status: "shadow", technique: "Destilado + RAG hybrid", dataset: "2.300 + 14 docs", f1: 95.1 },
];

var STATUS_COLORS = { production: C.green, shadow: C.amber, archived: C.textDim, candidate: C.cyan };

// ============================================================
// CONFUSION MATRICES FOR EACH MODEL
// ============================================================
var CATS = ["CONST", "REFOR", "MANUT", "EMERG", "ORCAM"];
var MATRICES = {
  v1: [[70, 8, 5, 2, 15], [12, 60, 15, 1, 12], [5, 12, 72, 5, 6], [2, 3, 8, 80, 7], [15, 8, 5, 2, 70]],
  v2: [[88, 4, 2, 0, 6], [5, 80, 10, 0, 5], [2, 8, 84, 3, 3], [0, 1, 4, 92, 3], [8, 4, 3, 0, 85]],
  v3: [[92, 3, 1, 0, 4], [4, 85, 7, 0, 4], [1, 6, 88, 3, 2], [0, 0, 3, 94, 3], [5, 3, 2, 0, 90]],
  v4: [[95, 2, 1, 0, 2], [3, 88, 6, 0, 3], [1, 4, 91, 2, 2], [0, 0, 2, 96, 2], [3, 2, 2, 0, 93]],
  v5: [[97, 1, 0, 0, 2], [2, 91, 4, 0, 3], [0, 3, 93, 2, 2], [0, 0, 1, 97, 2], [2, 2, 1, 0, 95]],
};

function calcF1(matrix, idx) {
  var tp = matrix[idx][idx];
  var fp = 0; var fn = 0; var rowSum = 0;
  for (var i = 0; i < matrix.length; i++) {
    rowSum += matrix[idx][i];
    if (i !== idx) { fn += matrix[idx][i]; fp += matrix[i][idx]; }
  }
  var p = tp / (tp + fp) || 0;
  var r = tp / rowSum || 0;
  return { precision: p, recall: r, f1: 2 * p * r / (p + r) || 0 };
}

// ============================================================
// DISTILLATION PIPELINE DATA
// ============================================================
var DISTILL_PIPELINE = [
  { icon: "\uD83D\uDCE5", label: "Coletar 2.700 leads reais", detail: "LeadHistorico 3 meses", cost: "$0", status: "done" },
  { icon: "\uD83C\uDFEB", label: "Sonnet classifica todos", detail: "Professor gera outputs de alta qualidade", cost: "$8", status: "done" },
  { icon: "\uD83D\uDDD1", label: "Filtrar confianca < 85%", detail: "2.700 → 2.300 exemplos limpos", cost: "$0", status: "done" },
  { icon: "\uD83D\uDC64", label: "Felipe valida 5%", detail: "96% concordancia, 4 correcoes", cost: "R$50", status: "done" },
  { icon: "\u2699", label: "LoRA fine-tune (7 epochs)", detail: "Best: epoch 7 (val_loss 0.72)", cost: "$50", status: "done" },
  { icon: "\uD83C\uDFAF", label: "Avaliar: 94.5% (professor 96.2%)", detail: "Gap 1.7%, custo 60% menor", cost: "$0.50", status: "done" },
];

// ============================================================
// SHADOW DEPLOYMENT COMPARISON
// ============================================================
var SHADOW_DATA = [
  { query: "Quero piscina 8x4 com prainha", prod: "CONSTRUCAO (95%)", shadow: "CONSTRUCAO (97%)", agree: true },
  { query: "Preciso trocar o vinil", prod: "REFORMA (88%)", shadow: "REFORMA (93%)", agree: true },
  { query: "Bomba fazendo barulho", prod: "MANUTENCAO (86%)", shadow: "MANUTENCAO (91%)", agree: true },
  { query: "URGENTE agua vazando na rua", prod: "EMERGENCIA (96%)", shadow: "EMERGENCIA (98%)", agree: true },
  { query: "Quero colocar LED na piscina", prod: "CONSTRUCAO (72%)", shadow: "REFORMA (89%)", agree: false, shadowBetter: true },
  { query: "Meu vizinho indicou voces", prod: "INDEFINIDO (55%)", shadow: "CONSTRUCAO (68%)", agree: false, shadowBetter: true },
  { query: "Gostaria de um orcamento de reforma", prod: "ORCAMENTO (90%)", shadow: "REFORMA (85%)", agree: false, shadowBetter: false },
  { query: "Piscina ta verde ha 1 semana", prod: "MANUTENCAO (92%)", shadow: "MANUTENCAO (95%)", agree: true },
];

// ============================================================
// LIFECYCLE STAGES
// ============================================================
var LIFECYCLE = [
  { name: "Coletar", icon: "\uD83D\uDCE5", color: C.cyan, current: "2.700 leads coletados", next: "Acumular 500+ novos a cada trimestre" },
  { name: "Destilar", icon: "\uD83C\uDFEB", color: C.purple, current: "Sonnet gerou dataset ($8)", next: "Retreinar quando modelo professor atualizar" },
  { name: "Treinar", icon: "\u2699", color: C.amber, current: "LoRA 7 epochs ($50)", next: "Retreinar trimestral ou quando acuracia cair >2%" },
  { name: "Avaliar", icon: "\uD83D\uDCCA", color: C.green, current: "94.5% no teste", next: "Avaliar semanalmente em producao" },
  { name: "Deploy", icon: "\uD83D\uDE80", color: C.blue, current: "v4 em producao, v5 em shadow", next: "Promover v5 se 95%+ concordancia" },
  { name: "Monitorar", icon: "\uD83D\uDC41", color: C.orange, current: "Drift -0.3%/sem (estavel)", next: "Alertar se drift > 2% em 2 semanas" },
];

// ============================================================
// MAIN APP
// ============================================================
export default function MLStudio() {
  var [activeTab, setActiveTab] = useState("overview");
  var [selectedModel, setSelectedModel] = useState("v4");
  var [calcVolume, setCalcVolume] = useState(30);

  // Breakeven calc
  var dailySavingsVsPrompt = calcVolume * (0.0008 - 0.0003);
  var breakeven = dailySavingsVsPrompt > 0 ? Math.ceil(150 / dailySavingsVsPrompt) : Infinity;

  // Shadow stats
  var agreeCount = SHADOW_DATA.filter(function(s) { return s.agree; }).length;
  var shadowBetterCount = SHADOW_DATA.filter(function(s) { return !s.agree && s.shadowBetter; }).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Projeto Integrador - Cap 9</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            ML Studio — Fine-Tuning e MLOps
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Registry | Avaliacao | Shadow deploy | Destilacao | Breakeven | Ciclo MLOps
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "overview", label: "Visao Geral" },
            { id: "eval", label: "Avaliacao" },
            { id: "shadow", label: "Shadow Deploy" },
            { id: "breakeven", label: "Breakeven" },
            { id: "arch", label: "Arquitetura" },
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

        {/* =================== OVERVIEW =================== */}
        {activeTab === "overview" && (
          <div>
            {/* Model Registry */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>MODEL REGISTRY</div>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
              {MODELS.map(function(m, i) {
                var sc = STATUS_COLORS[m.status];
                return (
                  <div key={m.v} style={{
                    display: "grid", gridTemplateColumns: "50px 130px 60px 55px 55px 55px 60px",
                    padding: "10px 14px", fontSize: "10px", alignItems: "center",
                    borderBottom: i < MODELS.length - 1 ? "1px solid " + C.border : "none",
                    background: m.status === "production" ? C.green + "04" : m.status === "shadow" ? C.amber + "04" : "transparent",
                  }}>
                    <span style={{ fontWeight: 800, color: sc }}>{m.v}</span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{m.name}</span>
                    <span style={{ color: m.acc >= 94 ? C.green : m.acc >= 90 ? C.cyan : C.amber, fontWeight: 700 }}>{m.acc}%</span>
                    <span style={{ color: C.amber }}>${m.cost}</span>
                    <span style={{ color: m.lat <= 200 ? C.green : C.textMuted }}>{m.lat}ms</span>
                    <span style={{ color: C.textDim }}>{m.date}</span>
                    <span style={{
                      fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                      background: sc + "15", color: sc, textAlign: "center",
                    }}>{m.status.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>

            {/* Distillation Pipeline */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>PIPELINE DE DESTILACAO (v4)</div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
              {DISTILL_PIPELINE.map(function(step, i) {
                return (
                  <div key={i} style={{
                    flex: 1, minWidth: "120px", padding: "10px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>{step.icon}</div>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: C.text, marginBottom: "2px" }}>{step.label}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{step.cost}</div>
                  </div>
                );
              })}
            </div>

            {/* MLOps Lifecycle */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>CICLO MLOps</div>
            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
              {LIFECYCLE.map(function(stage, i) {
                return (
                  <div key={i} style={{
                    flex: 1, minWidth: "120px", padding: "10px 8px",
                    background: stage.color + "08", border: "1px solid " + stage.color + "18",
                    borderRadius: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                      <span>{stage.icon}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: stage.color }}>{stage.name}</span>
                    </div>
                    <div style={{ fontSize: "8px", color: C.textMuted, lineHeight: 1.4 }}>{stage.current}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick stats */}
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Modelo atual", value: "v4 (94.5%)", color: C.green },
                { label: "Shadow", value: "v5 (96.0%)", color: C.amber },
                { label: "Custo setup", value: "~$60", color: C.cyan },
                { label: "Gap do professor", value: "1.7%", color: C.purple },
                { label: "Drift", value: "-0.3%/sem", color: C.green },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "90px", padding: "10px 6px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "7px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== EVALUATION =================== */}
        {activeTab === "eval" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Selecione um modelo para ver sua confusion matrix e metricas por categoria. Compare a evolucao de v1 a v5.
            </p>

            <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
              {MODELS.map(function(m) {
                var sc = STATUS_COLORS[m.status];
                return (
                  <button key={m.v} onClick={function() { setSelectedModel(m.v); }} style={{
                    flex: 1, padding: "8px", borderRadius: "8px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", textAlign: "center",
                    border: "1px solid " + (selectedModel === m.v ? sc : C.border),
                    background: selectedModel === m.v ? sc + "12" : C.surface,
                    color: selectedModel === m.v ? sc : C.textDim,
                    fontWeight: selectedModel === m.v ? 700 : 400,
                  }}>
                    <div style={{ fontWeight: 700 }}>{m.v}</div>
                    <div style={{ fontSize: "8px" }}>{m.acc}%</div>
                  </button>
                );
              })}
            </div>

            {/* Confusion Matrix */}
            {MATRICES[selectedModel] && (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", padding: "14px", marginBottom: "14px",
              }}>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                  CONFUSION MATRIX — {selectedModel.toUpperCase()} ({MODELS.find(function(m) { return m.v === selectedModel; }).name})
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "6px", textAlign: "left", color: C.textDim, fontSize: "8px" }}>Real\Pred</th>
                      {CATS.map(function(cat) {
                        return <th key={cat} style={{ padding: "6px", textAlign: "center", color: C.textDim, fontSize: "8px" }}>{cat}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {CATS.map(function(cat, i) {
                      return (
                        <tr key={cat}>
                          <td style={{ padding: "6px", color: C.text, fontWeight: 600, fontSize: "9px" }}>{cat}</td>
                          {MATRICES[selectedModel][i].map(function(val, j) {
                            var isDiag = i === j;
                            var bg = isDiag ? (val >= 90 ? C.green + "20" : val >= 80 ? C.amber + "20" : C.red + "15") : (val >= 5 ? C.red + "12" : "transparent");
                            var color = isDiag ? (val >= 90 ? C.green : val >= 80 ? C.amber : C.red) : (val >= 5 ? C.red : C.textDim);
                            return (
                              <td key={j} style={{
                                padding: "6px", textAlign: "center", borderRadius: "3px",
                                background: bg, color: color, fontWeight: isDiag ? 800 : (val >= 5 ? 700 : 400),
                              }}>{val}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Per-category metrics */}
            {MATRICES[selectedModel] && (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr",
                  padding: "8px 14px", borderBottom: "1px solid " + C.border,
                  fontSize: "8px", fontWeight: 700, color: C.textDim,
                }}>
                  <div>CATEGORIA</div><div>PRECISION</div><div>RECALL</div><div>F1</div>
                </div>
                {CATS.map(function(cat, i) {
                  var m = calcF1(MATRICES[selectedModel], i);
                  return (
                    <div key={cat} style={{
                      display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr",
                      padding: "8px 14px", fontSize: "10px",
                      borderBottom: i < CATS.length - 1 ? "1px solid " + C.border : "none",
                    }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{cat}</span>
                      <span style={{ color: m.precision >= 0.9 ? C.green : C.amber }}>{(m.precision * 100).toFixed(1)}%</span>
                      <span style={{ color: m.recall >= 0.9 ? C.green : C.amber }}>{(m.recall * 100).toFixed(1)}%</span>
                      <span style={{ color: m.f1 >= 0.9 ? C.green : m.f1 >= 0.8 ? C.amber : C.red, fontWeight: 700 }}>{(m.f1 * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Evolution chart */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginTop: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>EVOLUCAO DA ACURACIA</div>
              <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "70px" }}>
                {MODELS.map(function(m) {
                  var h = ((m.acc - 70) / 30) * 70;
                  var sc = STATUS_COLORS[m.status];
                  return (
                    <div key={m.v} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: sc, marginBottom: "2px" }}>{m.acc}%</div>
                      <div style={{
                        height: h + "px", background: sc, borderRadius: "4px 4px 0 0",
                        margin: "0 auto", width: "60%", opacity: m.status === "archived" ? 0.4 : 1,
                      }} />
                      <div style={{ fontSize: "8px", color: C.textDim, marginTop: "4px" }}>{m.v}</div>
                      <div style={{ fontSize: "7px", color: C.textDim }}>{m.name.split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================== SHADOW =================== */}
        {activeTab === "shadow" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              v5 (shadow) roda em paralelo com v4 (producao). Cada lead e classificado por ambos. Output de v5 e logado mas nao usado. Comparacao em tempo real.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {[
                { label: "Concordancia", value: agreeCount + "/" + SHADOW_DATA.length, color: C.green },
                { label: "Shadow melhor", value: shadowBetterCount, color: C.cyan },
                { label: "Prod melhor", value: SHADOW_DATA.filter(function(s) { return !s.agree && !s.shadowBetter; }).length, color: C.amber },
                { label: "Taxa acordo", value: Math.round(agreeCount / SHADOW_DATA.length * 100) + "%", color: agreeCount / SHADOW_DATA.length >= 0.75 ? C.green : C.amber },
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

            {/* Comparison table */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 120px 120px 50px",
                padding: "8px 14px", borderBottom: "1px solid " + C.border,
                fontSize: "8px", fontWeight: 700, color: C.textDim,
              }}>
                <div>LEAD</div><div>v4 (PROD)</div><div>v5 (SHADOW)</div><div>VERED.</div>
              </div>
              {SHADOW_DATA.map(function(s, i) {
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 120px 50px",
                    padding: "8px 14px", fontSize: "10px", alignItems: "center",
                    borderBottom: i < SHADOW_DATA.length - 1 ? "1px solid " + C.border : "none",
                    background: !s.agree ? (s.shadowBetter ? C.cyan + "04" : C.amber + "04") : "transparent",
                  }}>
                    <span style={{ color: C.textMuted }}>{s.query.length > 35 ? s.query.substring(0, 35) + "..." : s.query}</span>
                    <span style={{ color: s.agree || !s.shadowBetter ? C.green : C.textDim, fontSize: "9px" }}>{s.prod}</span>
                    <span style={{ color: s.agree || s.shadowBetter ? C.cyan : C.textDim, fontSize: "9px" }}>{s.shadow}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 700,
                      color: s.agree ? C.green : s.shadowBetter ? C.cyan : C.amber,
                    }}>{s.agree ? "=" : s.shadowBetter ? "v5+" : "v4+"}</span>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: (agreeCount + shadowBetterCount) / SHADOW_DATA.length >= 0.95 ? C.green + "08" : C.amber + "08",
              border: "1px solid " + ((agreeCount + shadowBetterCount) / SHADOW_DATA.length >= 0.95 ? C.green : C.amber) + "22",
              fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: (agreeCount + shadowBetterCount) / SHADOW_DATA.length >= 0.95 ? C.green : C.amber, fontWeight: 700 }}>
                {(agreeCount + shadowBetterCount) / SHADOW_DATA.length >= 0.95 ? "PRONTO PARA PROMOVER: " : "AGUARDAR MAIS DADOS: "}
              </span>
              v5 concorda ou e melhor em {Math.round((agreeCount + shadowBetterCount) / SHADOW_DATA.length * 100)}% dos casos.
              {(agreeCount + shadowBetterCount) / SHADOW_DATA.length >= 0.95
                ? " Meta de 95% atingida. Seguro promover v5 para producao."
                : " Meta: 95%. Continuar coletando dados de shadow."}
            </div>
          </div>
        )}

        {/* =================== BREAKEVEN =================== */}
        {activeTab === "breakeven" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Quando fine-tuning compensa financeiramente? Arraste o volume e veja o breakeven mudar.
            </p>

            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <span style={{ fontSize: "10px", color: C.textDim }}>Volume (calls/dia):</span>
                <input type="range" min="10" max="10000" value={calcVolume}
                  onChange={function(e) { setCalcVolume(parseInt(e.target.value)); }}
                  style={{ flex: 1, accentColor: C.cyan }} />
                <span style={{ fontSize: "18px", fontWeight: 800, color: C.cyan }}>{calcVolume}</span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Prompt/mes", value: "$" + (calcVolume * 0.0008 * 30).toFixed(2), color: C.red },
                  { label: "FT/mes", value: "$" + (calcVolume * 0.0003 * 30).toFixed(2), color: C.green },
                  { label: "Economia/mes", value: "$" + (dailySavingsVsPrompt * 30).toFixed(2), color: C.cyan },
                  { label: "Setup", value: "$150", color: C.amber },
                  { label: "Breakeven", value: breakeven > 9999 ? "Nunca" : breakeven + " dias", color: breakeven <= 30 ? C.green : breakeven <= 90 ? C.amber : C.red },
                  { label: "Veredicto", value: breakeven <= 90 ? "VALE" : "NAO VALE", color: breakeven <= 90 ? C.green : C.red },
                ].map(function(m) {
                  return (
                    <div key={m.label} style={{
                      flex: 1, minWidth: "80px", padding: "10px 6px",
                      background: C.surfaceAlt, borderRadius: "6px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: "7px", color: C.textDim }}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scenarios */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>CENARIOS</div>
              {[
                { name: "Costa Lima atual", vol: 30, breakeven: 333, verdict: "NAO" },
                { name: "2 vendedores", vol: 100, breakeven: 100, verdict: "NAO" },
                { name: "Equipe 5 pessoas", vol: 300, breakeven: 33, verdict: "TALVEZ" },
                { name: "Franquia regional", vol: 1000, breakeven: 10, verdict: "SIM" },
                { name: "Rede 10 lojas", vol: 5000, breakeven: 2, verdict: "SIM!" },
              ].map(function(s, i) {
                var vc = s.verdict.includes("SIM") ? C.green : s.verdict === "TALVEZ" ? C.amber : C.red;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < 4 ? "1px solid " + C.border : "none",
                  }}>
                    <span style={{ color: C.text, fontWeight: 600, flex: 1 }}>{s.name}</span>
                    <span style={{ color: C.textMuted }}>{s.vol}/dia</span>
                    <span style={{ color: C.textDim }}>breakeven: {s.breakeven}d</span>
                    <span style={{ fontWeight: 700, color: vc }}>{s.verdict}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== ARCHITECTURE =================== */}
        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.purple,
                text: "Cap 9 completo integrado:\n\nM1 (Decisao + Treinamento): Piramide de customizacao, model registry com evolucao v1→v5 (78%→96%), confusion matrix por modelo, grafico de evolucao.\n\nM2 (Destilacao + MLOps): Pipeline professor-aluno (Sonnet→Haiku, $60 total), shadow deployment com comparacao request a request, breakeven por volume, ciclo MLOps completo.\n\nResultado: um painel que o AI Champion usa para decidir, treinar, avaliar, deployar e monitorar modelos.",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: "1. OVERVIEW: veja a evolucao de v1 (78%) ate v5 (96%) e o pipeline de destilacao completo.\n\n2. AVALIACAO: alterne entre v1 e v5 na confusion matrix. Note como EMERGENCIA foi de 80% para 97% (critico!). REFORMA vs MANUTENCAO foi de 15% confusao para 4%.\n\n3. SHADOW: veja os 8 leads comparados. v5 acerta 'LED na piscina' como REFORMA (v4 errava para CONSTRUCAO). Mas v5 erra 'orcamento de reforma' (classifica como REFORMA, nao ORCAMENTO).\n\n4. BREAKEVEN: arraste o slider. Note o ponto de inflexao: ~300 calls/dia e onde fine-tuning comeca a fazer sentido financeiro.\n\n5. Compare: v3 (few-shot+RAG, 93%, $0.001) vs v4 (destilado, 94.5%, $0.0003). O destilado e +1.5% acuracia com 70% menos custo por call.",
              },
              {
                title: "Implementacao e proximos passos",
                color: C.green,
                text: "AGORA (Costa Lima 30 calls/dia):\n  Manter v4 (destilado) em producao\n  v5 em shadow ate atingir 95% concordancia\n  Custo: $9/mes (60% menos que prompt)\n  Retreinar trimestral com novos dados\n\nFUTURO (se volume crescer):\n  >300 calls/dia: fine-tuning se paga em <30 dias\n  >1000 calls/dia: economia de $75/dia vs prompt\n  Considerar: modelo dedicado por tarefa\n\nCICLO CONTINUO:\n  Coletar → Destilar → Treinar → Avaliar → Deploy → Monitorar → Coletar...\n  Cada ciclo: ~$60 + 1 dia de trabalho\n  Resultado: modelo que melhora com o tempo",
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
