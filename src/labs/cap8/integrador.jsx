import { useState, useCallback, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// KNOWLEDGE BASE
// ============================================================
var KB = [
  { id: 1, type: "politica", title: "Garantia estrutural", content: "Garantia estrutural de piscinas: 5 anos cobrindo trincas, infiltracoes e problemas na estrutura de concreto armado. Valida com manutencao preventiva semestral.", kw: ["garantia", "estrutural", "5", "anos", "trincas", "concreto"] },
  { id: 2, type: "politica", title: "Garantia equipamentos", content: "Garantia de equipamentos (bomba, filtro, clorador): 2 anos contra defeitos de fabricacao. Nao cobre mau uso ou falta de manutencao. Acionamento por escrito.", kw: ["garantia", "equipamentos", "bomba", "filtro", "2", "anos"] },
  { id: 3, type: "politica", title: "Garantia vinil", content: "Garantia do revestimento vinil: 3 anos contra descolamento, rasgos na solda e desbotamento excessivo. Nao cobre danos por objetos cortantes ou produtos quimicos.", kw: ["garantia", "vinil", "3", "anos", "revestimento", "descolamento"] },
  { id: 4, type: "manual", title: "Procedimento vazamento", content: "Em caso de vazamento: 1) Desligar bomba pelo disjuntor. 2) Marcar nivel da agua com fita. 3) Verificar perda em 24h. 4) Se perda > 3cm/dia: infiltracao provavel. 5) Acionar equipe tecnica. Custo medio reparo: R$2.000-5.000.", kw: ["vazamento", "bomba", "nivel", "infiltracao", "reparo", "emergencia"] },
  { id: 5, type: "tabela", title: "Precos piscinas 2026", content: "Piscina vinil 6x3: R$45-55k. Piscina vinil 8x4: R$75-95k. Alvenaria 6x3: R$55-70k. Prainha: +R$8-12k. Aquecimento solar: +R$8-15k. LED: +R$2-4k. Cascata: +R$3-6k.", kw: ["preco", "valor", "piscina", "6x3", "8x4", "vinil", "alvenaria", "prainha"] },
  { id: 6, type: "tabela", title: "Prazos de obra", content: "Piscina vinil 6x3: 30 dias uteis. Piscina vinil 8x4: 45-60 dias. Reforma geral: 15-20 dias. Manutencao simples: 1-3 dias. Prazo pode variar com chuva e fornecedores.", kw: ["prazo", "dias", "tempo", "6x3", "8x4", "reforma"] },
  { id: 7, type: "faq", title: "Agua verde", content: "Agua verde = proliferacao de algas. Causas: cloro insuficiente, pH desregulado (fora 7.2-7.6), falta de filtragem. Solucao: tratamento de choque com supercloro + algicida. Manter filtro 24h. Recuperacao: 24-48h.", kw: ["agua", "verde", "algas", "cloro", "pH", "tratamento", "choque"] },
  { id: 8, type: "manual", title: "Manutencao preventiva", content: "Manutencao mensal: verificar pH (7.2-7.6), cloro residual (1-3ppm), limpar cesto skimmer, verificar pressao do filtro (manometro), testar bomba e motor. Custo medio: R$350-500/mes.", kw: ["manutencao", "mensal", "pH", "cloro", "skimmer", "filtro", "preventiva"] },
  { id: 9, type: "faq", title: "Melhor epoca construir", content: "Melhor epoca: outono/inverno (abril-agosto). Menos chuva facilita escavacao e concretagem. Piscina fica pronta pro verao. Evitar: dezembro-fevereiro (chuvas intensas no RJ).", kw: ["epoca", "construir", "abril", "agosto", "chuva", "verao", "inverno"] },
  { id: 10, type: "diario", title: "OBR-034 atraso cimento", content: "28/02/2026: Fornecedor de cimento atrasou entrega da obra OBR-034 (Carlos Mendes, piscina 8x4 prainha). Obra parada 5 dias. Retomada 05/03. Impacto: 5 dias no cronograma.", kw: ["OBR-034", "cimento", "atraso", "Carlos", "Mendes", "obra", "parada"] },
  { id: 11, type: "contrato", title: "Contrato OBR-034", content: "Contrato OBR-034: cliente Carlos Mendes, piscina vinil 8x4 com prainha. Valor total: R$85.000. Entrada: R$42.500. 3 parcelas de R$14.167. Inicio: 01/02/2026. Prazo: 60 dias uteis.", kw: ["OBR-034", "contrato", "Carlos", "Mendes", "85000", "8x4", "prainha", "vinil"] },
  { id: 12, type: "diario", title: "OBR-045 progresso", content: "Obra OBR-045 (Marcos Oliveira, 6x3 vinil). 70% concluida. Revestimento em andamento. Sem problemas. Previsao de entrega: 28/03/2026.", kw: ["OBR-045", "Marcos", "Oliveira", "6x3", "revestimento", "70"] },
  { id: 13, type: "politica", title: "Condicoes pagamento", content: "Condicoes padrao: 50% na aprovacao (entrada), saldo em ate 3x sem juros. Acima de R$80k: possivel 4x. Desconto a vista: 5%. Boleto ou PIX.", kw: ["pagamento", "entrada", "parcela", "desconto", "PIX", "boleto"] },
  { id: 14, type: "manual", title: "Vistoria de entrega", content: "Checklist vistoria final: 1) Nivel e alinhamento da borda. 2) Acabamento do vinil (sem bolhas/rugas). 3) Teste de estanqueidade 24h. 4) Funcionamento bomba/filtro. 5) Iluminacao. 6) Limpeza final. Fotos obrigatorias.", kw: ["vistoria", "entrega", "checklist", "borda", "vinil", "bomba", "teste"] },
];

var TYPE_COLORS = { politica: C.purple, manual: C.red, tabela: C.amber, faq: C.cyan, diario: C.orange, contrato: C.blue };
var TYPE_LABELS = { politica: "POLITICA", manual: "MANUAL", tabela: "TABELA", faq: "FAQ", diario: "DIARIO", contrato: "CONTRATO" };

// ============================================================
// SEARCH ENGINES
// ============================================================
function vectorScore(doc, query) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });
  var score = 0;
  var syns = { "custo": ["preco", "valor"], "quanto": ["preco", "valor"], "problema": ["vazamento", "verde", "atraso"], "aquecer": ["aquecimento", "solar"], "caro": ["preco", "valor"], "barato": ["preco", "valor", "desconto"], "pagar": ["pagamento", "parcela", "entrada"], "entrega": ["vistoria", "prazo", "conclusao"] };
  words.forEach(function(w) {
    if (doc.content.toLowerCase().includes(w)) score += 0.12;
    if (doc.title.toLowerCase().includes(w)) score += 0.18;
    if (syns[w]) syns[w].forEach(function(s) { if (doc.content.toLowerCase().includes(s)) score += 0.10; });
  });
  return Math.min(score, 0.98);
}

