import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DOCUMENT BASE
// ============================================================
var DOCS = [
  { id: 1, title: "Garantia estrutural", type: "politica", content: "Garantia estrutural 5 anos: trincas, infiltracoes, problemas no concreto armado. Valida com manutencao semestral.", keywords: ["garantia", "estrutural", "5", "anos", "trincas"] },
  { id: 2, title: "Garantia equipamentos", type: "politica", content: "Bomba, filtro, clorador: garantia 2 anos contra defeitos de fabricacao.", keywords: ["garantia", "equipamentos", "bomba", "filtro", "2", "anos"] },
  { id: 3, title: "Garantia vinil", type: "politica", content: "Revestimento vinil: garantia 3 anos contra descolamento e desbotamento.", keywords: ["garantia", "vinil", "3", "anos", "revestimento"] },
  { id: 4, title: "Procedimento vazamento", type: "manual", content: "Desligar bomba, marcar nivel, verificar 24h. Perda >3cm/dia = infiltracao. Custo reparo: R$2.000-5.000.", keywords: ["vazamento", "bomba", "nivel", "infiltracao", "reparo"] },
  { id: 5, title: "Precos piscinas", type: "tabela", content: "Vinil 6x3: R$45-55k. Vinil 8x4: R$75-95k. Prainha: +R$8-12k. LED: +R$2-4k.", keywords: ["preco", "valor", "piscina", "6x3", "8x4", "vinil"] },
  { id: 6, title: "Prazos de obra", type: "tabela", content: "6x3: 30 dias. 8x4: 45-60 dias. Reforma: 15-20 dias. Manutencao: 1-3 dias.", keywords: ["prazo", "dias", "6x3", "8x4", "reforma"] },
  { id: 7, title: "Agua verde FAQ", type: "faq", content: "Algas por cloro insuficiente ou pH desregulado. Tratamento de choque + algicida. Recuperacao 24-48h.", keywords: ["agua", "verde", "algas", "cloro", "tratamento"] },
  { id: 8, title: "Manutencao preventiva", type: "manual", content: "Mensal: pH 7.2-7.6, cloro 1-3ppm, limpar skimmer, verificar filtro e bomba. R$350-500/mes.", keywords: ["manutencao", "mensal", "pH", "cloro", "filtro"] },
  { id: 9, title: "OBR-034 diario", type: "diario", content: "28/02: Fornecedor cimento atrasou. Obra parada 5 dias. Retomada 05/03. Carlos Mendes.", keywords: ["OBR-034", "cimento", "atraso", "Carlos", "Mendes", "obra"] },
  { id: 10, title: "OBR-034 contrato", type: "contrato", content: "Contrato OBR-034: piscina vinil 8x4 prainha. Valor R$85.000. Inicio 01/02/2026. Prazo 60 dias.", keywords: ["OBR-034", "contrato", "85000", "vinil", "8x4", "prainha"] },
  { id: 11, title: "Epoca construir", type: "faq", content: "Melhor: abril-agosto (seco). Evitar: dez-fev (chuvas). Piscina pronta pro verao.", keywords: ["epoca", "construir", "abril", "agosto", "chuva"] },
  { id: 12, title: "OBR-045 diario", type: "diario", content: "Obra Marcos Oliveira 6x3. 70% concluida. Revestimento em andamento. Sem problemas.", keywords: ["OBR-045", "Marcos", "Oliveira", "6x3", "revestimento"] },
];

var TYPE_COLORS = { politica: C.purple, manual: C.red, tabela: C.amber, faq: C.cyan, diario: C.orange, contrato: C.blue };

// ============================================================
// SEARCH ENGINES
// ============================================================
function vectorSearch(query, limit) {
  // Simulated semantic similarity
  var q = query.toLowerCase();
  return DOCS.map(function(doc) {
    var score = 0;
    var words = q.split(/\s+/);
    // Semantic matching (simplified)
    words.forEach(function(w) {
      if (doc.content.toLowerCase().includes(w)) score += 0.12;
      if (doc.title.toLowerCase().includes(w)) score += 0.15;
      // Semantic synonyms
      var syns = { "custo": ["preco", "valor"], "quanto": ["preco", "valor"], "problema": ["vazamento", "verde", "atraso"], "aquecer": ["aquecimento", "solar"] };
      if (syns[w]) syns[w].forEach(function(s) { if (doc.content.toLowerCase().includes(s)) score += 0.10; });
    });
    return { doc: doc, score: Math.min(score, 0.98), method: "vector" };
  }).sort(function(a, b) { return b.score - a.score; }).slice(0, limit || 10);
}

