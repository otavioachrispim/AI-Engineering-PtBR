import { useState, useCallback, useMemo } from "react";

// ============================================================
// SISTEMA 1: CLASSIFICADOR BASEADO EM REGRAS
// ============================================================
const POSITIVE_WORDS = [
  "bom", "ótimo", "excelente", "maravilhoso", "adorei", "amei", "perfeito",
  "recomendo", "incrível", "fantástico", "satisfeito", "gostei", "top",
  "boa", "ótima", "melhor", "bonito", "rápido", "eficiente", "funciona"
];

const NEGATIVE_WORDS = [
  "ruim", "péssimo", "horrível", "terrível", "odiei", "lixo", "quebrou",
  "defeito", "decepcionado", "pior", "não recomendo", "fraco", "caro",
  "demora", "lento", "problema", "falha", "decepção", "arrependido", "detestei"
];

function ruleBasedClassifier(text) {
  const lower = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;
  const matchedPos = [];
  const matchedNeg = [];

  POSITIVE_WORDS.forEach(w => {
    if (lower.includes(w)) { posCount++; matchedPos.push(w); }
  });
  NEGATIVE_WORDS.forEach(w => {
    if (lower.includes(w)) { negCount++; matchedNeg.push(w); }
  });

  let label, confidence;
  if (posCount === 0 && negCount === 0) {
    label = "indefinido";
    confidence = 0;
  } else if (posCount > negCount) {
    label = "positivo";
    confidence = posCount / (posCount + negCount);
  } else if (negCount > posCount) {
    label = "negativo";
    confidence = negCount / (posCount + negCount);
  } else {
    label = "indefinido";
    confidence = 0.5;
  }

  return {
    label,
    confidence,
    reasoning: `Encontrou ${posCount} palavra(s) positiva(s)${matchedPos.length ? ` [${matchedPos.join(", ")}]` : ""} e ${negCount} negativa(s)${matchedNeg.length ? ` [${matchedNeg.join(", ")}]` : ""}.`,
    method: "Busca exata por palavras-chave em listas fixas"
  };
}

// ============================================================
// SISTEMA 2: CLASSIFICADOR NAIVE BAYES (TREINADO COM DADOS)
// ============================================================
const TRAINING_DATA = [
  // Positivos
  { text: "Produto excelente, superou minhas expectativas", label: "positivo" },
  { text: "Entrega rápida e produto de qualidade", label: "positivo" },
  { text: "Adorei! Funciona perfeitamente", label: "positivo" },
  { text: "Melhor compra que fiz esse ano", label: "positivo" },
  { text: "Material resistente e bonito design", label: "positivo" },
  { text: "Chegou antes do prazo, muito satisfeito", label: "positivo" },
  { text: "Recomendo muito, vale cada centavo", label: "positivo" },
  { text: "Superou expectativas, produto top demais", label: "positivo" },
  { text: "Minha esposa amou o presente", label: "positivo" },
  { text: "Funciona muito bem, sem reclamações", label: "positivo" },
  { text: "Custo benefício incrível", label: "positivo" },
  { text: "Ótimo acabamento e boa durabilidade", label: "positivo" },
  { text: "Simplesmente perfeito para o que eu precisava", label: "positivo" },
  { text: "Comprei duas vezes já, sempre satisfeito", label: "positivo" },
  { text: "Atendimento nota dez e entrega impecável", label: "positivo" },
  // Negativos
  { text: "Produto chegou com defeito e quebrado", label: "negativo" },
  { text: "Péssima qualidade, não durou uma semana", label: "negativo" },
  { text: "Não funciona como prometido na descrição", label: "negativo" },
  { text: "Demorou muito para chegar e veio errado", label: "negativo" },
  { text: "Decepcionante, parece produto falsificado", label: "negativo" },
  { text: "Dinheiro jogado fora, não vale o preço", label: "negativo" },
  { text: "Já estragou depois de poucos dias de uso", label: "negativo" },
  { text: "Atendimento horrível, ninguém resolve nada", label: "negativo" },
  { text: "Produto completamente diferente da foto", label: "negativo" },
  { text: "Arrependido da compra, quero devolver", label: "negativo" },
  { text: "Veio faltando peças e sem manual", label: "negativo" },
  { text: "Material frágil e acabamento ruim", label: "negativo" },
  { text: "Não recomendo para ninguém, furada total", label: "negativo" },
  { text: "Pior produto que já comprei na vida", label: "negativo" },
  { text: "Travou no primeiro dia de uso", label: "negativo" },
];

