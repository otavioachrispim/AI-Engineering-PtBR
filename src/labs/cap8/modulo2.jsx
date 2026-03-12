import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// KNOWLEDGE BASE (simulated embeddings)
// ============================================================
var KB = [
  { id: 1, type: "politica", title: "Garantia estrutural", content: "Garantia estrutural de piscinas: 5 anos cobrindo trincas, infiltracoes e problemas na estrutura de concreto. Valida com manutencao preventiva semestral conforme orientacoes da empresa.", similarity: {} },
  { id: 2, type: "politica", title: "Garantia equipamentos", content: "Garantia de equipamentos (bomba, filtro, clorador): 2 anos contra defeitos de fabricacao. Nao cobre mau uso ou falta de manutencao.", similarity: {} },
  { id: 3, type: "politica", title: "Garantia vinil", content: "Garantia do revestimento vinil: 3 anos contra descolamento, rasgos na solda e desbotamento excessivo. Nao cobre danos por objetos cortantes.", similarity: {} },
  { id: 4, type: "manual", title: "Procedimento vazamento", content: "Em caso de vazamento: 1) Desligar bomba. 2) Marcar nivel da agua. 3) Verificar perda em 24h. 4) Se perda > 3cm/dia: infiltracao provavel. 5) Acionar equipe tecnica para teste de estanqueidade. Custo medio: R$2.000-5.000.", similarity: {} },
  { id: 5, type: "tabela", title: "Precos piscinas", content: "Piscina vinil 6x3: R$45-55k. Piscina vinil 8x4: R$75-95k. Prainha: +R$8-12k. Aquecimento solar: +R$8-15k. Iluminacao LED: +R$2-4k.", similarity: {} },
  { id: 6, type: "tabela", title: "Prazos de obra", content: "Piscina vinil 6x3: 30 dias uteis. Piscina vinil 8x4: 45-60 dias. Reforma geral: 15-20 dias. Manutencao simples: 1-3 dias.", similarity: {} },
  { id: 7, type: "faq", title: "Agua verde", content: "Agua verde indica proliferacao de algas. Causas: cloro insuficiente, pH desregulado, falta de filtragem. Solucao: tratamento de choque com cloro + algicida. Recuperacao: 24-48h.", similarity: {} },
  { id: 8, type: "manual", title: "Manutencao preventiva", content: "Manutencao mensal: verificar pH (7.2-7.6), cloro (1-3 ppm), limpar skimmer, verificar pressao do filtro, testar bomba. Custo medio: R$350-500/mes.", similarity: {} },
  { id: 9, type: "faq", title: "Melhor epoca construir", content: "Melhor epoca: outono/inverno (abril-agosto). Menos chuva facilita escavacao e concretagem. Piscina pronta pro verao. Evitar dezembro-fevereiro (chuvas).", similarity: {} },
  { id: 10, type: "diario", title: "OBR-034 atraso", content: "28/02/2026: Fornecedor de cimento atrasou entrega da obra OBR-034 (Carlos Mendes). Obra parada 5 dias. Retomada em 05/03. Impacto: 5 dias no cronograma.", similarity: {} },
];

var TYPE_COLORS = { politica: C.purple, manual: C.red, tabela: C.amber, faq: C.cyan, diario: C.orange };

