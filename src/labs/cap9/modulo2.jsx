import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DISTILLATION PIPELINE
// ============================================================
var DISTILL_STEPS = [
  { icon: "\uD83D\uDCE5", label: "Coletar inputs reais", detail: "LeadHistorico 3 meses: 2.700 mensagens", time: "instantaneo", cost: "$0" },
  { icon: "\uD83C\uDFEB", label: "Professor classifica (Sonnet)", detail: "2.700 mensagens processadas. Output: intencao + urgencia + confianca + justificativa", time: "~8 min", cost: "$8" },
  { icon: "\uD83D\uDDD1", label: "Filtrar baixa confianca", detail: "Remover confianca < 0.85 (~15%). Resultado: 2.300 exemplos limpos", time: "instantaneo", cost: "$0" },
  { icon: "\uD83D\uDC64", label: "Validar com domain expert", detail: "Felipe revisa 100 exemplos (5%). Concordancia: 96%. Corrige 4 erros.", time: "~30 min humano", cost: "~R$50" },
  { icon: "\uD83E\uDDEA", label: "Fine-tune aluno (LoRA)", detail: "Haiku + LoRA rank 16. Dataset: 1.840 treino, 230 val, 230 teste. 7 epochs.", time: "~20 min", cost: "$50" },
  { icon: "\uD83D\uDCCA", label: "Avaliar aluno", detail: "Aluno: 94.5% | Professor: 96.2% | Baseline: 91% | Gap: apenas 1.7% do professor", time: "~2 min", cost: "$0.50" },
];

// ============================================================
// CONFUSION MATRIX
// ============================================================
var CATEGORIES = ["CONSTRUCAO", "REFORMA", "MANUTENCAO", "EMERGENCIA", "ORCAMENTO"];
var CONFUSION = {
  baseline: [
    [82, 5, 3, 0, 10],
    [8, 72, 12, 0, 8],
    [3, 10, 80, 3, 4],
    [0, 2, 5, 88, 5],
    [10, 6, 4, 0, 80],
  ],
  finetuned: [
    [95, 2, 1, 0, 2],
    [3, 85, 8, 0, 4],
    [1, 5, 90, 2, 2],
    [0, 0, 2, 96, 2],
    [4, 3, 2, 0, 91],
  ],
};

function calcMetrics(matrix, idx) {
  var tp = matrix[idx][idx];
  var fpSum = 0;
  var fnSum = 0;
  var rowSum = 0;
  for (var i = 0; i < matrix.length; i++) {
    rowSum += matrix[idx][i];
    if (i !== idx) { fnSum += matrix[idx][i]; fpSum += matrix[i][idx]; }
  }
  var precision = tp / (tp + fpSum) || 0;
  var recall = tp / rowSum || 0;
  var f1 = 2 * precision * recall / (precision + recall) || 0;
  return { precision: precision, recall: recall, f1: f1 };
}

// ============================================================
// MODEL REGISTRY
// ============================================================
var MODELS = [
  { version: "v1", name: "Prompt few-shot", date: "01/02", accuracy: 91.0, technique: "5 few-shot examples", cost: 0.0008, latency: 380, status: "archived", dataset: "N/A" },
  { version: "v2", name: "Fine-tuned LoRA", date: "15/02", accuracy: 94.0, technique: "LoRA rank 16, 7 epochs", cost: 0.0003, latency: 180, status: "archived", dataset: "1.247 exemplos manuais" },
  { version: "v3", name: "Destilado Sonnet", date: "01/03", accuracy: 94.5, technique: "Destilacao + LoRA", cost: 0.0003, latency: 175, status: "production", dataset: "2.300 exemplos destilados" },
  { version: "v4", name: "Retreinado Q1", date: "15/03", accuracy: 95.1, technique: "Destilacao + dados novos", cost: 0.0003, latency: 172, status: "shadow", dataset: "3.100 exemplos" },
];

// ============================================================
// BREAKEVEN CALCULATOR
// ============================================================
var CALC_DEFAULTS = { volume: 30, costPrompt: 0.0008, costFT: 0.0003, setupCost: 150 };