function tokenize(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function trainNaiveBayes(data) {
  const vocab = {};
  const classCounts = { positivo: 0, negativo: 0 };
  const classWordCounts = { positivo: {}, negativo: {} };
  const classTotalWords = { positivo: 0, negativo: 0 };

  data.forEach(({ text, label }) => {
    classCounts[label]++;
    const words = tokenize(text);
    words.forEach(w => {
      vocab[w] = true;
      classWordCounts[label][w] = (classWordCounts[label][w] || 0) + 1;
      classTotalWords[label]++;
    });
  });

  const vocabSize = Object.keys(vocab).length;

  function predict(text) {
    const words = tokenize(text);
    const total = data.length;
    const scores = {};
    const details = {};

    ["positivo", "negativo"].forEach(cls => {
      let logProb = Math.log(classCounts[cls] / total);
      const wordInfluences = [];

      words.forEach(w => {
        const count = classWordCounts[cls][w] || 0;
        const prob = (count + 1) / (classTotalWords[cls] + vocabSize); // Laplace
        const logP = Math.log(prob);
        logProb += logP;
        if (count > 0) {
          wordInfluences.push({ word: w, count, prob: prob.toFixed(4) });
        }
      });

      scores[cls] = logProb;
      details[cls] = wordInfluences;
    });

    const maxScore = Math.max(scores.positivo, scores.negativo);
    const expPos = Math.exp(scores.positivo - maxScore);
    const expNeg = Math.exp(scores.negativo - maxScore);
    const probPos = expPos / (expPos + expNeg);
    const probNeg = expNeg / (expPos + expNeg);

    const label = probPos > probNeg ? "positivo" : "negativo";
    const confidence = Math.max(probPos, probNeg);

    const topWords = details[label]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(w => w.word);

    return {
      label: confidence < 0.55 ? "indefinido" : label,
      confidence,
      reasoning: `Probabilidade: ${(probPos * 100).toFixed(1)}% positivo, ${(probNeg * 100).toFixed(1)}% negativo. Palavras influentes: [${topWords.join(", ")}].`,
      method: `Naive Bayes treinado com ${data.length} exemplos, vocabulário de ${vocabSize} palavras`
    };
  }

  return { predict, vocabSize, dataSize: data.length };
}

// ============================================================
// TEST CASES - frases que expõem diferenças
// ============================================================
const TEST_CASES = [
  { text: "Produto muito bom, adorei a qualidade", note: "Caso simples — ambos devem acertar" },
  { text: "Horrível, nunca mais compro", note: "Caso simples negativo" },
  { text: "Não gostei nem um pouco, decepcionante", note: "Negação — regras podem perder o 'não'" },
  { text: "Achei ok, nada especial mas serve", note: "Neutro — como cada sistema lida?" },
  { text: "Entrega demorou mas o produto compensa", note: "Sentimento misto — conflito de sinais" },
  { text: "Veio errado e faltando peça", note: "Sem palavras-chave óbvias — regras falham?" },
  { text: "Parece falsificado, material vagabundo", note: "Gíria/coloquial — o que as regras captam?" },
  { text: "Show de bola, nota 10, comprem sem medo", note: "Linguagem informal positiva" },
  { text: "Superou expectativas, entrega impecável", note: "Palavras do dataset de treino" },
  { text: "Dinheiro jogado no lixo total", note: "Expressão idiomática negativa" },
];

// ============================================================
// UI COMPONENTS
// ============================================================

const COLORS = {
  bg: "#0a0f1a",
  surface: "#111827",
  surfaceLight: "#1a2236",
  border: "#1e2d45",
  borderLight: "#2a3a55",
  text: "#e2e8f0",
  textMuted: "#8899b0",
  textDim: "#5a6a82",
  accent: "#38bdf8",
  accentDim: "#1e6ea1",
  positive: "#22c55e",
  positiveBg: "rgba(34, 197, 94, 0.08)",
  negative: "#ef4444",
  negativeBg: "rgba(239, 68, 68, 0.08)",
  neutral: "#eab308",
  neutralBg: "rgba(234, 179, 8, 0.08)",
  ruleTag: "#a78bfa",
  ruleTagBg: "rgba(167, 139, 250, 0.12)",
  mlTag: "#38bdf8",
  mlTagBg: "rgba(56, 189, 248, 0.12)",
};

function Badge({ label }) {
  const colorMap = {
    positivo: { bg: COLORS.positiveBg, color: COLORS.positive, border: "rgba(34,197,94,0.2)" },
    negativo: { bg: COLORS.negativeBg, color: COLORS.negative, border: "rgba(239,68,68,0.2)" },
    indefinido: { bg: COLORS.neutralBg, color: COLORS.neutral, border: "rgba(234,179,8,0.2)" },
  };
  const c = colorMap[label] || colorMap.indefinido;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {label}
    </span>
  );
}