function keywordScore(doc, query) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });
  var score = 0;
  words.forEach(function(w) {
    doc.kw.forEach(function(k) {
      if (k.toLowerCase() === w) score += 0.25;
      else if (k.toLowerCase().includes(w) || w.includes(k.toLowerCase())) score += 0.12;
    });
  });
  return Math.min(score, 0.98);
}

function hybridSearch(query, limit) {
  var vec = KB.map(function(d) { return { doc: d, score: vectorScore(d, query) }; }).sort(function(a, b) { return b.score - a.score; });
  var kw = KB.map(function(d) { return { doc: d, score: keywordScore(d, query) }; }).filter(function(r) { return r.score > 0; }).sort(function(a, b) { return b.score - a.score; });

  var scores = {};
  vec.forEach(function(r, i) {
    scores[r.doc.id] = { doc: r.doc, vecRank: i + 1, vecScore: r.score, kwRank: null, kwScore: 0, rrf: 1.0 / (60 + i + 1) };
  });
  kw.forEach(function(r, i) {
    if (!scores[r.doc.id]) scores[r.doc.id] = { doc: r.doc, vecRank: null, vecScore: 0, kwRank: null, kwScore: 0, rrf: 0 };
    scores[r.doc.id].kwRank = i + 1;
    scores[r.doc.id].kwScore = r.score;
    scores[r.doc.id].rrf += 1.0 / (60 + i + 1);
  });

  return Object.values(scores).sort(function(a, b) { return b.rrf - a.rrf; }).slice(0, limit || 5);
}