// ============================================================
// RAG SCENARIOS
// ============================================================
var SCENARIOS = [
  {
    id: "garantia",
    question: "Qual a garantia da piscina?",
    retrievedIds: [1, 2, 3],
    ragResponse: "A piscina do Costa Lima tem as seguintes garantias:\n\n- Estrutural (concreto): 5 anos - cobre trincas, infiltracoes e problemas estruturais\n- Equipamentos (bomba, filtro, clorador): 2 anos - cobre defeitos de fabricacao\n- Revestimento vinil: 3 anos - cobre descolamento, rasgos na solda e desbotamento\n\nTodas as garantias sao condicionadas a manutencao preventiva semestral.\n\n[Fontes: Politica de Garantia - Estrutural, Equipamentos e Vinil]",
    noRagResponse: "Geralmente, piscinas tem garantia de alguns anos dependendo do tipo de construcao. Recomendo verificar com a empresa os termos especificos do seu contrato de garantia.",
    ragMetrics: { faithfulness: 98, relevance: 95, completeness: 92 },
  },
  {
    id: "preco",
    question: "Quanto custa uma piscina 8x4 com prainha e LED?",
    retrievedIds: [5],
    ragResponse: "Com base na tabela de precos:\n\n- Piscina vinil 8x4: R$75.000 a R$95.000\n- Prainha: +R$8.000 a R$12.000\n- Iluminacao LED: +R$2.000 a R$4.000\n\nTotal estimado: R$85.000 a R$111.000\n(Valor final depende de acabamento e acessorios adicionais)\n\n[Fonte: Tabela de Precos - Piscinas]",
    noRagResponse: "Uma piscina 8x4 com prainha e LED pode variar bastante de preco. Sugiro solicitar um orcamento personalizado para ter valores mais precisos.",
    ragMetrics: { faithfulness: 95, relevance: 98, completeness: 90 },
  },
  {
    id: "vazamento",
    question: "A bomba da piscina esta vazando, o que eu faco?",
    retrievedIds: [4, 8],
    ragResponse: "Siga este procedimento de emergencia:\n\n1. Desligue a bomba pelo disjuntor IMEDIATAMENTE\n2. Marque o nivel atual da agua\n3. Verifique a perda de agua nas proximas 24 horas\n4. Se a perda for maior que 3cm por dia, provavelmente e infiltracao\n5. Acione a equipe tecnica para teste de estanqueidade\n\nCusto medio do reparo: R$2.000 a R$5.000\n\nEnquanto isso, mantenha a manutencao basica: verifique pH (7.2-7.6) e cloro (1-3 ppm).\n\n[Fontes: Procedimento de Vazamento, Manutencao Preventiva]",
    noRagResponse: "Em caso de vazamento, o ideal e desligar a bomba e chamar um tecnico. Evite usar a piscina ate resolver o problema.",
    ragMetrics: { faithfulness: 96, relevance: 97, completeness: 94 },
  },
  {
    id: "epoca",
    question: "Quando e a melhor epoca pra construir? E quanto tempo leva?",
    retrievedIds: [9, 6],
    ragResponse: "Melhor epoca: outono e inverno (abril a agosto)\n- Menos chuva facilita escavacao e concretagem\n- Piscina fica pronta para o verao\n- Evite dezembro a fevereiro (periodo de chuvas intensas)\n\nPrazos:\n- Piscina vinil 6x3: 30 dias uteis\n- Piscina vinil 8x4: 45 a 60 dias uteis\n- Reforma geral: 15 a 20 dias\n\nDica: se comecar em abril, uma 8x4 fica pronta em junho - tempo de sobra pro verao!\n\n[Fontes: FAQ Melhor Epoca, Tabela de Prazos]",
    noRagResponse: "A melhor epoca depende da regiao, mas geralmente periodos secos sao melhores. O prazo varia conforme o tamanho da piscina.",
    ragMetrics: { faithfulness: 94, relevance: 96, completeness: 95 },
  },
  {
    id: "obra_carlos",
    question: "O que aconteceu com a obra do Carlos? Teve algum problema?",
    retrievedIds: [10],
    ragResponse: "Sim, houve um problema registrado na obra OBR-034 (Carlos Mendes):\n\nEm 28/02/2026, o fornecedor de cimento atrasou a entrega, causando parada da obra por 5 dias. A obra foi retomada em 05/03/2026.\n\nImpacto: 5 dias de atraso no cronograma original.\n\nNota: nao ha registros de outros problemas nesta obra.\n\n[Fonte: Diario de Obra OBR-034]",
    noRagResponse: "Nao tenho informacoes especificas sobre problemas em obras de clientes. Sugiro consultar diretamente com o setor de obras.",
    ragMetrics: { faithfulness: 99, relevance: 95, completeness: 88 },
  },
  {
    id: "fora_escopo",
    question: "Voces fazem piscina de fibra?",
    retrievedIds: [],
    ragResponse: "Nao encontrei informacoes sobre piscinas de fibra na nossa base de conhecimento. Os documentos disponiveis mencionam apenas piscinas de vinil e alvenaria.\n\nRecomendo entrar em contato diretamente com a equipe comercial para verificar se esse servico esta disponivel.\n\n[Nenhum documento relevante encontrado]",
    noRagResponse: "Sim, muitas empresas fazem piscinas de fibra. Sao mais rapidas de instalar e tem bom custo-beneficio. Consulte um profissional para mais detalhes.",
    ragMetrics: { faithfulness: 100, relevance: 90, completeness: 70 },
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function PipelineStep(props) {
  var step = props.step;
  var visible = props.visible;
  if (!visible) return null;

  var stepStyles = {
    retrieve: { color: C.cyan, icon: "\uD83D\uDD0D", label: "RETRIEVE (buscar)" },
    augment: { color: C.amber, icon: "\uD83D\uDCDD", label: "AUGMENT (enriquecer)" },
    generate: { color: C.green, icon: "\u2728", label: "GENERATE (responder)" },
  };
  var ss = stepStyles[step.type] || stepStyles.retrieve;

  return (
    <div style={{
      padding: "12px 14px", borderRadius: "10px", marginBottom: "8px",
      background: ss.color + "06", border: "1px solid " + ss.color + "18",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px" }}>{ss.icon}</span>
        <span style={{ fontSize: "10px", fontWeight: 800, color: ss.color, letterSpacing: "0.5px" }}>{ss.label}</span>
        {step.latency && <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{step.latency}</span>}
      </div>
      {step.content && (
        <pre style={{
          margin: 0, fontSize: "10px", color: step.type === "generate" ? C.text : C.textMuted,
          lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit",
          fontWeight: step.type === "generate" ? 500 : 400,
        }}>
          {step.content}
        </pre>
      )}
      {step.docs && step.docs.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          {step.docs.map(function(doc) {
            var tc = TYPE_COLORS[doc.type] || C.textDim;
            return (
              <div key={doc.id} style={{
                padding: "6px 10px", borderRadius: "6px", marginBottom: "4px",
                background: C.bg, border: "1px solid " + C.border,
                fontSize: "9px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "7px", fontWeight: 800, padding: "1px 5px", borderRadius: "3px", background: tc + "15", color: tc }}>{doc.type.toUpperCase()}</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{doc.title}</span>
                  {doc.sim && <span style={{ color: C.green, marginLeft: "auto" }}>{doc.sim}%</span>}
                </div>
                <div style={{ color: C.textMuted, lineHeight: 1.4 }}>{doc.content.substring(0, 120)}...</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ComparisonView(props) {
  var scenario = props.scenario;
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {/* With RAG */}
      <div style={{
        flex: 1, minWidth: "280px", padding: "14px", borderRadius: "10px",
        background: C.green + "06", border: "1px solid " + C.green + "22",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.green, marginBottom: "8px" }}>
          {"\u2705"} COM RAG (fundamentado em documentos)
        </div>
        <pre style={{
          margin: 0, fontSize: "11px", color: C.text, lineHeight: 1.7,
          whiteSpace: "pre-wrap", fontFamily: "inherit",
        }}>
          {scenario.ragResponse}
        </pre>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          {[
            { label: "Fidelidade", value: scenario.ragMetrics.faithfulness },
            { label: "Relevancia", value: scenario.ragMetrics.relevance },
            { label: "Completude", value: scenario.ragMetrics.completeness },
          ].map(function(m) {
            var color = m.value >= 90 ? C.green : m.value >= 70 ? C.amber : C.red;
            return (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: color }}>{m.value}%</div>
                <div style={{ fontSize: "8px", color: C.textDim }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Without RAG */}
      <div style={{
        flex: 1, minWidth: "280px", padding: "14px", borderRadius: "10px",
        background: C.red + "06", border: "1px solid " + C.red + "22",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.red, marginBottom: "8px" }}>
          {"\u274C"} SEM RAG (conhecimento generico do modelo)
        </div>
        <pre style={{
          margin: 0, fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
          whiteSpace: "pre-wrap", fontFamily: "inherit",
        }}>
          {scenario.noRagResponse}
        </pre>
        <div style={{
          marginTop: "10px", padding: "6px 10px", borderRadius: "6px",
          background: C.red + "08", fontSize: "9px", color: C.red, lineHeight: 1.5,
        }}>
          {scenario.id === "fora_escopo"
            ? "ALUCINACAO: modelo inventou que 'fibra e rapida e tem bom custo-beneficio' sem dados reais da empresa."
            : "Resposta generica, sem numeros, sem fontes. O usuario nao ganha informacao util."}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function RAGPipelineLab() {
  var [activeTab, setActiveTab] = useState("pipeline");
  var [selectedScenario, setSelectedScenario] = useState(0);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);

  var scenario = SCENARIOS[selectedScenario];

  var playPipeline = useCallback(function(idx) {
    setSelectedScenario(idx);
    setVisibleSteps(0);
    setPlaying(true);
    [1, 2, 3].forEach(function(step) {
      setTimeout(function() {
        setVisibleSteps(step);
        if (step === 3) setPlaying(false);
      }, step * 800);
    });
  }, []);

  // Build pipeline steps for current scenario
  var retrievedDocs = scenario.retrievedIds.map(function(id) {
    var doc = KB.find(function(d) { return d.id === id; });
    return doc ? { id: doc.id, type: doc.type, title: doc.title, content: doc.content, sim: (85 + Math.floor(Math.random() * 12)) } : null;
  }).filter(Boolean);

  var pipelineSteps = [
    {
      type: "retrieve",
      latency: "45ms (pgvector)",
      content: retrievedDocs.length > 0
        ? "Query: \"" + scenario.question + "\"\nBusca semantica no pgvector → " + retrievedDocs.length + " documento(s) com similarity > 70%:"
        : "Query: \"" + scenario.question + "\"\nBusca semantica no pgvector → Nenhum documento com similarity > 70%",
      docs: retrievedDocs,
    },
    {
      type: "augment",
      latency: "2ms",
      content: "SYSTEM: Responda APENAS com base nos documentos fornecidos.\nSe a informacao nao estiver nos documentos, diga explicitamente.\nCite qual documento usou.\n\nCONTEXT: [" + retrievedDocs.length + " documento(s) injetados]\n\nUSER: " + scenario.question,
    },
    {
      type: "generate",
      latency: "380ms (Haiku)",
      content: scenario.ragResponse,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.cyan, padding: "4px 10px", borderRadius: "4px",
            background: C.cyan + "12", border: "1px solid " + C.cyan + "33",
          }}>Cap 8 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            RAG — Retrieval-Augmented Generation
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Retrieve | Augment | Generate — respostas fundamentadas em dados reais
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "pipeline", label: "Pipeline RAG" },
            { id: "compare", label: "Com vs Sem RAG" },
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

        {/* PIPELINE */}
        {activeTab === "pipeline" && (
          <div>
            {/* Scenario selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {SCENARIOS.map(function(sc, i) {
                var isSel = selectedScenario === i;
                var isOutOfScope = sc.retrievedIds.length === 0;
                return (
                  <button key={sc.id} onClick={function() { playPipeline(i); }} disabled={playing} style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid " + (isSel ? C.cyan + "44" : C.border),
                    background: isSel ? C.cyan + "08" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer",
                    fontFamily: "inherit", opacity: playing && !isSel ? 0.5 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>{sc.question}</span>
                      <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>
                        {isOutOfScope ? "fora do escopo" : sc.retrievedIds.length + " docs"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pipeline execution */}
            {visibleSteps > 0 && (
              <div>
                {/* Question */}
                <div style={{
                  padding: "10px 14px", borderRadius: "8px", marginBottom: "10px",
                  background: C.blue + "10", border: "1px solid " + C.blue + "22",
                  fontSize: "12px", color: C.text,
                }}>
                  <span style={{ color: C.blue, fontWeight: 700, fontSize: "9px" }}>PERGUNTA: </span>
                  {scenario.question}
                </div>

                {pipelineSteps.map(function(step, i) {
                  return <PipelineStep key={i} step={step} visible={i < visibleSteps} />;
                })}

                {playing && (
                  <div style={{ textAlign: "center", padding: "8px", color: C.amber, fontSize: "11px" }}>
                    Processando etapa {visibleSteps + 1}/3...
                  </div>
                )}

                {/* Metrics */}
                {!playing && visibleSteps >= 3 && (
                  <div style={{
                    display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap",
                  }}>
                    {[
                      { label: "Docs recuperados", value: retrievedDocs.length, color: C.cyan },
                      { label: "Fidelidade", value: scenario.ragMetrics.faithfulness + "%", color: C.green },
                      { label: "Relevancia", value: scenario.ragMetrics.relevance + "%", color: C.green },
                      { label: "Completude", value: scenario.ragMetrics.completeness + "%", color: scenario.ragMetrics.completeness >= 90 ? C.green : C.amber },
                      { label: "Latencia total", value: "~430ms", color: C.amber },
                      { label: "Custo", value: "$0.001", color: C.green },
                    ].map(function(m) {
                      return (
                        <div key={m.label} style={{
                          flex: 1, minWidth: "80px", padding: "8px 6px",
                          background: C.surface, border: "1px solid " + C.border,
                          borderRadius: "6px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: m.color }}>{m.value}</div>
                          <div style={{ fontSize: "7px", color: C.textDim }}>{m.label}</div>
                        </div>
                      );
                    })}
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
              A mesma pergunta respondida COM RAG (documentos reais) vs SEM RAG (conhecimento generico). A diferenca e brutal.
            </p>

            <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
              {SCENARIOS.map(function(sc, i) {
                return (
                  <button key={sc.id} onClick={function() { setSelectedScenario(i); }} style={{
                    padding: "6px 10px", borderRadius: "6px", fontSize: "9px",
                    fontFamily: "inherit", cursor: "pointer",
                    border: "1px solid " + (selectedScenario === i ? C.cyan : C.border),
                    background: selectedScenario === i ? C.cyan + "12" : "transparent",
                    color: selectedScenario === i ? C.cyan : C.textMuted,
                    fontWeight: selectedScenario === i ? 700 : 400,
                  }}>{sc.question.length > 35 ? sc.question.substring(0, 35) + "..." : sc.question}</button>
                );
              })}
            </div>

            {/* Question */}
            <div style={{
              padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
              background: C.blue + "10", border: "1px solid " + C.blue + "22",
              fontSize: "12px", color: C.text,
            }}>
              <span style={{ color: C.blue, fontWeight: 700, fontSize: "9px" }}>PERGUNTA: </span>
              {scenario.question}
            </div>

            <ComparisonView scenario={scenario} />
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "RAG em 3 etapas",
                color: C.cyan,
                text: "1. RETRIEVE: pergunta vira embedding -> pgvector busca top K documentos mais similares\n2. AUGMENT: documentos encontrados sao injetados no prompt do LLM junto com a pergunta\n3. GENERATE: LLM gera resposta fundamentada nos documentos, nao no conhecimento proprio\n\nA instrucao chave no system prompt: 'Responda APENAS com base nos documentos. Se nao encontrar a informacao, diga explicitamente.'\n\nResultado: respostas com numeros, datas e fatos reais da empresa. Nao alucinacoes genericas.",
              },
              {
                title: "RAG vs Fine-tuning: quando usar cada",
                color: C.purple,
                text: "RAG (usar para Costa Lima):\n  + Barato ($0.02 para indexar)\n  + Atualizacao imediata (muda doc, muda resposta)\n  + Auditavel (cita fontes)\n  + Sem treinamento\n  Quando: adicionar conhecimento especifico\n\nFine-tuning:\n  + Muda comportamento/estilo do modelo\n  - Caro ($100+)\n  - Desatualiza rapido\n  - Dificil auditar\n  Quando: mudar COMO o modelo responde, nao O QUE sabe\n\nPara 99% dos casos de empresa: RAG e suficiente.",
              },
              {
                title: "O que pode dar errado e como resolver",
                color: C.red,
                text: "PROBLEMA 1: Documentos irrelevantes no contexto\n  Solucao: threshold de similaridade > 70%. Nao inclua docs com score baixo.\n\nPROBLEMA 2: Documento certo nao encontrado\n  Solucao: query expansion (LLM reformula em 2-3 variacoes antes de buscar)\n\nPROBLEMA 3: Informacao desatualizada\n  Solucao: metadata com data no documento. LLM cita a data.\n\nPROBLEMA 4: Conflito entre documentos\n  Solucao: prompt instrui LLM a citar ambos e indicar conflito.\n\nPROBLEMA 5: Pergunta fora do escopo\n  Solucao: sem docs relevantes -> 'nao encontrei essa informacao' (nao inventar)",
              },
              {
                title: "Implementacao no Costa Lima",
                color: C.green,
                text: "INDEXACAO (uma vez + incremental):\n  1. Coletar documentos (politicas, manuais, FAQ, diarios)\n  2. Chunkar (300-500 tokens por chunk)\n  3. Gerar embeddings (Voyage AI voyage-3-lite)\n  4. Salvar no pgvector (Neon PostgreSQL)\n  Custo: ~$0.02 total\n\nBUSCA (cada pergunta):\n  1. Pergunta -> embedding (5ms)\n  2. pgvector busca top 5 (40ms)\n  3. Filtrar similarity > 0.7\n  4. Injetar no prompt do LLM (2ms)\n  5. LLM gera resposta (300-400ms)\n  Total: ~450ms | Custo: ~$0.001\n\nINTEGRACAO:\n  O copiloto (Cap 3/4) ganha uma tool 'buscar_conhecimento'\n  que faz RAG antes de responder. Quando o vendedor pergunta\n  algo que nao esta no banco SQL, o RAG busca nos documentos.",
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