function keywordSearch(query, limit) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });
  return DOCS.map(function(doc) {
    var score = 0;
    words.forEach(function(w) {
      doc.keywords.forEach(function(kw) {
        if (kw.toLowerCase() === w) score += 0.25; // exact keyword match
        else if (kw.toLowerCase().includes(w)) score += 0.10;
      });
      if (doc.title.toLowerCase().includes(w)) score += 0.15;
    });
    return { doc: doc, score: Math.min(score, 0.98), method: "keyword" };
  }).filter(function(r) { return r.score > 0; }).sort(function(a, b) { return b.score - a.score; }).slice(0, limit || 10);
}

function hybridSearch(query, limit) {
  var vecResults = vectorSearch(query, 10);
  var kwResults = keywordSearch(query, 10);

  // RRF combination
  var scores = {};
  vecResults.forEach(function(r, i) {
    var key = r.doc.id;
    if (!scores[key]) scores[key] = { doc: r.doc, vecRank: null, kwRank: null, rrf: 0 };
    scores[key].vecRank = i + 1;
    scores[key].vecScore = r.score;
    scores[key].rrf += 1.0 / (60 + i + 1);
  });
  kwResults.forEach(function(r, i) {
    var key = r.doc.id;
    if (!scores[key]) scores[key] = { doc: r.doc, vecRank: null, kwRank: null, rrf: 0 };
    scores[key].kwRank = i + 1;
    scores[key].kwScore = r.score;
    scores[key].rrf += 1.0 / (60 + i + 1);
  });

  return Object.values(scores).sort(function(a, b) { return b.rrf - a.rrf; }).slice(0, limit || 5);
}