// ============================================================
// RAG SCENARIOS (full pipeline)
// ============================================================
var CHAT_SCENARIOS = [
  {
    query: "Qual a garantia completa da piscina?",
    mode: "rag_basic",
    steps: [
      { type: "retrieve", label: "Hybrid search (pgvector + tsvector)", time: "45ms" },
      { type: "augment", label: "3 docs injetados no prompt" },
      { type: "generate", label: "Haiku gera resposta", time: "350ms" },
    ],
    response: "A piscina Costa Lima tem 3 niveis de garantia:\n\n1. Estrutural (concreto): 5 anos - cobre trincas, infiltracoes e problemas na estrutura\n2. Equipamentos (bomba, filtro, clorador): 2 anos - cobre defeitos de fabricacao\n3. Revestimento vinil: 3 anos - cobre descolamento, rasgos na solda, desbotamento\n\nCondicoes: todas as garantias exigem manutencao preventiva semestral. Acionamento por escrito com fotos.\n\n[Fontes: Politica de Garantia - Estrutural, Equipamentos e Vinil]",
    docsUsed: [1, 2, 3],
    metrics: { faithfulness: 98, relevance: 96, completeness: 95, time: 395, cost: 0.001 },
  },
  {
    query: "Quanto custa a piscina do Carlos e como ele esta pagando?",
    mode: "multistep",
    steps: [
      { type: "decompose", label: "Pergunta decomposta em 2 sub-queries" },
      { type: "retrieve", label: "Sub-1: 'preco piscina Carlos OBR-034' → Contrato", time: "40ms" },
      { type: "retrieve", label: "Sub-2: 'condicoes pagamento Costa Lima' → Politica", time: "38ms" },
      { type: "generate", label: "Sintese com dados de ambas as fontes", time: "380ms" },
    ],
    response: "A piscina do Carlos (OBR-034):\n\nValor total: R$85.000 (piscina vinil 8x4 com prainha)\n\nForma de pagamento:\n- Entrada: R$42.500 (50%)\n- Saldo: 3 parcelas de R$14.167\n\nEste parcelamento segue a politica padrao (50% entrada + ate 3x sem juros). Carlos nao optou pelo desconto a vista de 5% (que seria R$80.750).\n\n[Fontes: Contrato OBR-034, Condicoes de Pagamento]",
    docsUsed: [11, 13],
    metrics: { faithfulness: 97, relevance: 98, completeness: 93, time: 458, cost: 0.002 },
  },
  {
    query: "Problemas na obra OBR-034, status e proximos passos?",
    mode: "multistep_mcp",
    steps: [
      { type: "decompose", label: "3 sub-queries: problemas, status, proximos passos" },
      { type: "retrieve", label: "RAG: diario OBR-034 (atraso cimento)", time: "42ms" },
      { type: "mcp", label: "MCP: buscar_obra('OBR-034') → 35%, concretagem", time: "25ms" },
      { type: "retrieve", label: "RAG: vistoria de entrega (proximos passos)", time: "35ms" },
      { type: "generate", label: "Sintese RAG + MCP", time: "420ms" },
    ],
    response: "OBR-034 (Carlos Mendes - piscina 8x4 prainha):\n\nPROBLEMAS:\n- 28/02: Atraso de 5 dias por fornecedor de cimento\n- Obra ficou parada ate 05/03, retomada normalmente\n- Nenhum outro problema registrado\n\nSTATUS ATUAL:\n- Progresso: 35% (dados do sistema)\n- Etapa: Concretagem\n- Prazo original: 60 dias (inicio 01/02)\n- Prazo ajustado: ~65 dias (impacto do atraso)\n\nPROXIMOS PASSOS:\n- Concluir concretagem\n- Revestimento vinil\n- Instalacao de equipamentos\n- Vistoria final (checklist: nivel, vinil, estanqueidade, bomba, LED, limpeza)\n\n[Fontes: Diario OBR-034, Sistema (MCP), Checklist Vistoria]",
    docsUsed: [10, 14],
    metrics: { faithfulness: 95, relevance: 97, completeness: 96, time: 522, cost: 0.003 },
  },
  {
    query: "Minha piscina ta com a agua verde faz 3 dias, ja coloquei cloro e nao resolveu. O que fazer?",
    mode: "rag_rerank",
    steps: [
      { type: "retrieve", label: "Hybrid search → 8 candidatos", time: "40ms" },
      { type: "rerank", label: "Re-rank: Haiku avalia relevancia → top 3", time: "180ms" },
      { type: "generate", label: "Resposta com docs refinados", time: "360ms" },
    ],
    response: "Se o cloro comum nao resolveu em 3 dias, voce precisa de um tratamento de choque mais forte:\n\n1. Verifique o pH PRIMEIRO (deve estar entre 7.2 e 7.6)\n   - Se o pH estiver fora dessa faixa, o cloro nao age corretamente\n   - Esta e a causa mais comum de 'cloro que nao funciona'\n\n2. Faca tratamento de choque:\n   - Supercloro (dose 3x maior que o normal)\n   - Algicida de manutencao\n   - Mantenha o filtro ligado 24 horas (sem pausar)\n\n3. Tempo de recuperacao: 24 a 48 horas\n\n4. Apos recuperar: mantenha manutencao preventiva mensal\n   - pH 7.2-7.6, cloro 1-3ppm\n   - Custo medio: R$350-500/mes\n\nSe nao resolver em 48h, acione nossa equipe tecnica.\n\n[Fontes: FAQ Agua Verde, Manutencao Preventiva]",
    docsUsed: [7, 8],
    metrics: { faithfulness: 96, relevance: 99, completeness: 97, time: 580, cost: 0.002 },
  },
  {
    query: "Voces fazem piscina de fibra ou aquecida a gas?",
    mode: "rag_basic",
    steps: [
      { type: "retrieve", label: "Hybrid search → nenhum doc >70% similarity", time: "42ms" },
      { type: "generate", label: "Resposta de escopo limitado", time: "280ms" },
    ],
    response: "Nao encontrei informacoes sobre piscinas de fibra ou aquecimento a gas na nossa base de conhecimento.\n\nO que temos documentado:\n- Piscinas: vinil e alvenaria (nao fibra)\n- Aquecimento: solar (nao a gas)\n\nRecomendo entrar em contato diretamente com a equipe comercial pelo WhatsApp para verificar se esses servicos estao disponiveis ou se temos parceiros que atendem.\n\n[Nenhum documento relevante encontrado - resposta baseada apenas no escopo documentado]",
    docsUsed: [],
    metrics: { faithfulness: 100, relevance: 85, completeness: 70, time: 322, cost: 0.001 },
  },
];