function ConfidenceBar({ value, color }) {
  return (
    <div style={{
      width: "100%",
      height: "6px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "3px",
      overflow: "hidden",
      marginTop: "6px",
    }}>
      <div style={{
        width: `${(value * 100).toFixed(0)}%`,
        height: "100%",
        background: color,
        borderRadius: "3px",
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

function ResultCard({ title, tagColor, tagBg, result }) {
  if (!result) return null;
  const sentimentColor = result.label === "positivo" ? COLORS.positive
    : result.label === "negativo" ? COLORS.negative : COLORS.neutral;

  return (
    <div style={{
      flex: 1,
      minWidth: "280px",
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "12px",
      padding: "20px",
      transition: "border-color 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          background: tagBg,
          color: tagColor,
        }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <Badge label={result.label} />
        <span style={{ fontSize: "13px", color: COLORS.textMuted }}>
          {(result.confidence * 100).toFixed(0)}% confiança
        </span>
      </div>
      <ConfidenceBar value={result.confidence} color={sentimentColor} />
      <p style={{
        margin: "14px 0 0",
        fontSize: "13px",
        lineHeight: "1.6",
        color: COLORS.textMuted,
      }}>
        {result.reasoning}
      </p>
      <p style={{
        margin: "10px 0 0",
        fontSize: "11px",
        color: COLORS.textDim,
        fontStyle: "italic",
      }}>
        {result.method}
      </p>
    </div>
  );
}

function MatchIndicator({ ruleResult, bayesResult }) {
  if (!ruleResult || !bayesResult) return null;
  const match = ruleResult.label === bayesResult.label;
  const ruleUndefined = ruleResult.label === "indefinido";
  const bayesUndefined = bayesResult.label === "indefinido";

  let icon, text, color;
  if (match && !ruleUndefined) {
    icon = "✓"; text = "Ambos concordam"; color = COLORS.positive;
  } else if (ruleUndefined && !bayesUndefined) {
    icon = "⚡"; text = "Regras falharam — Bayes classificou"; color = COLORS.accent;
  } else if (!match) {
    icon = "✗"; text = "Discordância entre os sistemas"; color = COLORS.negative;
  } else {
    icon = "?"; text = "Ambos incertos"; color = COLORS.neutral;
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      borderRadius: "8px",
      background: `${color}11`,
      border: `1px solid ${color}22`,
      marginTop: "8px",
    }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color }}>{text}</span>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function SentimentLab() {
  const [input, setInput] = useState("");
  const [ruleResult, setRuleResult] = useState(null);
  const [bayesResult, setBayesResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("lab");

  const model = useMemo(() => trainNaiveBayes(TRAINING_DATA), []);

  const classify = useCallback((text) => {
    if (!text.trim()) return;
    const r = ruleBasedClassifier(text);
    const b = model.predict(text);
    setRuleResult(r);
    setBayesResult(b);
    setHistory(prev => [{
      text,
      rule: r.label,
      bayes: b.label,
      match: r.label === b.label,
      ruleUndef: r.label === "indefinido",
    }, ...prev].slice(0, 20));
  }, [model]);

  const handleSubmit = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      classify(input);
    }
  };

  const stats = useMemo(() => {
    const total = history.length;
    const matches = history.filter(h => h.match && !h.ruleUndef).length;
    const ruleFails = history.filter(h => h.ruleUndef).length;
    const disagrees = history.filter(h => !h.match && !h.ruleUndef).length;
    return { total, matches, ruleFails, disagrees };
  }, [history]);

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px",
          }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", color: COLORS.accent,
              padding: "4px 10px", borderRadius: "4px",
              background: COLORS.mlTagBg, border: `1px solid ${COLORS.accentDim}44`,
            }}>
              Cap 1 · Módulo 1
            </span>
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "8px 0 4px", lineHeight: 1.2,
            background: "linear-gradient(135deg, #e2e8f0, #38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Regras vs. Aprendizado Estatístico
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.textMuted, margin: 0, lineHeight: 1.5 }}>
            Laboratório comparativo · Classificação de sentimento
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "24px",
          background: COLORS.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${COLORS.border}`,
        }}>
          {[
            { id: "lab", label: "Laboratório" },
            { id: "tests", label: "Casos de Teste" },
            { id: "data", label: "Dados de Treino" },
            { id: "code", label: "Como Funciona" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.2s",
                background: activeTab === tab.id ? COLORS.surfaceLight : "transparent",
                color: activeTab === tab.id ? COLORS.text : COLORS.textDim,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Laboratório */}
        {activeTab === "lab" && (
          <div>
            {/* Input */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "20px",
            }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleSubmit}
                placeholder="Digite uma avaliação de produto..."
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRadius: "10px",
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  color: COLORS.text,
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = COLORS.accent}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
              <button
                onClick={handleSubmit}
                style={{
                  padding: "14px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: `linear-gradient(135deg, ${COLORS.accentDim}, ${COLORS.accent})`,
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                CLASSIFICAR
              </button>
            </div>

            {/* Results */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <ResultCard
                title="Regras"
                tagColor={COLORS.ruleTag}
                tagBg={COLORS.ruleTagBg}
                result={ruleResult}
              />
              <ResultCard
                title="Naive Bayes"
                tagColor={COLORS.mlTag}
                tagBg={COLORS.mlTagBg}
                result={bayesResult}
              />
            </div>

            <MatchIndicator ruleResult={ruleResult} bayesResult={bayesResult} />

            {/* Stats + History */}
            {history.length > 0 && (
              <div style={{ marginTop: "28px" }}>
                <div style={{
                  display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap",
                }}>
                  {[
                    { label: "Testadas", value: stats.total, color: COLORS.textMuted },
                    { label: "Concordam", value: stats.matches, color: COLORS.positive },
                    { label: "Regras falharam", value: stats.ruleFails, color: COLORS.accent },
                    { label: "Discordam", value: stats.disagrees, color: COLORS.negative },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: "10px 16px", borderRadius: "8px",
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      textAlign: "center", minWidth: "100px",
                    }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: COLORS.textDim, marginTop: "2px", letterSpacing: "0.5px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: COLORS.textDim,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}>
                    Histórico
                  </div>
                  {history.map((h, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      borderBottom: i < history.length - 1 ? `1px solid ${COLORS.border}` : "none",
                      fontSize: "12px",
                    }}>
                      <span style={{
                        flex: 1,
                        color: COLORS.textMuted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {h.text}
                      </span>
                      <Badge label={h.rule} />
                      <span style={{ color: COLORS.textDim, fontSize: "10px" }}>vs</span>
                      <Badge label={h.bayes} />
                      <span style={{ fontSize: "14px" }}>
                        {h.match && !h.ruleUndef ? "✓" : h.ruleUndef ? "⚡" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!ruleResult && (
              <div style={{
                textAlign: "center",
                padding: "48px 20px",
                color: COLORS.textDim,
                fontSize: "13px",
                lineHeight: 1.8,
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>⎔</div>
                Digite uma avaliação acima e pressione Enter<br />
                ou vá para "Casos de Teste" para ver exemplos prontos
              </div>
            )}
          </div>
        )}

        {/* TAB: Casos de Teste */}
        {activeTab === "tests" && (
          <div>
            <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "20px", lineHeight: 1.6 }}>
              Frases pré-selecionadas que expõem as diferenças entre regras e aprendizado estatístico.
              Clique em qualquer uma para classificar.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TEST_CASES.map((tc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(tc.text);
                    classify(tc.text);
                    setActiveTab("lab");
                  }}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: "10px",
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    color: COLORS.text,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.accent;
                    e.currentTarget.style.background = COLORS.surfaceLight;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.background = COLORS.surface;
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    "{tc.text}"
                  </div>
                  <div style={{ fontSize: "11px", color: COLORS.textDim }}>
                    {tc.note}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Dados de Treino */}
        {activeTab === "data" && (
          <div>
            <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "20px", lineHeight: 1.6 }}>
              Estes são os {TRAINING_DATA.length} exemplos usados para treinar o Naive Bayes.
              O classificador de regras não usa nenhum dado — apenas listas de palavras fixas.
            </p>
            <div style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}>
              {TRAINING_DATA.map((d, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  borderBottom: i < TRAINING_DATA.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  fontSize: "12px",
                }}>
                  <span style={{
                    color: COLORS.textDim,
                    fontSize: "10px",
                    fontWeight: 700,
                    width: "24px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1, color: COLORS.textMuted }}>{d.text}</span>
                  <Badge label={d.label} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Como Funciona */}
        {activeTab === "code" && (
          <div style={{ fontSize: "13px", color: COLORS.textMuted, lineHeight: 1.8 }}>
            <div style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "24px",
              marginBottom: "16px",
            }}>
              <h3 style={{
                fontSize: "14px", fontWeight: 700, color: COLORS.ruleTag,
                margin: "0 0 12px", letterSpacing: "0.5px",
              }}>
                Sistema de Regras
              </h3>
              <p style={{ margin: "0 0 12px" }}>
                Funciona com duas listas fixas: <strong style={{ color: COLORS.positive }}>20 palavras positivas</strong> e{" "}
                <strong style={{ color: COLORS.negative }}>20 palavras negativas</strong>. Para cada frase:
              </p>
              <div style={{
                background: COLORS.bg,
                borderRadius: "8px",
                padding: "16px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: COLORS.accent,
                lineHeight: 1.7,
                overflowX: "auto",
              }}>
                <span style={{ color: COLORS.textDim }}>1.</span> Converter texto para minúsculas<br />
                <span style={{ color: COLORS.textDim }}>2.</span> Contar matches em lista positiva<br />
                <span style={{ color: COLORS.textDim }}>3.</span> Contar matches em lista negativa<br />
                <span style={{ color: COLORS.textDim }}>4.</span> Quem tiver mais matches vence<br />
                <span style={{ color: COLORS.textDim }}>5.</span> Se empate ou zero → "indefinido"
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: COLORS.textDim }}>
                <strong>Limitações:</strong> não entende contexto, gírias, negações ("não gostei" tem "gostei" = positivo),
                expressões novas ou frases sem palavras-chave.
              </p>
            </div>

            <div style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "24px",
              marginBottom: "16px",
            }}>
              <h3 style={{
                fontSize: "14px", fontWeight: 700, color: COLORS.mlTag,
                margin: "0 0 12px", letterSpacing: "0.5px",
              }}>
                Naive Bayes (Aprendizado Estatístico)
              </h3>
              <p style={{ margin: "0 0 12px" }}>
                Treinado com <strong style={{ color: COLORS.accent }}>{TRAINING_DATA.length} exemplos rotulados</strong>.
                Usa o Teorema de Bayes para calcular probabilidades:
              </p>
              <div style={{
                background: COLORS.bg,
                borderRadius: "8px",
                padding: "16px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: COLORS.accent,
                lineHeight: 1.7,
                overflowX: "auto",
              }}>
                P(classe | texto) ∝ P(classe) × ∏ P(palavra | classe)<br /><br />
                <span style={{ color: COLORS.textDim }}>// Com suavização de Laplace:</span><br />
                P(w|c) = (count(w,c) + 1) / (total_words(c) + |V|)
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: COLORS.textDim }}>
                <strong>Vantagens:</strong> generaliza a partir dos dados, captura co-ocorrências,
                lida melhor com frases sem palavras-chave exatas, dá probabilidades calibradas.
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: COLORS.textDim }}>
                <strong>Limitações:</strong> assume independência entre palavras, precisa de dados
                de treino de qualidade, pode overfit em datasets pequenos.
              </p>
            </div>

            <div style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "24px",
            }}>
              <h3 style={{
                fontSize: "14px", fontWeight: 700, color: COLORS.neutral,
                margin: "0 0 12px", letterSpacing: "0.5px",
              }}>
                A Lição do Módulo
              </h3>
              <p style={{ margin: 0 }}>
                <strong style={{ color: COLORS.text }}>Regras</strong> são previsíveis, auditáveis e não precisam de dados.
                Use quando o domínio é pequeno e estável.<br /><br />
                <strong style={{ color: COLORS.text }}>ML estatístico</strong> descobre padrões nos dados e generaliza.
                Use quando o espaço de possibilidades é grande demais para enumerar.<br /><br />
                <strong style={{ color: COLORS.text }}>A pergunta certa não é "qual é melhor?"</strong> — é{" "}
                <em>"qual é a menor complexidade que resolve meu problema?"</em>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