// ============================================================
// MAIN APP
// ============================================================
export default function DistillationMLOpsLab() {
  var [activeTab, setActiveTab] = useState("distill");
  var [distillStep, setDistillStep] = useState(0);
  var [distillPlaying, setDistillPlaying] = useState(false);
  var [matrixModel, setMatrixModel] = useState("finetuned");
  var [calcVolume, setCalcVolume] = useState(CALC_DEFAULTS.volume);

  var playDistill = useCallback(function() {
    setDistillStep(0);
    setDistillPlaying(true);
    DISTILL_STEPS.forEach(function(_, i) {
      setTimeout(function() {
        setDistillStep(i + 1);
        if (i === DISTILL_STEPS.length - 1) setDistillPlaying(false);
      }, (i + 1) * 800);
    });
  }, []);

  // Breakeven calc
  var dailySavings = calcVolume * (CALC_DEFAULTS.costPrompt - CALC_DEFAULTS.costFT);
  var breakeven = dailySavings > 0 ? Math.ceil(CALC_DEFAULTS.setupCost / dailySavings) : Infinity;
  var monthlyPrompt = calcVolume * CALC_DEFAULTS.costPrompt * 30;
  var monthlyFT = calcVolume * CALC_DEFAULTS.costFT * 30;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.cyan, padding: "4px 10px", borderRadius: "4px",
            background: C.cyan + "12", border: "1px solid " + C.cyan + "33",
          }}>Cap 9 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Destilacao, Avaliacao e MLOps
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Professor-aluno | Confusion matrix | Model registry | Shadow deploy | Breakeven
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "distill", label: "Destilacao" },
            { id: "eval", label: "Avaliacao" },
            { id: "registry", label: "Model Registry" },
            { id: "breakeven", label: "Breakeven" },
            { id: "guide", label: "Guia" },
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

        {/* DISTILLATION */}
        {activeTab === "distill" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Pipeline professor-aluno: Sonnet gera dados de treinamento, Haiku aprende a reproduzir. Performance de Sonnet com custo de Haiku.
            </p>

            <button onClick={playDistill} disabled={distillPlaying} style={{
              padding: "10px 24px", borderRadius: "8px", border: "none",
              background: distillPlaying ? C.surfaceAlt : C.purple,
              color: distillPlaying ? C.textDim : "#fff", fontSize: "12px",
              fontWeight: 700, fontFamily: "inherit", cursor: distillPlaying ? "default" : "pointer",
              marginBottom: "14px",
            }}>
              {distillPlaying ? "Executando..." : "\u25B6 Executar Pipeline de Destilacao"}
            </button>

            {distillStep > 0 && (
              <div>
                {DISTILL_STEPS.map(function(step, i) {
                  if (i >= distillStep) return null;
                  var colors = [C.cyan, C.purple, C.amber, C.green, C.orange, C.green];
                  var sc = colors[i] || C.cyan;
                  return (
                    <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: sc + "20", border: "2px solid " + sc,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px",
                        }}>{step.icon}</div>
                        {i < DISTILL_STEPS.length - 1 && <div style={{ width: "2px", flex: 1, background: C.border, minHeight: "8px" }} />}
                      </div>
                      <div style={{
                        flex: 1, padding: "10px 14px", borderRadius: "8px",
                        background: C.surface, border: "1px solid " + C.border,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: sc }}>{step.label}</span>
                          <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{step.time}</span>
                          <span style={{ fontSize: "9px", color: C.amber }}>{step.cost}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: C.textMuted }}>{step.detail}</div>
                      </div>
                    </div>
                  );
                })}

                {distillStep >= DISTILL_STEPS.length && !distillPlaying && (
                  <div style={{
                    padding: "14px", borderRadius: "10px", marginTop: "10px",
                    background: C.green + "08", border: "1px solid " + C.green + "22",
                    display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center",
                  }}>
                    {[
                      { label: "Aluno (destilado)", value: "94.5%", color: C.green },
                      { label: "Professor (Sonnet)", value: "96.2%", color: C.purple },
                      { label: "Baseline (prompt)", value: "91.0%", color: C.amber },
                      { label: "Custo total", value: "~$60", color: C.cyan },
                      { label: "Gap professor", value: "1.7%", color: C.green },
                      { label: "Ganho vs baseline", value: "+3.5%", color: C.green },
                    ].map(function(m) {
                      return (
                        <div key={m.label} style={{ textAlign: "center", padding: "6px 10px" }}>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: m.color }}>{m.value}</div>
                          <div style={{ fontSize: "8px", color: C.textDim }}>{m.label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EVALUATION */}
        {activeTab === "eval" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Confusion matrix e metricas por categoria. Compare baseline (prompt) vs fine-tuned para ver onde melhorou.
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {[
                { id: "baseline", label: "Baseline (prompt few-shot)", color: C.amber },
                { id: "finetuned", label: "Fine-tuned (destilado)", color: C.green },
              ].map(function(m) {
                return (
                  <button key={m.id} onClick={function() { setMatrixModel(m.id); }} style={{
                    flex: 1, padding: "10px", borderRadius: "8px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                    border: "1px solid " + (matrixModel === m.id ? m.color : C.border),
                    background: matrixModel === m.id ? m.color + "12" : C.surface,
                    color: matrixModel === m.id ? m.color : C.textDim,
                  }}>{m.label}</button>
                );
              })}
            </div>

            {/* Matrix */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px", overflowX: "auto",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>CONFUSION MATRIX (% por linha)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "6px", textAlign: "left", color: C.textDim, fontSize: "8px" }}>Real \ Predito</th>
                    {CATEGORIES.map(function(cat) {
                      return <th key={cat} style={{ padding: "6px", textAlign: "center", color: C.textDim, fontSize: "8px" }}>{cat.substring(0, 5)}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map(function(cat, i) {
                    return (
                      <tr key={cat}>
                        <td style={{ padding: "6px", color: C.text, fontWeight: 600, fontSize: "9px" }}>{cat.substring(0, 5)}</td>
                        {CONFUSION[matrixModel][i].map(function(val, j) {
                          var isDiag = i === j;
                          var isHigh = val >= 85;
                          var isConfusion = !isDiag && val >= 5;
                          var bg = isDiag ? (isHigh ? C.green + "20" : C.amber + "20") : isConfusion ? C.red + "15" : "transparent";
                          var color = isDiag ? (isHigh ? C.green : C.amber) : isConfusion ? C.red : C.textDim;
                          return (
                            <td key={j} style={{
                              padding: "6px", textAlign: "center",
                              background: bg, color: color,
                              fontWeight: isDiag ? 800 : isConfusion ? 700 : 400,
                              borderRadius: "3px",
                            }}>{val}</td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Per-category metrics */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr",
                padding: "8px 14px", borderBottom: "1px solid " + C.border,
                fontSize: "8px", fontWeight: 700, color: C.textDim,
              }}>
                <div>CATEGORIA</div><div>PRECISION</div><div>RECALL</div><div>F1-SCORE</div>
              </div>
              {CATEGORIES.map(function(cat, i) {
                var m = calcMetrics(CONFUSION[matrixModel], i);
                var f1Color = m.f1 >= 0.9 ? C.green : m.f1 >= 0.8 ? C.amber : C.red;
                return (
                  <div key={cat} style={{
                    display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < CATEGORIES.length - 1 ? "1px solid " + C.border : "none",
                  }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: m.precision >= 0.9 ? C.green : C.amber }}>{(m.precision * 100).toFixed(1)}%</span>
                    <span style={{ color: m.recall >= 0.9 ? C.green : C.amber }}>{(m.recall * 100).toFixed(1)}%</span>
                    <span style={{ color: f1Color, fontWeight: 700 }}>{(m.f1 * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>

            {matrixModel === "baseline" && (
              <div style={{
                marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
                background: C.red + "08", border: "1px solid " + C.red + "22",
                fontSize: "10px", color: C.textMuted, lineHeight: 1.6,
              }}>
                <span style={{ color: C.red, fontWeight: 700 }}>Problemas no baseline: </span>
                REFORMA confundida com MANUTENCAO (12%). ORCAMENTO confundido com CONSTRUCAO (10%). CONSTRUCAO confundida com ORCAMENTO (10%).
              </div>
            )}
            {matrixModel === "finetuned" && (
              <div style={{
                marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
                background: C.green + "08", border: "1px solid " + C.green + "22",
                fontSize: "10px", color: C.textMuted, lineHeight: 1.6,
              }}>
                <span style={{ color: C.green, fontWeight: 700 }}>Melhorias com fine-tuning: </span>
                REFORMA vs MANUTENCAO caiu de 12% para 8%. ORCAMENTO vs CONSTRUCAO caiu de 10% para 4%. EMERGENCIA subiu para 96% (critico). Confusao residual: REFORMA com MANUTENCAO (8%) — proximo alvo.
              </div>
            )}
          </div>
        )}

        {/* REGISTRY */}
        {activeTab === "registry" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Versionamento de modelos. Cada versao com metricas, tecnica e status. Shadow deploy testa v4 sem risco.
            </p>

            {MODELS.map(function(model, i) {
              var sc = model.status === "production" ? C.green : model.status === "shadow" ? C.amber : C.textDim;
              return (
                <div key={model.version} style={{
                  background: C.surface, border: "1px solid " + (model.status === "production" ? C.green + "33" : model.status === "shadow" ? C.amber + "33" : C.border),
                  borderRadius: "10px", marginBottom: "8px", padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: sc }}>{model.version}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{model.name}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px",
                      background: sc + "15", color: sc, marginLeft: "auto",
                    }}>{model.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", fontSize: "10px" }}>
                    <div><span style={{ color: C.textDim, fontSize: "8px" }}>Acuracia:</span><br /><span style={{ color: model.accuracy >= 94 ? C.green : C.amber, fontWeight: 700 }}>{model.accuracy}%</span></div>
                    <div><span style={{ color: C.textDim, fontSize: "8px" }}>$/call:</span><br /><span style={{ color: C.amber }}>${model.cost}</span></div>
                    <div><span style={{ color: C.textDim, fontSize: "8px" }}>Latencia:</span><br /><span style={{ color: model.latency <= 200 ? C.green : C.textMuted }}>{model.latency}ms</span></div>
                    <div><span style={{ color: C.textDim, fontSize: "8px" }}>Data:</span><br /><span style={{ color: C.textMuted }}>{model.date}</span></div>
                    <div><span style={{ color: C.textDim, fontSize: "8px" }}>Tecnica:</span><br /><span style={{ color: C.textMuted }}>{model.technique}</span></div>
                  </div>
                  <div style={{ fontSize: "9px", color: C.textDim, marginTop: "4px" }}>Dataset: {model.dataset}</div>
                </div>
              );
            })}

            <div style={{
              padding: "12px 14px", borderRadius: "8px", marginTop: "8px",
              background: C.amber + "08", border: "1px solid " + C.amber + "22",
              fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Shadow deploy (v4): </span>
              Modelo v4 roda em paralelo com v3. Cada request e processado por ambos. Output de v4 e logado mas nao usado. Se v4 for melhor em 95%+ dos casos apos 1 semana, promovido para producao.
            </div>
          </div>
        )}

        {/* BREAKEVEN */}
        {activeTab === "breakeven" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Arraste o slider de volume para ver quando fine-tuning começa a compensar financeiramente.
            </p>

            {/* Volume slider */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "10px", color: C.textDim, width: "80px" }}>Calls/dia:</span>
                <input type="range" min="10" max="10000" value={calcVolume}
                  onChange={function(e) { setCalcVolume(parseInt(e.target.value)); }}
                  style={{ flex: 1, accentColor: C.cyan }}
                />
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.cyan, width: "60px", textAlign: "right" }}>{calcVolume}</span>
              </div>
            </div>

            {/* Results */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Custo prompt/mes", value: "$" + monthlyPrompt.toFixed(2), color: C.red },
                { label: "Custo FT/mes", value: "$" + monthlyFT.toFixed(2), color: C.green },
                { label: "Economia/mes", value: "$" + ((monthlyPrompt - monthlyFT)).toFixed(2), color: C.cyan },
                { label: "Setup", value: "$150", color: C.amber },
                { label: "Breakeven", value: breakeven === Infinity ? "Nunca" : breakeven + " dias", color: breakeven <= 30 ? C.green : breakeven <= 180 ? C.amber : C.red },
                { label: "Veredicto", value: breakeven <= 90 ? "VALE" : "NAO VALE", color: breakeven <= 90 ? C.green : C.red },
              ].map(function(m) {
                return (
                  <div key={m.label} style={{
                    flex: 1, minWidth: "90px", padding: "12px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{m.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Visual comparison */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>CUSTO MENSAL: PROMPT vs FINE-TUNED</div>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "60px", marginBottom: "8px" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: C.red, fontWeight: 700, marginBottom: "4px" }}>${monthlyPrompt.toFixed(2)}</div>
                  <div style={{
                    height: Math.min(60, Math.max(4, monthlyPrompt * 2)) + "px",
                    background: C.red, borderRadius: "4px 4px 0 0", margin: "0 auto", width: "60%",
                  }} />
                  <div style={{ fontSize: "9px", color: C.textDim, marginTop: "4px" }}>Prompt</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: C.green, fontWeight: 700, marginBottom: "4px" }}>${monthlyFT.toFixed(2)}</div>
                  <div style={{
                    height: Math.min(60, Math.max(4, monthlyFT * 2)) + "px",
                    background: C.green, borderRadius: "4px 4px 0 0", margin: "0 auto", width: "60%",
                  }} />
                  <div style={{ fontSize: "9px", color: C.textDim, marginTop: "4px" }}>Fine-tuned</div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: "10px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.7,
            }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>Tente: </span>
              30 calls/dia = breakeven 333 dias (NAO vale). 300 calls/dia = breakeven 33 dias (talvez). 1.000+ calls/dia = breakeven 10 dias (VALE). 5.000 calls/dia = breakeven 2 dias (vale MUITO).
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Destilacao: performance de Sonnet, custo de Haiku",
                color: C.purple,
                text: "PROFESSOR: Sonnet classifica 2.700 leads ($8)\nFILTRAR: remover baixa confianca → 2.300 exemplos\nVALIDAR: domain expert revisa 5% (R$50)\nTREINAR: Haiku LoRA com dataset destilado ($50)\nRESULTADO: 94.5% (vs 96.2% do professor)\n\nGap de apenas 1.7% do professor, com 60% menos custo por call e 50% menos latencia.\n\nQuando usar: quando quer qualidade de modelo grande com custo de modelo pequeno. Mais barato e rapido que coletar dados humanos.",
              },
              {
                title: "Confusion matrix: onde o modelo erra",
                color: C.amber,
                text: "Accuracy nao conta a historia completa.\n\nA confusion matrix mostra EXATAMENTE quais categorias sao confundidas:\n- REFORMA vs MANUTENCAO: 8% de confusao\n- ORCAMENTO vs CONSTRUCAO: 4% de confusao\n- EMERGENCIA: 96% (excelente — critico funcionar)\n\nACOES baseadas na matrix:\n- Adicionar mais exemplos de REFORMA vs MANUTENCAO\n- Criar few-shots especificos para edge cases\n- Monitorar EMERGENCIA (nao pode cair)\n\nSempre avalie POR CATEGORIA, nao so accuracy geral.",
              },
              {
                title: "MLOps: manter modelo vivo em producao",
                color: C.green,
                text: "MODEL REGISTRY: versionar modelos como codigo\n  v1 (prompt) -> v2 (fine-tuned) -> v3 (destilado) -> v4 (retreinado)\n\nSHADOW DEPLOY: testar sem risco\n  Novo modelo roda em paralelo, output logado mas nao usado.\n  Se melhor em 95%+ dos casos → promover.\n\nRETREINAMENTO:\n  Trigger: acuracia cai >2%, ou a cada 3 meses, ou 500+ novos exemplos.\n  Sempre avaliar no teste antes de deploy.\n\nROLLBACK: trocar versao no config. <1 minuto.",
              },
              {
                title: "Breakeven: a matematica da decisao",
                color: C.red,
                text: "FORMULA:\n  Economia/dia = volume * (custo_prompt - custo_ft)\n  Breakeven = setup_cost / economia_dia\n\nEXEMPLOS:\n  30 calls/dia: breakeven 333 dias → NAO vale\n  300 calls/dia: breakeven 33 dias → TALVEZ\n  1.000 calls/dia: breakeven 10 dias → VALE\n  5.000 calls/dia: breakeven 2 dias → VALE MUITO\n\nREGRA PRATICA: se breakeven > 90 dias, nao faca.\nSe < 30 dias, faca. Entre 30-90, avalie outros fatores (latencia, acuracia).\n\nCosta Lima hoje (30/dia): NAO vale.\nCosta Lima franquias (5.000/dia): vale MUITO.",
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
