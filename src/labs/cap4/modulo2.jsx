import { useState, useCallback, useRef, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DATABASE + MEMORY STORE
// ============================================================
var DB = {
  clientes: [
    { id: "cli_001", nome: "Carlos Mendes", tel: "24 99999-1234", cidade: "Volta Redonda", vip: true, desde: "2024" },
    { id: "cli_002", nome: "Ana Paula Costa", tel: "24 99888-5678", cidade: "Barra Mansa", vip: false, desde: "2025" },
  ],
  obras: [
    { id: "obr_001", codigo: "OBR-034", clienteId: "cli_001", cliente: "Carlos Mendes", status: "EM_ANDAMENTO", progresso: 35, valor: 85000, tipo: "Piscina 8x4", prazo: "15/05/2026", etapaAtual: "Concretagem" },
    { id: "obr_002", codigo: "OBR-029", clienteId: "cli_002", cliente: "Ana Paula", status: "CONCLUIDA", progresso: 100, valor: 4500, tipo: "Manutencao", prazo: "01/02/2026", etapaAtual: "Finalizada" },
  ],
  historico: {
    "cli_001": [
      { data: "2026-01-15", nota: "Primeiro contato. Quer piscina 8x4 com prainha." },
      { data: "2026-01-22", nota: "Visita tecnica realizada. Terreno aprovado." },
      { data: "2026-02-01", nota: "Orcamento aprovado. Obra iniciada." },
      { data: "2026-02-28", nota: "Problema com fornecedor de cimento. Atraso de 5 dias." },
      { data: "2026-03-08", nota: "Cimento chegou. Obra retomada. Progresso: 35%." },
    ],
    "cli_002": [
      { data: "2025-12-10", nota: "Cliente pediu manutencao geral. Piscina de 10 anos." },
      { data: "2025-12-15", nota: "Servico realizado. Troca de filtro e tratamento." },
      { data: "2026-01-20", nota: "Cliente satisfeita. Indicou vizinha." },
    ],
  },
  knowledge: [
    { id: "kb_001", titulo: "Politica de Garantia", conteudo: "Garantia estrutural: 5 anos. Equipamentos: 2 anos. Vinil: 3 anos. Mao de obra: 1 ano. Valida mediante manutencao preventiva semestral." },
    { id: "kb_002", titulo: "Procedimento de Vazamento", conteudo: "1. Desligar bomba. 2. Verificar nivel a cada 24h. 3. Se perda > 3cm/dia: infiltracao provavel. 4. Acionar equipe tecnica. 5. Teste de estanqueidade. Custo medio reparo: R$2.000-5.000." },
    { id: "kb_003", titulo: "Prazo Medio de Obras", conteudo: "Piscina vinil ate 6x3: 30 dias. Piscina vinil 8x4+: 45-60 dias. Reforma geral: 15-20 dias. Manutencao: 1-3 dias. Prazo pode variar com clima e fornecedores." },
    { id: "kb_004", titulo: "Tabela de Precos Base", conteudo: "Piscina 6x3 vinil: R$45-55k. Piscina 8x4 vinil: R$75-95k. Reforma vinil: R$8-15k. Manutencao mensal: R$350-500. Aquecimento solar: R$8-15k. LED: R$2-4k." },
  ],
};

// Long-term memory per user
var LONG_TERM_MEMORY = [
  { tipo: "preferencia", conteudo: "Felipe prefere relatorios com numeros e datas especificos, nao genericos", relevancia: 0.9 },
  { tipo: "contexto", conteudo: "Carlos Mendes e cliente VIP desde 2024. Priorizar atendimento.", relevancia: 0.85 },
  { tipo: "aprendizado", conteudo: "Obra OBR-034 teve atraso de 5 dias por problema com fornecedor de cimento em fevereiro", relevancia: 0.8 },
  { tipo: "preferencia", conteudo: "Sandra sempre quer ver financeiro junto com status de obra", relevancia: 0.7 },
];

// ============================================================
// TOOL EXECUTION
// ============================================================
function execTool(name, params) {
  if (name === "buscar_cliente") {
    var q = (params.query || "").toLowerCase();
    return DB.clientes.filter(function(c) { return c.nome.toLowerCase().includes(q) || c.id === params.query; });
  }
  if (name === "listar_obras") {
    var res = DB.obras.slice();
    if (params.cliente_id) res = res.filter(function(o) { return o.clienteId === params.cliente_id; });
    return res;
  }
  if (name === "buscar_historico") {
    return DB.historico[params.cliente_id] || [];
  }
  if (name === "buscar_conhecimento") {
    var kq = (params.query || "").toLowerCase();
    return DB.knowledge.filter(function(k) {
      return k.titulo.toLowerCase().includes(kq) || k.conteudo.toLowerCase().includes(kq);
    });
  }
  return { error: "Tool nao encontrada" };
}

// ============================================================
// SCENARIOS - with and without memory
// ============================================================

var SCENARIOS = [
  {
    id: "with_context",
    title: "Com memoria e contexto",
    question: "Qual a situacao da obra do Carlos? Ele perguntou sobre a garantia tambem.",
    description: "O agente usa todas as 4 memorias: conversa, longo prazo, episodica e RAG.",
    steps: [
      { type: "memory_load", label: "Carregando memorias relevantes", memories: [
        { tipo: "long_term", text: "Carlos Mendes e cliente VIP (priorizar)" },
        { tipo: "long_term", text: "OBR-034 teve atraso por fornecedor em fevereiro" },
        { tipo: "long_term", text: "Usuario prefere dados especificos, nao genericos" },
      ]},
      { type: "thought", text: "O usuario quer status da obra E informacao de garantia. Preciso: dados do cliente, obra, historico recente e politica de garantia." },
      { type: "action", tool: "buscar_cliente", params: { query: "Carlos Mendes" }, result: null },
      { type: "action", tool: "listar_obras", params: { cliente_id: "cli_001" }, result: null },
      { type: "action", tool: "buscar_historico", params: { cliente_id: "cli_001" }, result: null },
      { type: "rag_search", label: "Busca na base de conhecimento", query: "garantia", result: null },
      { type: "thought", text: "Tenho todos os dados. Memorias dizem que Carlos e VIP e que houve atraso. Historico confirma: atraso de 5 dias resolvido. Garantia: 5 anos estrutural. Vou dar resposta completa e especifica (preferencia do usuario)." },
      { type: "answer", text: "Ola! Sobre a obra do Carlos Mendes (OBR-034):\n\nStatus: EM ANDAMENTO, 35% concluida\nEtapa atual: Concretagem\nPrazo: 15/05/2026\n\nHistorico recente: Houve um atraso de 5 dias em fevereiro por problema com fornecedor de cimento, mas ja foi resolvido e a obra retomou em 08/03.\n\nSobre a garantia:\n- Estrutural: 5 anos\n- Equipamentos: 2 anos\n- Vinil: 3 anos\n- Mao de obra: 1 ano\n(Valida com manutencao preventiva semestral)\n\nComo Carlos e cliente VIP, recomendo priorizar o acompanhamento semanal." },
    ],
  },
  {
    id: "without_context",
    title: "Sem memoria (chatbot basico)",
    question: "Qual a situacao da obra do Carlos? Ele perguntou sobre a garantia tambem.",
    description: "Mesmo prompt, mas sem memoria de longo prazo, sem historico, sem RAG.",
    steps: [
      { type: "thought", text: "O usuario quer status da obra e garantia. Vou tentar responder com o que sei." },
      { type: "action", tool: "buscar_cliente", params: { query: "Carlos Mendes" }, result: null },
      { type: "action", tool: "listar_obras", params: { cliente_id: "cli_001" }, result: null },
      { type: "answer", text: "A obra do Carlos Mendes (OBR-034) esta em andamento com 35% de progresso.\n\nSobre garantia, recomendo verificar com o setor administrativo os termos especificos do contrato." },
    ],
  },
  {
    id: "memory_followup",
    title: "Follow-up com memoria de conversa",
    question: "E sobre o atraso que teve? Vai impactar o prazo final?",
    description: "O agente usa a memoria da conversa anterior (curto prazo) para entender 'o atraso que teve'.",
    steps: [
      { type: "memory_load", label: "Contexto da conversa anterior", memories: [
        { tipo: "short_term", text: "Ultima pergunta foi sobre obra OBR-034 do Carlos Mendes" },
        { tipo: "short_term", text: "Ja retornei: 35% progresso, etapa concretagem, prazo 15/05" },
        { tipo: "long_term", text: "OBR-034 teve atraso de 5 dias por fornecedor em fevereiro" },
      ]},
      { type: "thought", text: "O usuario esta se referindo ao atraso da OBR-034 mencionado na conversa anterior. Preciso verificar o historico para dar detalhes e avaliar impacto no prazo." },
      { type: "action", tool: "buscar_historico", params: { cliente_id: "cli_001" }, result: null },
      { type: "rag_search", label: "Busca na base de conhecimento", query: "prazo medio obras", result: null },
      { type: "thought", text: "O atraso foi de 5 dias (28/02 a 08/03). Obra de piscina 8x4 tem prazo padrao de 45-60 dias. Com 35% em ~40 dias, esta ligeiramente atrasada mas recuperavel se a concretagem for amanha." },
      { type: "answer", text: "Sim, sobre o atraso:\n\nO que aconteceu: em 28/02, o fornecedor de cimento atrasou a entrega. A obra ficou parada 5 dias e retomou em 08/03.\n\nImpacto no prazo: O prazo original era 45-60 dias (padrao para piscina 8x4). Com o atraso de 5 dias, estamos ligeiramente atrasados mas dentro da margem. Se a concretagem de amanha ocorrer sem problemas, o prazo de 15/05 ainda e viavel.\n\nRecomendacao: acompanhar a concretagem de amanha e verificar se nao ha outros gargalos de material." },
    ],
  },
  {
    id: "rag_policy",
    title: "Consulta a base de conhecimento",
    question: "Cliente perguntou quanto custa fazer uma piscina 6x3 e qual o prazo.",
    description: "O agente consulta documentos internos (RAG) para dar resposta precisa.",
    steps: [
      { type: "thought", text: "O cliente quer preco e prazo de piscina 6x3. Preciso consultar tabela de precos e prazos." },
      { type: "rag_search", label: "Busca: precos piscina", query: "precos piscina", result: null },
      { type: "rag_search", label: "Busca: prazo obras", query: "prazo medio obras", result: null },
      { type: "thought", text: "Encontrei: Piscina 6x3 vinil = R$45-55k. Prazo = 30 dias. Vou dar resposta precisa com range de preco." },
      { type: "answer", text: "De acordo com nossa tabela:\n\nPiscina vinil 6x3:\n- Valor: R$45.000 a R$55.000 (varia com acabamento e acessorios)\n- Prazo medio: 30 dias uteis\n- Inclui: escavacao, estrutura, vinil, equipamentos basicos e mao de obra\n\nAcessorios opcionais:\n- Aquecimento solar: +R$8.000 a R$15.000\n- Iluminacao LED: +R$2.000 a R$4.000\n\nPosso agendar uma visita tecnica para dimensionar o projeto exato?" },
    ],
  },
];

// ============================================================
// MEMORY TYPE STYLES
// ============================================================
var MEMORY_COLORS = {
  short_term: { label: "CURTO PRAZO", color: C.cyan, icon: "C", desc: "Historico da conversa atual" },
  long_term: { label: "LONGO PRAZO", color: C.purple, icon: "L", desc: "Fatos persistentes entre sessoes" },
  episodic: { label: "EPISODICA", color: C.amber, icon: "E", desc: "Eventos passados (LeadHistorico, DiarioObra)" },
  rag: { label: "CONTEXTUAL (RAG)", color: C.orange, icon: "R", desc: "Documentos e politicas da empresa" },
};

// ============================================================
// COMPONENTS
// ============================================================

function ScenarioRunner(props) {
  var scenario = props.scenario;
  var visible = props.visibleSteps;

  return (
    <div>
      {scenario.steps.map(function(step, i) {
        if (i >= visible) return null;

        if (step.type === "memory_load") {
          return (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
              background: C.purple + "08", border: "1px solid " + C.purple + "18",
              fontSize: "10px",
            }}>
              <div style={{ fontWeight: 700, color: C.purple, marginBottom: "6px" }}>
                {"\uD83E\uDDE0"} {step.label}
              </div>
              {step.memories.map(function(m, mi) {
                var mc = MEMORY_COLORS[m.tipo] || MEMORY_COLORS.long_term;
                return (
                  <div key={mi} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                      background: mc.color + "15", color: mc.color,
                    }}>{mc.icon}</span>
                    <span style={{ color: C.textMuted }}>{m.text}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        if (step.type === "thought") {
          return (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
              background: C.amber + "08", border: "1px solid " + C.amber + "18",
              fontSize: "11px",
            }}>
              <span style={{ fontWeight: 700, color: C.amber, fontSize: "9px" }}>{"\uD83E\uDDE0"} PENSAMENTO</span>
              <div style={{ color: C.textMuted, marginTop: "4px", lineHeight: 1.5 }}>{step.text}</div>
            </div>
          );
        }

        if (step.type === "action") {
          var result = execTool(step.tool, step.params);
          return (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
              background: C.cyan + "08", border: "1px solid " + C.cyan + "18",
              fontSize: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, color: C.cyan, fontSize: "9px" }}>{"\uD83D\uDD27"} TOOL</span>
                <span style={{ color: C.cyan, fontWeight: 700 }}>{step.tool}</span>
                <span style={{ color: C.textDim }}>{JSON.stringify(step.params)}</span>
              </div>
              <pre style={{
                margin: 0, padding: "6px 8px", borderRadius: "4px",
                background: C.bg, color: C.green, fontSize: "9px",
                lineHeight: 1.3, whiteSpace: "pre-wrap", fontFamily: "inherit",
                maxHeight: "80px", overflowY: "auto",
              }}>
                {JSON.stringify(result, null, 2).substring(0, 300)}
              </pre>
            </div>
          );
        }

        if (step.type === "rag_search") {
          var kq = (step.query || "").toLowerCase();
          var docs = DB.knowledge.filter(function(k) {
            return k.titulo.toLowerCase().includes(kq) || k.conteudo.toLowerCase().includes(kq);
          });
          return (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
              background: C.orange + "08", border: "1px solid " + C.orange + "18",
              fontSize: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, color: C.orange, fontSize: "9px" }}>{"\uD83D\uDCDA"} RAG SEARCH</span>
                <span style={{ color: C.textDim }}>query: "{step.query}"</span>
              </div>
              {docs.map(function(d, di) {
                return (
                  <div key={di} style={{
                    padding: "6px 8px", borderRadius: "4px", background: C.bg,
                    marginBottom: "4px", fontSize: "9px", color: C.textMuted, lineHeight: 1.4,
                  }}>
                    <span style={{ color: C.orange, fontWeight: 700 }}>{d.titulo}: </span>
                    {d.conteudo}
                  </div>
                );
              })}
            </div>
          );
        }

        if (step.type === "answer") {
          return (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: "10px", marginBottom: "8px",
              background: C.green + "08", border: "1px solid " + C.green + "22",
              fontSize: "12px",
            }}>
              <span style={{ fontWeight: 700, color: C.green, fontSize: "9px" }}>{"\u2705"} RESPOSTA</span>
              <pre style={{
                margin: "6px 0 0", whiteSpace: "pre-wrap", fontFamily: "inherit",
                color: C.text, lineHeight: 1.6, fontSize: "11px",
              }}>
                {step.text}
              </pre>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentMemoryLab() {
  var [activeTab, setActiveTab] = useState("scenarios");
  var [selectedId, setSelectedId] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);

  var selectedScenario = SCENARIOS.find(function(s) { return s.id === selectedId; });

  var play = useCallback(function(id) {
    setSelectedId(id);
    setVisibleSteps(0);
    setPlaying(true);
    var sc = SCENARIOS.find(function(s) { return s.id === id; });
    if (!sc) return;
    sc.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
        if (i === sc.steps.length - 1) setPlaying(false);
      }, (i + 1) * 700);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Cap 4 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Tool Use, Memoria e Contexto
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            4 tipos de memoria | Composicao de tools | Generico vs contextualizado
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "scenarios", label: "Cenarios" },
            { id: "memory", label: "Sistema de Memoria" },
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

        {/* SCENARIOS */}
        {activeTab === "scenarios" && (
          <div>
            {/* Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {SCENARIOS.map(function(sc) {
                var isSel = selectedId === sc.id;
                var isFirst = sc.id === "with_context";
                var isSecond = sc.id === "without_context";
                return (
                  <button key={sc.id} onClick={function() { play(sc.id); }} disabled={playing} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    border: "1px solid " + (isSel ? C.blue + "44" : C.border),
                    background: isSel ? C.blue + "08" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer", fontFamily: "inherit",
                    opacity: playing && !isSel ? 0.5 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{sc.title}</span>
                      {isFirst && <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", background: C.green + "15", color: C.green }}>RECOMENDADO</span>}
                      {isSecond && <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", background: C.red + "15", color: C.red }}>COMPARACAO</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px" }}>
                      Pergunta: "{sc.question}"
                    </div>
                    <div style={{ fontSize: "10px", color: C.textDim }}>{sc.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Execution */}
            {selectedScenario && (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", padding: "14px",
              }}>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>
                  AGENT LOOP — {selectedScenario.title.toUpperCase()}
                  {playing && <span style={{ color: C.amber, marginLeft: "8px" }}>executando...</span>}
                </div>

                {/* User question */}
                <div style={{
                  padding: "10px 14px", borderRadius: "8px", marginBottom: "10px",
                  background: C.blue + "10", border: "1px solid " + C.blue + "22",
                  fontSize: "12px", color: C.text,
                }}>
                  <span style={{ fontSize: "9px", color: C.blue, fontWeight: 700 }}>USUARIO: </span>
                  {selectedScenario.question}
                </div>

                <ScenarioRunner scenario={selectedScenario} visibleSteps={visibleSteps} />
              </div>
            )}
          </div>
        )}

        {/* MEMORY SYSTEM */}
        {activeTab === "memory" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              O sistema de memoria do agente Costa Lima usa 4 camadas complementares.
            </p>

            {/* Memory types */}
            {[
              {
                key: "short_term",
                title: "Curto Prazo (Conversacional)",
                color: C.cyan,
                desc: "Historico da conversa atual. Permite follow-ups como 'e sobre aquele atraso?' sem re-explicar.",
                impl: "Array de messages no contexto do LLM. Sliding window de 8-10 mensagens. Se ultrapassar, resumir com LLM.",
                costaLima: "Ja existe no chat. Cada sessao mantem as ultimas mensagens.",
                data: ["User: Qual a situacao da obra do Carlos?", "Agent: OBR-034 esta em 35%...", "User: E sobre o atraso?", "Agent entende que 'atraso' refere-se a OBR-034"],
              },
              {
                key: "long_term",
                title: "Longo Prazo (Persistente)",
                color: C.purple,
                desc: "Fatos que persistem entre sessoes. Preferencias do usuario, contexto de clientes VIP, aprendizados.",
                impl: "Tabela Prisma MemoriaAgente com userId, tipo, conteudo, relevancia. Consultada no inicio de cada conversa.",
                costaLima: "NOVO: criar tabela no schema. Injetar top 3 memorias mais relevantes no system prompt.",
                data: LONG_TERM_MEMORY.map(function(m) { return "[" + m.tipo + "] " + m.conteudo; }),
              },
              {
                key: "episodic",
                title: "Episodica (Eventos)",
                color: C.amber,
                desc: "O que aconteceu no passado. Acessada sob demanda via tools (buscar_historico).",
                impl: "JA EXISTE: LeadHistorico, DiarioObra, ContaAzulSyncLog. Expor como tool no MCP.",
                costaLima: "Tool buscar_historico(cliente_id) retorna LeadHistorico. O agente decide quando consultar.",
                data: DB.historico["cli_001"].map(function(h) { return h.data + ": " + h.nota; }),
              },
              {
                key: "rag",
                title: "Contextual (RAG)",
                color: C.orange,
                desc: "Documentos, politicas, manuais. Busca semantica por relevancia.",
                impl: "Documentos em vector store (Pinecone, Supabase pgvector). Busca por embedding similarity.",
                costaLima: "Politica de garantia, tabela de precos, procedimentos. O agente busca quando o cliente pergunta algo especifico.",
                data: DB.knowledge.map(function(k) { return k.titulo + ": " + k.conteudo.substring(0, 80) + "..."; }),
              },
            ].map(function(mem) {
              var mc = MEMORY_COLORS[mem.key];
              return (
                <div key={mem.key} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", marginBottom: "12px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <span style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: mc.color + "20", border: "1px solid " + mc.color + "44",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 800, color: mc.color,
                    }}>{mc.icon}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: mc.color }}>{mem.title}</div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>{mem.desc}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "11px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: C.textDim, fontWeight: 700, fontSize: "9px" }}>IMPLEMENTACAO: </span>
                      <span style={{ color: C.textMuted }}>{mem.impl}</span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: C.textDim, fontWeight: 700, fontSize: "9px" }}>COSTA LIMA: </span>
                      <span style={{ color: C.green }}>{mem.costaLima}</span>
                    </div>
                    <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "4px" }}>DADOS DE EXEMPLO:</div>
                    {mem.data.map(function(d, i) {
                      return (
                        <div key={i} style={{
                          padding: "4px 8px", borderRadius: "4px", marginBottom: "2px",
                          background: C.surfaceAlt, fontSize: "9px", color: C.textMuted,
                        }}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Context budget */}
            <div style={{
              background: C.surfaceAlt, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "16px",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.text, marginBottom: "10px" }}>Context Window Budget</div>
              {[
                { label: "System prompt", tokens: 300, color: C.textMuted },
                { label: "Tool schemas (6 tools)", tokens: 800, color: C.cyan },
                { label: "Memorias longo prazo (top 3)", tokens: 200, color: C.purple },
                { label: "Documento RAG", tokens: 500, color: C.orange },
                { label: "Historico conversa (8 msgs)", tokens: 2000, color: C.blue },
                { label: "Resultados de tools", tokens: 1000, color: C.green },
                { label: "Espaco para resposta", tokens: 1200, color: C.amber },
              ].map(function(item, i) {
                var total = 6000;
                var pct = (item.tokens / total * 100).toFixed(0);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    marginBottom: "6px", fontSize: "10px",
                  }}>
                    <span style={{ color: C.textMuted, width: "180px" }}>{item.label}</span>
                    <div style={{ flex: 1, height: "8px", background: C.bg, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: item.color, borderRadius: "4px" }} />
                    </div>
                    <span style={{ color: item.color, fontWeight: 700, width: "60px", textAlign: "right" }}>{item.tokens} tok</span>
                    <span style={{ color: C.textDim, width: "30px", textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
              <div style={{
                marginTop: "10px", paddingTop: "8px", borderTop: "1px solid " + C.border,
                display: "flex", justifyContent: "space-between", fontSize: "11px",
              }}>
                <span style={{ color: C.textMuted }}>Total por interacao</span>
                <span style={{ color: C.text, fontWeight: 800 }}>~6.000 tokens (~$0.004 com Haiku)</span>
              </div>
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Generico vs contextualizado - a diferenca que importa",
                color: C.red,
                text: "SEM MEMORIA:\n'A obra esta em andamento. Sobre garantia, consulte o administrativo.'\n\nCOM MEMORIA:\n'OBR-034 esta em 35%, etapa concretagem. Houve atraso de 5 dias em fevereiro (fornecedor de cimento, ja resolvido). Prazo 15/05 viavel. Garantia: 5 anos estrutural, 2 anos equipamentos, 3 anos vinil.'\n\nA diferenca: dados especificos vs frases genericas. Numeros, datas e fatos vs 'consulte o suporte'. Memoria transforma o agente de inutil em indispensavel.",
              },
              {
                title: "Schemas de tools - o contrato que guia o agente",
                color: C.cyan,
                text: "RUIM: { name: 'buscar', params: { q: string } }\nBOM: { name: 'buscar_cliente', description: 'Busca clientes por nome, telefone ou ID. Use quando o usuario mencionar um cliente.', params: { query: { type: 'string', description: 'Nome parcial, telefone ou ID. Ex: Carlos, 24 99999, cli_001' } } }\n\nRegras:\n1. Nome descritivo (buscar_cliente, nao search)\n2. Description com O QUE, QUANDO usar, O QUE retorna\n3. Parametros com exemplos\n4. Enums para valores fechados\n5. IDs consistentes entre tools",
              },
              {
                title: "Composicao de tools - o output de uma e o input da outra",
                color: C.green,
                text: "buscar_cliente('Carlos') -> { id: 'cli_001' }\n  -> listar_obras({ cliente_id: 'cli_001' }) -> [{ id: 'obr_001' }]\n    -> buscar_historico({ cliente_id: 'cli_001' }) -> [eventos...]\n\nO agente aprende a compor observando os schemas. Se listar_obras aceita cliente_id e buscar_cliente retorna id, o modelo infere a conexao. Mantenha nomes de campo consistentes entre tools.",
              },
              {
                title: "Implementacao de memoria no Costa Lima",
                color: C.purple,
                text: "Curto prazo: ja existe (messages array). Adicionar sliding window de 10 msgs.\n\nLongo prazo: CRIAR tabela MemoriaAgente no Prisma. Campos: userId, tipo, conteudo, relevancia. Injetar top 3 no system prompt de cada conversa.\n\nEpisodica: JA EXISTE (LeadHistorico, DiarioObra). Expor como tool buscar_historico no MCP.\n\nContextual (RAG): Documentos em pgvector (Supabase) ou Pinecone. Busca semantica quando agente precisa de politica/procedimento. Para comecar: indexar garantia, precos, procedimentos, FAQ.",
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