// ============================================================
// SCENARIOS
// ============================================================
var SCENARIOS = [
  {
    id: "hybrid_code",
    title: "Hybrid: codigo + conceito",
    query: "garantia da OBR-034",
    explanation: "Busca vetorial encontra docs de 'garantia'. Busca keyword encontra 'OBR-034'. Hybrid combina ambos.",
    technique: "Hybrid Search",
    color: C.cyan,
  },
  {
    id: "expansion",
    title: "Query Expansion: pergunta vaga",
    query: "me fala da piscina do Carlos",
    expansion: ["obra piscina Carlos Mendes progresso", "OBR-034 status etapa andamento", "contrato Carlos valor prazo garantia"],
    explanation: "Query vaga expandida em 3 variacoes especificas. Cada uma busca um aspecto diferente.",
    technique: "Query Expansion",
    color: C.amber,
  },
  {
    id: "multistep",
    title: "Multi-etapa: pergunta complexa",
    query: "Qual a garantia do Carlos, quanto custou a obra, e quando vence?",
    subQueries: [
      { q: "garantia piscina Costa Lima", source: "RAG", results: "5 anos estrutural, 2 equipamentos, 3 vinil" },
      { q: "obra Carlos Mendes valor", source: "MCP + RAG", results: "OBR-034, R$85.000, inicio 01/02/2026" },
      { q: "calcular vencimento garantia", source: "LLM", results: "01/02/2026 + 5 anos = 01/02/2031" },
    ],
    explanation: "Pergunta decomposta em 3 sub-queries. RAG busca garantia. MCP+RAG busca dados da obra. LLM calcula vencimento.",
    technique: "Multi-step RAG",
    color: C.purple,
    synthesis: "A piscina do Carlos (OBR-034, R$85.000, iniciada em 01/02/2026) tem:\n- Garantia estrutural: 5 anos (vence 01/02/2031)\n- Garantia equipamentos: 2 anos (vence 01/02/2028)\n- Garantia vinil: 3 anos (vence 01/02/2029)\nTodas condicionadas a manutencao preventiva semestral.\n\n[Fontes: Politica de Garantia + Contrato OBR-034 + calculo]",
  },
  {
    id: "rerank",
    title: "Re-ranking: refinar resultados",
    query: "como resolver agua verde na piscina",
    explanation: "Busca retorna 10 candidatos. Re-ranker (Haiku) avalia relevancia de cada um e reordena para top 5.",
    technique: "Re-ranking",
    color: C.green,
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function SearchResultRow(props) {
  var r = props.result;
  var rank = props.rank;
  var tc = TYPE_COLORS[r.doc.type] || C.textDim;
  var scoreColor = (r.score || r.rrf || 0) > 0.5 ? C.green : (r.score || r.rrf || 0) > 0.2 ? C.amber : C.textDim;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "8px 12px", fontSize: "10px",
      borderBottom: "1px solid " + C.border,
      background: rank <= 3 ? C.green + "04" : "transparent",
    }}>
      <span style={{ fontWeight: 800, color: rank <= 3 ? C.green : C.textDim, width: "18px" }}>#{rank}</span>
      <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: tc + "15", color: tc }}>{(r.doc.type || "").toUpperCase().substring(0, 4)}</span>
      <span style={{ color: C.text, fontWeight: 600, flex: 1 }}>{r.doc.title}</span>
      {r.vecRank && <span style={{ fontSize: "8px", color: C.cyan }}>vec#{r.vecRank}</span>}
      {r.kwRank && <span style={{ fontSize: "8px", color: C.amber }}>kw#{r.kwRank}</span>}
      {r.method && <span style={{ fontSize: "8px", color: r.method === "vector" ? C.cyan : C.amber }}>{r.method}</span>}
      <span style={{ fontWeight: 700, color: scoreColor, width: "40px", textAlign: "right" }}>
        {((r.score || r.rrf || 0) * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function HybridDemo(props) {
  var query = props.query;
  var vecResults = vectorSearch(query, 5);
  var kwResults = keywordSearch(query, 5);
  var hybResults = hybridSearch(query, 5);

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {/* Vector */}
      <div style={{ flex: 1, minWidth: "220px", background: C.surface, border: "1px solid " + C.cyan + "22", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.cyan }}>
          {"\uD83D\uDD0D"} Vetorial (significado)
        </div>
        {vecResults.map(function(r, i) { return <SearchResultRow key={r.doc.id} result={r} rank={i + 1} />; })}
      </div>

      {/* Keyword */}
      <div style={{ flex: 1, minWidth: "220px", background: C.surface, border: "1px solid " + C.amber + "22", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.amber }}>
          {"\uD83D\uDD24"} Keyword (match exato)
        </div>
        {kwResults.length > 0 ? kwResults.map(function(r, i) { return <SearchResultRow key={r.doc.id} result={r} rank={i + 1} />; })
          : <div style={{ padding: "16px", textAlign: "center", color: C.textDim, fontSize: "10px" }}>Nenhum match de keyword</div>}
      </div>

      {/* Hybrid */}
      <div style={{ flex: 1, minWidth: "220px", background: C.surface, border: "1px solid " + C.green + "22", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid " + C.border, fontSize: "10px", fontWeight: 700, color: C.green }}>
          {"\u2728"} Hybrid (RRF)
        </div>
        {hybResults.map(function(r, i) { return <SearchResultRow key={r.doc.id} result={r} rank={i + 1} />; })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AdvancedRAGLab() {
  var [activeTab, setActiveTab] = useState("hybrid");
  var [selectedScenario, setSelectedScenario] = useState(0);
  var [visibleSteps, setVisibleSteps] = useState(99);
  var [playing, setPlaying] = useState(false);

  var scenario = SCENARIOS[selectedScenario];

  var playMultistep = useCallback(function(idx) {
    setSelectedScenario(idx);
    setVisibleSteps(0);
    setPlaying(true);
    var sc = SCENARIOS[idx];
    var total = sc.subQueries ? sc.subQueries.length + 1 : 3;
    for (var i = 0; i < total; i++) {
      (function(step) {
        setTimeout(function() {
          setVisibleSteps(step + 1);
          if (step === total - 1) setPlaying(false);
        }, (step + 1) * 800);
      })(i);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Cap 8 - Modulo 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            RAG Avancado e Hybrid Search
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Hybrid search | Re-ranking | Query expansion | RAG multi-etapa
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "hybrid", label: "Hybrid Search" },
            { id: "techniques", label: "Tecnicas Avancadas" },
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

        {/* HYBRID */}
        {activeTab === "hybrid" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              3 colunas lado a lado: busca vetorial (significado), keyword (match exato) e hybrid (combinacao RRF). Observe como o hybrid captura o melhor de ambos.
            </p>

            {/* Query selector */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                "garantia da OBR-034",
                "quanto custa piscina 8x4",
                "problema agua verde",
                "obra Carlos Mendes",
                "manutencao mensal preco",
                "vazamento bomba",
              ].map(function(q, i) {
                return (
                  <button key={i} onClick={function() { setSelectedScenario(0); }} style={{
                    padding: "6px 10px", borderRadius: "6px", fontSize: "9px",
                    fontFamily: "inherit", cursor: "pointer",
                    border: "1px solid " + C.border, background: C.surface,
                    color: C.textMuted,
                  }}>{q}</button>
                );
              })}
            </div>

            {/* Show hybrid for first scenario */}
            <HybridDemo query={SCENARIOS[0].query} />

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.green + "08", border: "1px solid " + C.green + "22",
              fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>Observe: </span>
              Vetorial encontra docs de "garantia" mas perde "OBR-034". Keyword encontra "OBR-034" exato mas perde conceito de "garantia". Hybrid combina: docs de garantia + OBR-034, capturando ambos os aspectos da query.
            </div>
          </div>
        )}

        {/* TECHNIQUES */}
        {activeTab === "techniques" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {SCENARIOS.map(function(sc, i) {
                var isSel = selectedScenario === i;
                return (
                  <button key={sc.id} onClick={function() { if (sc.subQueries) playMultistep(i); else { setSelectedScenario(i); setVisibleSteps(99); } }} disabled={playing} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    border: "1px solid " + (isSel ? sc.color + "44" : C.border),
                    background: isSel ? sc.color + "08" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer",
                    fontFamily: "inherit", opacity: playing && !isSel ? 0.5 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                        background: sc.color + "15", color: sc.color,
                      }}>{sc.technique}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>{sc.title}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px" }}>Query: "{sc.query}"</div>
                  </button>
                );
              })}
            </div>

            {/* Scenario detail */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "16px",
            }}>
              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.6 }}>{scenario.explanation}</div>

              {/* Query Expansion */}
              {scenario.expansion && (
                <div>
                  <div style={{ fontSize: "10px", color: C.amber, fontWeight: 700, marginBottom: "6px" }}>QUERY EXPANSION (LLM gera variacoes)</div>
                  <div style={{
                    padding: "10px", borderRadius: "8px", marginBottom: "10px",
                    background: C.blue + "08", border: "1px solid " + C.blue + "18",
                    fontSize: "10px", color: C.cyan,
                  }}>
                    Original: "{scenario.query}"
                  </div>
                  {scenario.expansion.map(function(exp, i) {
                    return (
                      <div key={i} style={{
                        padding: "8px 12px", borderRadius: "6px", marginBottom: "4px",
                        background: C.surfaceAlt, border: "1px solid " + C.border,
                        fontSize: "10px",
                      }}>
                        <span style={{ color: C.amber, fontWeight: 700 }}>Expansao {i + 1}: </span>
                        <span style={{ color: C.textMuted }}>"{exp}"</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: "9px", color: C.textDim, marginTop: "6px" }}>
                    Cada expansao busca no pgvector. Resultados sao deduplicados e re-rankeados.
                  </div>
                </div>
              )}

              {/* Multi-step */}
              {scenario.subQueries && (
                <div>
                  <div style={{ fontSize: "10px", color: C.purple, fontWeight: 700, marginBottom: "6px" }}>RAG MULTI-ETAPA (decomposicao + sintese)</div>

                  <div style={{
                    padding: "10px", borderRadius: "8px", marginBottom: "10px",
                    background: C.blue + "08", border: "1px solid " + C.blue + "18",
                    fontSize: "10px", color: C.cyan,
                  }}>
                    Pergunta complexa: "{scenario.query}"
                  </div>

                  {scenario.subQueries.map(function(sq, i) {
                    if (i >= visibleSteps) return null;
                    var srcColor = sq.source === "RAG" ? C.purple : sq.source === "LLM" ? C.green : C.cyan;
                    return (
                      <div key={i} style={{
                        display: "flex", gap: "10px", marginBottom: "6px",
                      }}>
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "50%",
                          background: srcColor + "20", border: "2px solid " + srcColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "10px", fontWeight: 800, color: srcColor, flexShrink: 0,
                        }}>{i + 1}</div>
                        <div style={{
                          flex: 1, padding: "10px 12px", borderRadius: "8px",
                          background: C.surfaceAlt, border: "1px solid " + C.border,
                          fontSize: "10px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                            <span style={{ color: C.textMuted }}>Sub-query: "{sq.q}"</span>
                            <span style={{
                              fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                              background: srcColor + "15", color: srcColor, marginLeft: "auto",
                            }}>{sq.source}</span>
                          </div>
                          <div style={{ color: C.green, fontSize: "10px" }}>Resultado: {sq.results}</div>
                        </div>
                      </div>
                    );
                  })}

                  {visibleSteps > scenario.subQueries.length && scenario.synthesis && (
                    <div style={{
                      padding: "12px 14px", borderRadius: "10px", marginTop: "10px",
                      background: C.green + "08", border: "1px solid " + C.green + "22",
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: C.green, marginBottom: "6px" }}>{"\u2728"} SINTESE FINAL</div>
                      <pre style={{
                        margin: 0, fontSize: "11px", color: C.text, lineHeight: 1.7,
                        whiteSpace: "pre-wrap", fontFamily: "inherit",
                      }}>
                        {scenario.synthesis}
                      </pre>
                    </div>
                  )}

                  {playing && <div style={{ textAlign: "center", padding: "8px", color: C.amber, fontSize: "11px" }}>Processando...</div>}
                </div>
              )}

              {/* Re-ranking */}
              {scenario.technique === "Re-ranking" && (
                <div>
                  <div style={{ fontSize: "10px", color: C.green, fontWeight: 700, marginBottom: "8px" }}>RE-RANKING: busca ampla + refinamento inteligente</div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "4px" }}>ANTES (top 5 bruto)</div>
                      {vectorSearch(scenario.query, 5).map(function(r, i) {
                        return (
                          <div key={r.doc.id} style={{
                            padding: "6px 10px", fontSize: "10px", marginBottom: "2px",
                            borderRadius: "4px", background: C.bg,
                          }}>
                            <span style={{ color: C.textDim }}>#{i + 1}</span>
                            <span style={{ color: C.text, marginLeft: "6px" }}>{r.doc.title}</span>
                            <span style={{ color: C.amber, marginLeft: "auto", float: "right" }}>{(r.score * 100).toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "16px", color: C.green }}>
                      {"\u2192"}
                    </div>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ fontSize: "9px", color: C.green, fontWeight: 700, marginBottom: "4px" }}>DEPOIS (re-rankeado por Haiku)</div>
                      {[
                        { title: "Agua verde FAQ", score: 97, reason: "Responde diretamente a pergunta" },
                        { title: "Manutencao preventiva", score: 78, reason: "Contexto de prevencao relevante" },
                        { title: "Procedimento vazamento", score: 45, reason: "Relacionado mas nao sobre agua verde" },
                        { title: "Garantia equipamentos", score: 12, reason: "Irrelevante para agua verde" },
                      ].map(function(r, i) {
                        var color = r.score > 70 ? C.green : r.score > 30 ? C.amber : C.red;
                        return (
                          <div key={i} style={{
                            padding: "6px 10px", fontSize: "10px", marginBottom: "2px",
                            borderRadius: "4px", background: i < 2 ? C.green + "06" : C.bg,
                          }}>
                            <span style={{ color: color }}>#{i + 1}</span>
                            <span style={{ color: C.text, marginLeft: "6px" }}>{r.title}</span>
                            <span style={{ color: color, float: "right" }}>{r.score}%</span>
                            <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{r.reason}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "9px", color: C.textDim }}>
                    Re-ranker (Haiku) leu cada documento e avaliou relevancia para a pergunta. Custo adicional: ~$0.0005. Melhoria: doc irrelevante caiu de #2 para #4.
                  </div>
                </div>
              )}

              {/* Hybrid detail */}
              {scenario.technique === "Hybrid Search" && (
                <HybridDemo query={scenario.query} />
              )}
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Hybrid Search: vetorial + keyword",
                color: C.cyan,
                text: "PROBLEMA: busca vetorial perde codigos (OBR-034) e numeros exatos (5 anos). Busca keyword perde sinonimos ('construir' != 'fazer').\n\nSOLUCAO: combinar ambas com Reciprocal Rank Fusion (RRF).\nRRF score = 1/(k+rank_vec) + 1/(k+rank_kw) com k=60.\n\nIMPLEMENTACAO: pgvector (vetorial) + tsvector (keyword) no mesmo PostgreSQL. Zero infra nova.\n\nMELHORIA: +20-30% de retrieval recall vs vetorial puro.",
              },
              {
                title: "Re-ranking: precisao apos recall",
                color: C.green,
                text: "FLUXO: busca rapida top 20 (pgvector, 40ms) -> re-ranker top 5 (Haiku, 200ms)\n\nO re-ranker le query + documento JUNTOS e da nota de relevancia.\nMais preciso que similaridade de cosseno (que compara vetores isolados).\n\nCUSTO: ~$0.0005 por re-ranking (10 docs x ~50 tokens cada).\nMELHORIA: +15-20% na qualidade dos top 5.\n\nQUANDO USAR: quando precision@5 esta abaixo de 80% (muitos docs irrelevantes no contexto).",
              },
              {
                title: "Query Expansion e HyDE",
                color: C.amber,
                text: "QUERY EXPANSION:\n  Pergunta vaga -> LLM gera 2-3 variacoes especificas\n  Cada variacao busca no pgvector\n  Resultados deduplicados e re-rankeados\n  Melhoria: +10-15% recall para queries ambiguas\n\nHyDE (Hypothetical Document Embeddings):\n  Pergunta -> LLM gera resposta HIPOTETICA\n  Busca com embedding da resposta (nao da pergunta)\n  Encontra docs similares a 'como seria a resposta'\n  Melhoria: +15-25% para perguntas tecnicas\n\nCUSTO: 1 chamada extra de LLM (~$0.0003 com Haiku).",
              },
              {
                title: "RAG Multi-etapa: perguntas complexas",
                color: C.purple,
                text: "QUANDO: pergunta precisa de multiplas fontes de dados.\n\nFLUXO:\n  1. LLM decompoe pergunta em sub-queries\n  2. Cada sub-query busca na fonte certa (RAG, MCP, calculo)\n  3. Resultados parciais coletados\n  4. LLM sintetiza resposta final combinando tudo\n\nEXEMPLO: 'Garantia do Carlos, valor e vencimento'\n  Sub-1: garantia -> RAG (politica)\n  Sub-2: valor obra -> MCP (banco)\n  Sub-3: vencimento -> LLM (calculo: data + anos)\n\nCUSTO: 2-4 chamadas de LLM. VALOR: resposta completa e precisa.",
              },
              {
                title: "Implementacao progressiva no Costa Lima",
                color: C.green,
                text: "FASE 1 (ja feito): RAG basico com pgvector\n  Busca vetorial simples, top 5, threshold 0.7\n\nFASE 2 (proximo): Hybrid search\n  Adicionar coluna tsvector, combinar com RRF\n  Esforco: ~4h | Melhoria: +20% recall\n\nFASE 3 (quando necessario): Re-ranking\n  Haiku como re-ranker para top 10 -> top 5\n  Esforco: ~2h | Custo: +$0.0005/query\n\nFASE 4 (para queries complexas): Multi-etapa\n  Decomposicao + RAG + MCP combinados\n  Esforco: ~8h | Melhoria: respostas completas\n\nNao implemente tudo de uma vez. Comece com hybrid (maior impacto/esforco).",
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