// ============================================================
// MAIN APP
// ============================================================
export default function RAGKnowledgeBase() {
  var [activeTab, setActiveTab] = useState("chat");
  var [selectedChat, setSelectedChat] = useState(0);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);
  var [customQuery, setCustomQuery] = useState("");
  var [customResults, setCustomResults] = useState(null);

  var chat = CHAT_SCENARIOS[selectedChat];

  var playChat = useCallback(function(idx) {
    setSelectedChat(idx);
    setVisibleSteps(0);
    setPlaying(true);
    var sc = CHAT_SCENARIOS[idx];
    sc.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
        if (i === sc.steps.length - 1) {
          setTimeout(function() { setVisibleSteps(sc.steps.length + 1); setPlaying(false); }, 600);
        }
      }, (i + 1) * 600);
    });
  }, []);

  var doCustomSearch = function() {
    if (!customQuery.trim()) return;
    setCustomResults(hybridSearch(customQuery, 6));
  };

  var stepColors = { retrieve: C.cyan, augment: C.amber, generate: C.green, decompose: C.purple, rerank: C.orange, mcp: C.blue };
  var stepIcons = { retrieve: "\uD83D\uDD0D", augment: "\uD83D\uDCDD", generate: "\u2728", decompose: "\uD83E\uDDE9", rerank: "\uD83C\uDFAF", mcp: "\uD83D\uDD17" };
  var modeLabels = { rag_basic: "RAG Basico", multistep: "Multi-etapa", multistep_mcp: "Multi-etapa + MCP", rag_rerank: "RAG + Re-ranking" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Projeto Integrador - Cap 8</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Base de Conhecimento Inteligente
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            14 docs | Hybrid search | Re-ranking | Multi-etapa | RAG + MCP
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "chat", label: "Copiloto RAG" },
            { id: "search", label: "Busca Interativa" },
            { id: "kb", label: "Base (" + KB.length + " docs)" },
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

        {/* CHAT */}
        {activeTab === "chat" && (
          <div>
            {/* Scenario buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
              {CHAT_SCENARIOS.map(function(sc, i) {
                var isSel = selectedChat === i;
                var ml = modeLabels[sc.mode];
                return (
                  <button key={i} onClick={function() { playChat(i); }} disabled={playing} style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid " + (isSel ? C.cyan + "44" : C.border),
                    background: isSel ? C.cyan + "06" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{
                      fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                      background: C.purple + "15", color: C.purple, flexShrink: 0,
                    }}>{ml}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>{sc.query}</span>
                    <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{sc.steps.length} etapas</span>
                  </button>
                );
              })}
            </div>

            {/* Pipeline execution */}
            {visibleSteps > 0 && (
              <div>
                {/* Question */}
                <div style={{
                  padding: "10px 14px", borderRadius: "8px 8px 2px 8px", marginBottom: "8px",
                  background: C.blue + "12", border: "1px solid " + C.blue + "22",
                  fontSize: "12px", color: C.text, marginLeft: "40px",
                }}>
                  {chat.query}
                </div>

                {/* Steps */}
                {chat.steps.map(function(step, i) {
                  if (i >= visibleSteps) return null;
                  var sc = stepColors[step.type] || C.textDim;
                  var si = stepIcons[step.type] || "\u25CF";
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "6px 10px", marginBottom: "3px",
                      fontSize: "10px", color: sc,
                    }}>
                      <span>{si}</span>
                      <span style={{ fontWeight: 600 }}>{step.label}</span>
                      {step.time && <span style={{ color: C.textDim, marginLeft: "auto" }}>{step.time}</span>}
                    </div>
                  );
                })}

                {/* Response */}
                {visibleSteps > chat.steps.length && (
                  <div>
                    <div style={{
                      padding: "14px 16px", borderRadius: "8px 8px 8px 2px",
                      marginRight: "40px", marginTop: "8px",
                      background: C.surface, border: "1px solid " + C.border,
                    }}>
                      <pre style={{
                        margin: 0, fontSize: "11px", color: C.text, lineHeight: 1.7,
                        whiteSpace: "pre-wrap", fontFamily: "inherit",
                      }}>
                        {chat.response}
                      </pre>
                    </div>

                    {/* Docs used */}
                    {chat.docsUsed.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                        {chat.docsUsed.map(function(docId) {
                          var doc = KB.find(function(d) { return d.id === docId; });
                          if (!doc) return null;
                          var tc = TYPE_COLORS[doc.type] || C.textDim;
                          return (
                            <span key={docId} style={{
                              fontSize: "8px", padding: "2px 8px", borderRadius: "4px",
                              background: tc + "12", border: "1px solid " + tc + "22",
                              color: tc,
                            }}>{doc.title}</span>
                          );
                        })}
                      </div>
                    )}

                    {/* Metrics */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      {[
                        { label: "Fidelidade", value: chat.metrics.faithfulness + "%", color: C.green },
                        { label: "Relevancia", value: chat.metrics.relevance + "%", color: C.green },
                        { label: "Completude", value: chat.metrics.completeness + "%", color: chat.metrics.completeness >= 90 ? C.green : C.amber },
                        { label: "Latencia", value: chat.metrics.time + "ms", color: chat.metrics.time < 500 ? C.green : C.amber },
                        { label: "Custo", value: "$" + chat.metrics.cost.toFixed(3), color: C.green },
                        { label: "Modo", value: modeLabels[chat.mode], color: C.purple },
                      ].map(function(m) {
                        return (
                          <div key={m.label} style={{
                            padding: "6px 8px", borderRadius: "6px",
                            background: C.surfaceAlt, textAlign: "center", minWidth: "70px",
                          }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: "7px", color: C.textDim }}>{m.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {playing && <div style={{ textAlign: "center", padding: "10px", color: C.amber, fontSize: "11px" }}>Processando...</div>}
              </div>
            )}
          </div>
        )}

        {/* SEARCH */}
        {activeTab === "search" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Busca hibrida interativa na base de conhecimento. Digite qualquer pergunta e veja os resultados com score de cada motor.
            </p>
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              <input value={customQuery} onChange={function(e) { setCustomQuery(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") doCustomSearch(); }}
                placeholder="Busque qualquer coisa..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid " + C.border, background: C.surfaceAlt,
                  color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none",
                }} />
              <button onClick={doCustomSearch} style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: C.cyan, color: "#fff", fontSize: "11px",
                fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              }}>Buscar</button>
            </div>

            <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
              {["garantia OBR-034", "quanto custa 8x4", "agua verde cloro", "vistoria entrega checklist", "pagamento parcelamento", "obra Marcos status"].map(function(q) {
                return (
                  <button key={q} onClick={function() { setCustomQuery(q); setCustomResults(hybridSearch(q, 6)); }} style={{
                    padding: "4px 8px", borderRadius: "4px", fontSize: "9px",
                    border: "1px solid " + C.border, background: "transparent",
                    color: C.textMuted, fontFamily: "inherit", cursor: "pointer",
                  }}>{q}</button>
                );
              })}
            </div>

            {customResults && (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                {customResults.map(function(r, i) {
                  var tc = TYPE_COLORS[r.doc.type] || C.textDim;
                  var pct = (r.rrf * 100 / 0.035).toFixed(0);
                  var color = pct > 70 ? C.green : pct > 40 ? C.amber : C.textDim;
                  return (
                    <div key={r.doc.id} style={{
                      padding: "10px 14px", fontSize: "10px",
                      borderBottom: i < customResults.length - 1 ? "1px solid " + C.border : "none",
                      background: i < 3 ? C.green + "04" : "transparent",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontWeight: 800, color: i < 3 ? C.green : C.textDim, width: "18px" }}>#{i + 1}</span>
                        <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: tc + "15", color: tc }}>{TYPE_LABELS[r.doc.type] || r.doc.type.toUpperCase()}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{r.doc.title}</span>
                        {r.vecRank && <span style={{ fontSize: "8px", color: C.cyan }}>vec#{r.vecRank}</span>}
                        {r.kwRank && <span style={{ fontSize: "8px", color: C.amber }}>kw#{r.kwRank}</span>}
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "50px", height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: Math.min(100, parseInt(pct)) + "%", height: "100%", background: color, borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontWeight: 700, color: color, width: "30px", textAlign: "right" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ color: C.textMuted, lineHeight: 1.4, fontSize: "9px", paddingLeft: "26px" }}>
                        {r.doc.content.length > 140 ? r.doc.content.substring(0, 140) + "..." : r.doc.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KB */}
        {activeTab === "kb" && (
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Documentos", value: KB.length, color: C.text },
                { label: "Tipos", value: "6", color: C.purple },
                { label: "Vector store", value: "pgvector", color: C.cyan },
                { label: "Custo indexar", value: "$0.02", color: C.green },
                { label: "Dimensoes", value: "1.536", color: C.amber },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "80px", padding: "8px 6px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "7px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {KB.map(function(doc, i) {
                var tc = TYPE_COLORS[doc.type] || C.textDim;
                return (
                  <div key={doc.id} style={{
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < KB.length - 1 ? "1px solid " + C.border : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: tc + "15", color: tc }}>{TYPE_LABELS[doc.type] || doc.type.toUpperCase()}</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{doc.title}</span>
                      <span style={{ color: C.textDim, fontSize: "8px", marginLeft: "auto" }}>{doc.kw.length} keywords</span>
                    </div>
                    <div style={{ color: C.textMuted, lineHeight: 1.4, fontSize: "9px" }}>
                      {doc.content.length > 140 ? doc.content.substring(0, 140) + "..." : doc.content}
                    </div>
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
                text: "Cap 8 completo integrado:\n\nM1 (Embeddings): 14 documentos indexados em 6 categorias (politica, manual, tabela, FAQ, diario, contrato). Busca por significado com similaridade de cosseno.\n\nM2 (RAG): Pipeline Retrieve-Augment-Generate com respostas fundamentadas, citacao de fontes, e 'nao sei' quando fora do escopo. 5 cenarios com metricas.\n\nM3 (Avancado): Hybrid search (vetorial + keyword via RRF), re-ranking, query expansion, RAG multi-etapa, e integracao RAG + MCP.\n\nResultado: o copiloto do Costa Lima agora responde com dados reais, cita fontes, e combina documentos com dados do banco.",
              },
              {
                title: "5 cenarios para explorar",
                color: C.amber,
                text: '1. GARANTIA (RAG basico): 3 docs recuperados, resposta completa com 3 tipos e condicoes\n\n2. CUSTO DO CARLOS (Multi-etapa): decompoe em valor + pagamento, combina contrato + politica, calcula desconto que ele nao pegou\n\n3. STATUS OBR-034 (Multi-etapa + MCP): RAG busca diario, MCP busca sistema, RAG busca checklist. 3 fontes combinadas numa resposta completa.\n\n4. AGUA VERDE (Re-ranking): re-ranker sobe FAQ e manutencao, desce docs irrelevantes. Resposta pratica e acionavel.\n\n5. FIBRA/GAS (Fora do escopo): zero alucinacao. "Nao encontrei" + indica o que TEM disponivel.',
              },
              {
                title: "Implementacao no Costa Lima real",
                color: C.green,
                text: "BANCO DE DADOS:\n  Neon PostgreSQL (ja existente)\n  + CREATE EXTENSION vector;\n  + Tabela documento_embedding (conteudo, tipo, metadata, embedding)\n  + Coluna tsvector para busca keyword\n  Custo adicional: $0\n\nINDEXACAO:\n  Script Node.js que: le docs -> chunka -> gera embeddings (Voyage AI) -> salva no pgvector\n  Rodar uma vez + incremental quando docs mudam\n  Custo: ~$0.02 por 100 docs\n\nBUSCA:\n  Nova tool MCP: buscar_conhecimento(query)\n  Faz hybrid search + retorna top 3 docs\n  O agente (Cap 4) usa como tool antes de responder\n\nINTEGRACAO:\n  Copiloto: 'Nao sei pelo banco? Busca na base de conhecimento.'\n  Vendedor pergunta 'garantia?' -> RAG responde com politica real\n  Vendedor pergunta 'status obra?' -> MCP responde com dados do banco\n  Vendedor pergunta 'garantia da obra do Carlos?' -> Multi-etapa combina ambos",
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
