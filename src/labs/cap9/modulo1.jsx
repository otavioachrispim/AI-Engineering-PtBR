import { useState, useCallback, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DECISION TREE
// ============================================================
var DECISION_QUESTIONS = [
  { q: "Prompt engineering (few-shot, CoT) ja foi esgotado?", yes: 1, no: "stop_prompt", noLabel: "Esgote prompt engineering primeiro. Custo: $0." },
  { q: "RAG com documentos da empresa ja foi implementado?", yes: 2, no: "stop_rag", noLabel: "Implemente RAG primeiro. Custo: ~$0.02." },
  { q: "A acuracia/qualidade ainda esta abaixo da meta?", yes: 3, no: "stop_good", noLabel: "Prompt + RAG ja atende. Fine-tuning desnecessario." },
  { q: "Voce tem 500+ exemplos de alta qualidade?", yes: 4, no: "stop_data", noLabel: "Colete mais dados antes. Minimo: 500 exemplos curados." },
  { q: "O volume justifica o custo (>1000 calls/dia)?", yes: 5, no: "stop_volume", noLabel: "Volume baixo. Custo de fine-tuning nao se paga." },
  { q: "Os dados sao estaveis (nao mudam toda semana)?", yes: "go", no: "stop_change", noLabel: "Dados mudam frequentemente. RAG e melhor (atualiza instantaneamente)." },
];

var DECISION_RESULTS = {
  stop_prompt: { color: C.green, icon: "\u2705", verdict: "Use Prompt Engineering", level: 1 },
  stop_rag: { color: C.cyan, icon: "\uD83D\uDD0D", verdict: "Implemente RAG", level: 2 },
  stop_good: { color: C.green, icon: "\uD83C\uDF89", verdict: "Ja esta bom! Nao precisa de fine-tuning", level: 3 },
  stop_data: { color: C.amber, icon: "\uD83D\uDCCA", verdict: "Colete mais dados primeiro", level: 3 },
  stop_volume: { color: C.amber, icon: "\uD83D\uDCB0", verdict: "Volume nao justifica o custo", level: 4 },
  stop_change: { color: C.amber, icon: "\uD83D\uDD04", verdict: "Dados instáveis — prefira RAG", level: 4 },
  go: { color: C.purple, icon: "\uD83D\uDE80", verdict: "Fine-tuning RECOMENDADO", level: 5 },
};

// ============================================================
// DATASET EXAMPLES
// ============================================================
var DATASET_EXAMPLES = [
  { input: "Quero fazer uma piscina 8x4 com prainha", output: "CONSTRUCAO", confidence: 0.95, quality: "good" },
  { input: "Preciso trocar o vinil da piscina", output: "REFORMA", confidence: 0.90, quality: "good" },
  { input: "Minha piscina esta com agua verde", output: "MANUTENCAO", confidence: 0.92, quality: "good" },
  { input: "URGENTE bomba vazando agua", output: "EMERGENCIA", confidence: 0.98, quality: "good" },
  { input: "Gostaria de um orcamento", output: "ORCAMENTO", confidence: 0.88, quality: "good" },
  { input: "Quero colocar iluminacao LED", output: "REFORMA", confidence: 0.85, quality: "edge" },
  { input: "Want to build a pool", output: "CONSTRUCAO", confidence: 0.80, quality: "edge" },
  { input: "Meu vizinho indicou voces", output: "CONSTRUCAO", confidence: 0.60, quality: "ambiguous" },
  { input: "Preciso de ajuda com a piscina", output: "INDEFINIDO", confidence: 0.45, quality: "ambiguous" },
  { input: "Bom dia!", output: "SAUDACAO", confidence: 0.95, quality: "good" },
];

var DATASET_STATS = {
  total: 1247,
  categories: [
    { name: "CONSTRUCAO", count: 312, pct: 25 },
    { name: "REFORMA", count: 248, pct: 20 },
    { name: "MANUTENCAO", count: 287, pct: 23 },
    { name: "ORCAMENTO", count: 198, pct: 16 },
    { name: "EMERGENCIA", count: 87, pct: 7 },
    { name: "SAUDACAO", count: 62, pct: 5 },
    { name: "INDEFINIDO", count: 53, pct: 4 },
  ],
  split: { train: 998, val: 125, test: 124 },
};

// ============================================================
// TRAINING SIMULATION
// ============================================================
var TRAINING_EPOCHS = [
  { epoch: 1, trainLoss: 2.45, valLoss: 2.52, accuracy: 62, time: "2min" },
  { epoch: 2, trainLoss: 1.82, valLoss: 1.95, accuracy: 71, time: "4min" },
  { epoch: 3, trainLoss: 1.25, valLoss: 1.48, accuracy: 79, time: "6min" },
  { epoch: 4, trainLoss: 0.85, valLoss: 1.12, accuracy: 85, time: "8min" },
  { epoch: 5, trainLoss: 0.52, valLoss: 0.88, accuracy: 89, time: "10min" },
  { epoch: 6, trainLoss: 0.35, valLoss: 0.75, accuracy: 92, time: "12min" },
  { epoch: 7, trainLoss: 0.22, valLoss: 0.72, accuracy: 94, time: "14min" },
  { epoch: 8, trainLoss: 0.15, valLoss: 0.74, accuracy: 94.5, time: "16min" },
  { epoch: 9, trainLoss: 0.10, valLoss: 0.78, accuracy: 94.2, time: "18min" },
  { epoch: 10, trainLoss: 0.07, valLoss: 0.82, accuracy: 93.8, time: "20min" },
];

// ============================================================
// COMPARISON DATA
// ============================================================
var COMPARISON = [
  { method: "Zero-shot", accuracy: 78, cost: 0.0005, latency: 340, setup: "$0", monthly: "$15", maintenance: "Nenhuma" },
  { method: "Few-shot (5)", accuracy: 91, cost: 0.0008, latency: 380, setup: "$0", monthly: "$24", maintenance: "Atualizar exemplos" },
  { method: "Few-shot + RAG", accuracy: 93, cost: 0.001, latency: 450, setup: "$0.02", monthly: "$30", maintenance: "Reindexar docs" },
  { method: "Fine-tuned (LoRA)", accuracy: 94.5, cost: 0.0003, latency: 180, setup: "$150", monthly: "$9", maintenance: "Retreinar trimestral" },
  { method: "Fine-tuned + RAG", accuracy: 96, cost: 0.0006, latency: 280, setup: "$150", monthly: "$18", maintenance: "Retreinar + reindexar" },
];

// ============================================================
// MAIN APP
// ============================================================
export default function FineTuningLab() {
  var [activeTab, setActiveTab] = useState("decision");
  var [decisionStep, setDecisionStep] = useState(0);
  var [decisionResult, setDecisionResult] = useState(null);
  var [trainingEpoch, setTrainingEpoch] = useState(0);
  var [training, setTraining] = useState(false);

  var answerYes = function() {
    var q = DECISION_QUESTIONS[decisionStep];
    if (typeof q.yes === "number") setDecisionStep(q.yes);
    else { setDecisionResult(q.yes); }
  };
  var answerNo = function() {
    var q = DECISION_QUESTIONS[decisionStep];
    setDecisionResult(q.no);
  };
  var resetDecision = function() { setDecisionStep(0); setDecisionResult(null); };

  var startTraining = useCallback(function() {
    setTrainingEpoch(0);
    setTraining(true);
    TRAINING_EPOCHS.forEach(function(_, i) {
      setTimeout(function() {
        setTrainingEpoch(i + 1);
        if (i === TRAINING_EPOCHS.length - 1) setTraining(false);
      }, (i + 1) * 500);
    });
  }, []);

  var bestEpoch = 7; // epoch with lowest val_loss

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Cap 9 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Fine-Tuning: Quando e Como
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Arvore de decisao | Dataset | Treinamento | Avaliacao comparativa
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "decision", label: "Preciso de Fine-Tuning?" },
            { id: "dataset", label: "Dataset" },
            { id: "training", label: "Treinamento" },
            { id: "compare", label: "Comparacao" },
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

        {/* DECISION */}
        {activeTab === "decision" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Responda as perguntas para descobrir se fine-tuning faz sentido para o seu caso. A maioria dos projetos para antes de chegar ao final.
            </p>

            {!decisionResult ? (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", padding: "20px",
              }}>
                {/* Progress */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {DECISION_QUESTIONS.map(function(_, i) {
                    return (
                      <div key={i} style={{
                        flex: 1, height: "4px", borderRadius: "2px",
                        background: i < decisionStep ? C.green : i === decisionStep ? C.amber : C.border,
                      }} />
                    );
                  })}
                </div>

                <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px" }}>Pergunta {decisionStep + 1} de {DECISION_QUESTIONS.length}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "16px" }}>
                  {DECISION_QUESTIONS[decisionStep].q}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={answerYes} style={{
                    flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                    background: C.green, color: "#fff", fontSize: "13px",
                    fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  }}>Sim</button>
                  <button onClick={answerNo} style={{
                    flex: 1, padding: "12px", borderRadius: "8px", border: "none",
                    background: C.red, color: "#fff", fontSize: "13px",
                    fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  }}>Nao</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: "20px", borderRadius: "10px", textAlign: "center",
                  background: DECISION_RESULTS[decisionResult].color + "10",
                  border: "2px solid " + DECISION_RESULTS[decisionResult].color + "44",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>{DECISION_RESULTS[decisionResult].icon}</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: DECISION_RESULTS[decisionResult].color }}>
                    {DECISION_RESULTS[decisionResult].verdict}
                  </div>
                  {decisionResult !== "go" && (
                    <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "6px" }}>
                      {DECISION_QUESTIONS[decisionStep] && DECISION_QUESTIONS[decisionStep].noLabel}
                    </div>
                  )}
                  {decisionResult === "go" && (
                    <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "6px" }}>
                      Todas as condicoes atendidas. Fine-tuning pode gerar valor. Proximos passos: montar dataset, escolher tecnica (LoRA recomendado), treinar e avaliar.
                    </div>
                  )}
                </div>

                {/* Pyramid */}
                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>PIRAMIDE DE CUSTOMIZACAO</div>
                  {[
                    { level: 1, name: "Prompt Engineering", cost: "$0", time: "Minutos", pct: "70-80%", color: C.green },
                    { level: 2, name: "RAG", cost: "~$0.02", time: "Horas", pct: "85-90%", color: C.cyan },
                    { level: 3, name: "System Prompt Avancado", cost: "$0", time: "Horas", pct: "90-95%", color: C.amber },
                    { level: 4, name: "Fine-tuning", cost: "$50-500+", time: "Dias", pct: "95-98%", color: C.purple },
                  ].map(function(l) {
                    var isActive = l.level <= DECISION_RESULTS[decisionResult].level;
                    return (
                      <div key={l.level} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 10px", borderRadius: "6px", marginBottom: "4px",
                        background: isActive ? l.color + "08" : "transparent",
                        border: "1px solid " + (isActive ? l.color + "22" : "transparent"),
                        opacity: isActive ? 1 : 0.4,
                      }}>
                        <span style={{ fontWeight: 800, color: l.color, width: "18px" }}>{l.level}</span>
                        <span style={{ color: C.text, fontWeight: 600, flex: 1 }}>{l.name}</span>
                        <span style={{ color: C.textDim, fontSize: "9px" }}>{l.cost}</span>
                        <span style={{ color: C.textDim, fontSize: "9px" }}>{l.time}</span>
                        <span style={{ color: l.color, fontWeight: 700, fontSize: "10px" }}>{l.pct}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={resetDecision} style={{
                  marginTop: "12px", padding: "8px 16px", borderRadius: "6px",
                  border: "1px solid " + C.border, background: C.surfaceAlt,
                  color: C.textMuted, fontSize: "10px", fontFamily: "inherit", cursor: "pointer",
                }}>Recomecar</button>
              </div>
            )}
          </div>
        )}

        {/* DATASET */}
        {activeTab === "dataset" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Dataset simulado de {DATASET_STATS.total} exemplos extraidos do LeadHistorico do Costa Lima. Fine-tuning e 80% dados, 20% treinamento.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Total exemplos", value: DATASET_STATS.total, color: C.text },
                { label: "Treino", value: DATASET_STATS.split.train, color: C.green },
                { label: "Validacao", value: DATASET_STATS.split.val, color: C.amber },
                { label: "Teste", value: DATASET_STATS.split.test, color: C.red },
                { label: "Categorias", value: DATASET_STATS.categories.length, color: C.purple },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "80px", padding: "10px 6px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "7px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Distribution */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>DISTRIBUICAO POR CATEGORIA</div>
              {DATASET_STATS.categories.map(function(cat) {
                var color = cat.pct >= 20 ? C.green : cat.pct >= 10 ? C.amber : C.cyan;
                return (
                  <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "10px" }}>
                    <span style={{ color: C.text, fontWeight: 600, width: "100px" }}>{cat.name}</span>
                    <div style={{ flex: 1, height: "8px", background: C.bg, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: cat.pct + "%", height: "100%", background: color, borderRadius: "4px" }} />
                    </div>
                    <span style={{ color: color, fontWeight: 700, width: "30px", textAlign: "right" }}>{cat.pct}%</span>
                    <span style={{ color: C.textDim, width: "35px", textAlign: "right" }}>{cat.count}</span>
                  </div>
                );
              })}
            </div>

            {/* Examples */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.textDim }}>
                EXEMPLOS DO DATASET (formato JSONL messages)
              </div>
              {DATASET_EXAMPLES.map(function(ex, i) {
                var qColor = ex.quality === "good" ? C.green : ex.quality === "edge" ? C.amber : C.red;
                return (
                  <div key={i} style={{
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < DATASET_EXAMPLES.length - 1 ? "1px solid " + C.border : "none",
                    background: ex.quality === "ambiguous" ? C.red + "04" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: qColor + "15", color: qColor }}>
                        {ex.quality === "good" ? "BOM" : ex.quality === "edge" ? "EDGE" : "AMBIGUO"}
                      </span>
                      <span style={{ color: C.textMuted, flex: 1 }}>"{ex.input}"</span>
                      <span style={{ color: C.cyan, fontWeight: 700 }}>{ex.output}</span>
                      <span style={{ color: ex.confidence >= 0.8 ? C.green : C.amber, fontSize: "9px" }}>{(ex.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TRAINING */}
        {activeTab === "training" && (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <button onClick={startTraining} disabled={training} style={{
                padding: "10px 24px", borderRadius: "8px", border: "none",
                background: training ? C.surfaceAlt : C.purple,
                color: training ? C.textDim : "#fff", fontSize: "12px",
                fontWeight: 700, fontFamily: "inherit", cursor: training ? "default" : "pointer",
              }}>
                {training ? "Treinando..." : "\u25B6 Iniciar Fine-tuning (LoRA)"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: C.textDim }}>
                <span>Modelo: Haiku</span><span>|</span><span>LoRA rank: 16</span><span>|</span><span>Epochs: 10</span>
              </div>
            </div>

            {trainingEpoch > 0 && (
              <div>
                {/* Loss chart */}
                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>LOSS E ACURACIA POR EPOCH</div>
                  <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "80px", marginBottom: "8px" }}>
                    {TRAINING_EPOCHS.slice(0, trainingEpoch).map(function(e, i) {
                      var accH = (e.accuracy / 100) * 70;
                      var isBest = e.epoch === bestEpoch;
                      return (
                        <div key={i} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "8px", color: isBest ? C.green : C.textDim, fontWeight: isBest ? 800 : 400 }}>{e.accuracy}%</div>
                          <div style={{
                            height: accH + "px", borderRadius: "3px 3px 0 0",
                            background: isBest ? C.green : e.epoch > bestEpoch ? C.red + "60" : C.cyan,
                            margin: "0 auto", width: "70%",
                          }} />
                          <div style={{ fontSize: "7px", color: C.textDim, marginTop: "2px" }}>E{e.epoch}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "9px", color: C.textDim }}>
                    <span><span style={{ color: C.cyan }}>{"\u25A0"}</span> Acuracia subindo</span>
                    <span><span style={{ color: C.green }}>{"\u25A0"}</span> Melhor epoch</span>
                    <span><span style={{ color: C.red + "60" }}>{"\u25A0"}</span> Overfitting</span>
                  </div>
                </div>

                {/* Epoch table */}
                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr 60px",
                    padding: "8px 14px", borderBottom: "1px solid " + C.border,
                    fontSize: "8px", fontWeight: 700, color: C.textDim,
                  }}>
                    <div>EPOCH</div><div>TRAIN LOSS</div><div>VAL LOSS</div><div>ACCURACY</div><div>TEMPO</div>
                  </div>
                  {TRAINING_EPOCHS.slice(0, trainingEpoch).map(function(e) {
                    var isBest = e.epoch === bestEpoch;
                    var isOverfit = e.epoch > bestEpoch;
                    return (
                      <div key={e.epoch} style={{
                        display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr 60px",
                        padding: "6px 14px", fontSize: "10px",
                        borderBottom: "1px solid " + C.border,
                        background: isBest ? C.green + "06" : isOverfit ? C.red + "04" : "transparent",
                      }}>
                        <span style={{ fontWeight: 700, color: isBest ? C.green : C.text }}>
                          {e.epoch} {isBest ? "\u2605" : ""}
                        </span>
                        <span style={{ color: C.textMuted }}>{e.trainLoss.toFixed(2)}</span>
                        <span style={{ color: isOverfit ? C.red : C.green }}>{e.valLoss.toFixed(2)}</span>
                        <span style={{ color: e.accuracy >= 94 ? C.green : C.amber }}>{e.accuracy}%</span>
                        <span style={{ color: C.textDim }}>{e.time}</span>
                      </div>
                    );
                  })}
                </div>

                {trainingEpoch >= 8 && !training && (
                  <div style={{
                    marginTop: "10px", padding: "12px 14px", borderRadius: "8px",
                    background: C.amber + "08", border: "1px solid " + C.amber + "22",
                    fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
                  }}>
                    <span style={{ color: C.amber, fontWeight: 700 }}>Overfitting detectado a partir do epoch 8! </span>
                    Train loss continua caindo mas val loss sobe. Melhor modelo: <span style={{ color: C.green, fontWeight: 700 }}>epoch 7</span> (val_loss 0.72, accuracy 94.0%). Usar early stopping.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COMPARE */}
        {activeTab === "compare" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Comparacao direta: prompt engineering vs RAG vs fine-tuning para classificacao de leads no Costa Lima.
            </p>

            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "140px 65px 70px 60px 60px 60px 120px",
                padding: "8px 14px", borderBottom: "1px solid " + C.border,
                fontSize: "8px", fontWeight: 700, color: C.textDim,
              }}>
                <div>METODO</div><div>ACURACIA</div><div>$/CALL</div><div>LATENCIA</div><div>SETUP</div><div>$/MES</div><div>MANUTENCAO</div>
              </div>
              {COMPARISON.map(function(c, i) {
                var accColor = c.accuracy >= 94 ? C.green : c.accuracy >= 90 ? C.cyan : C.amber;
                var isBest = c.accuracy >= 94;
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "140px 65px 70px 60px 60px 60px 120px",
                    padding: "10px 14px", fontSize: "10px", alignItems: "center",
                    borderBottom: i < COMPARISON.length - 1 ? "1px solid " + C.border : "none",
                    background: isBest ? C.green + "04" : "transparent",
                  }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{c.method}</span>
                    <span style={{ color: accColor, fontWeight: 700 }}>{c.accuracy}%</span>
                    <span style={{ color: C.amber }}>${c.cost}</span>
                    <span style={{ color: c.latency <= 200 ? C.green : C.textMuted }}>{c.latency}ms</span>
                    <span style={{ color: C.textDim }}>{c.setup}</span>
                    <span style={{ color: C.textDim }}>{c.monthly}</span>
                    <span style={{ color: C.textDim, fontSize: "9px" }}>{c.maintenance}</span>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>Analise para o Costa Lima (30 calls/dia): </span>
              Few-shot + RAG (93%) vs Fine-tuned + RAG (96%). Ganho: +3% acuracia. Custo: +$150 setup + retreino trimestral. Para 30 calls/dia, o ganho de $0.0004/call economiza $0.36/mes. O setup se paga em 416 meses. <span style={{ color: C.red, fontWeight: 700 }}>Veredicto: NAO vale para o volume atual.</span>
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "A regra dos 95%: quando NAO fazer fine-tuning",
                color: C.red,
                text: "95% dos projetos de IA NAO precisam de fine-tuning.\n\nPergunte-se:\n1. Prompt engineering foi esgotado? (few-shot, CoT, system prompt)\n2. RAG foi implementado? (documentos no contexto)\n3. A acuracia ainda esta abaixo da meta?\n4. Tenho 500+ exemplos de alta qualidade?\n5. Volume justifica? (>1000 calls/dia)\n6. Dados sao estaveis?\n\nSe alguma resposta e NAO -> fine-tuning e prematuro.\n\nCosta Lima hoje: 30 calls/dia, 93% acuracia com prompt+RAG.\nVeredicto: NAO precisa de fine-tuning agora.",
              },
              {
                title: "Dataset: a parte mais importante",
                color: C.amber,
                text: "Fine-tuning e 80% dados, 20% treinamento.\n\nREGRAS:\n  Qualidade > quantidade (500 curados > 5000 automaticos)\n  Distribuicao balanceada entre categorias\n  Edge cases incluidos (os 8% que prompt erra)\n  Dados pessoais removidos (LGPD)\n  Domain expert valida 10% da amostra\n  Split: 80% treino, 10% validacao, 10% teste\n\nFORMATO: JSONL com messages (system, user, assistant)\n\nPIPELINE no Costa Lima:\n  LeadHistorico -> filtrar confirmados -> balancear -> limpar -> JSONL",
              },
              {
                title: "Tipos de fine-tuning e quando usar cada",
                color: C.purple,
                text: "LoRA / QLoRA (RECOMENDADO para maioria):\n  Ajusta adaptadores (poucos parametros). $50-200.\n  Dataset: 500-5.000 exemplos. Resultado: quase igual a FFT.\n\nFull Fine-tuning:\n  Ajusta TODOS os parametros. $500+.\n  Dataset: 10.000+. Risco de catastrophic forgetting.\n  Quando: necessidades muito especificas.\n\nDistillation (custo-eficiente):\n  Modelo grande gera dados, modelo pequeno aprende.\n  Performance de Sonnet com custo de Haiku.\n  Quando: quer reduzir custo mantendo qualidade.\n\nRLHF / DPO:\n  Treina com preferencias humanas (qual resposta e melhor?).\n  Quando: ajustar tom, estilo, julgamento.",
              },
              {
                title: "Overfitting: o inimigo do fine-tuning",
                color: C.red,
                text: "SINTOMA: train loss cai, val loss sobe.\nSignifica: modelo memoriza treino mas nao generaliza.\n\nVeja no lab: a partir do epoch 8, val loss comeca a subir.\nMelhor modelo: epoch 7 (val_loss mais baixo).\n\nPREVENCAO:\n  1. Early stopping (parar quando val_loss sobe)\n  2. Regularization (weight decay, dropout)\n  3. Dataset maior e mais diverso\n  4. LoRA rank menor (menos parametros)\n  5. Menos epochs (5-10 geralmente suficiente)\n\nSEMPRE avalie no dataset de TESTE (nunca visto).",
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
