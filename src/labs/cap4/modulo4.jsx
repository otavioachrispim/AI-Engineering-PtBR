import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316", pink: "#ec4899",
};

// ============================================================
// AGENT DEFINITIONS
// ============================================================
var AGENTS = {
  triador: {
    name: "Triador",
    icon: "\uD83C\uDFAF",
    color: C.amber,
    role: "Classifica intencao, urgencia e decide o pipeline",
    tools: ["classificar_intencao", "avaliar_urgencia", "definir_pipeline"],
    systemPrompt: "Voce e o triador do Costa Lima. Classifique a intencao e urgencia. Decida quais agentes acionar.",
  },
  analista: {
    name: "Analista",
    icon: "\uD83D\uDD0D",
    color: C.cyan,
    role: "Busca e cruza dados do sistema (clientes, obras, estoque, historico)",
    tools: ["buscar_cliente", "listar_obras", "buscar_historico", "buscar_estoque", "consultar_agenda"],
    systemPrompt: "Voce e o analista de dados. Busque todas as informacoes relevantes e sintetize.",
  },
  executor: {
    name: "Executor",
    icon: "\u26A1",
    color: C.green,
    role: "Executa acoes no sistema (criar OS, agendar, gerar orcamento)",
    tools: ["criar_os", "agendar_visita", "gerar_orcamento", "atualizar_status"],
    systemPrompt: "Voce e o executor. Realize as acoes definidas. Sempre mostre preview antes de confirmar.",
  },
  comunicador: {
    name: "Comunicador",
    icon: "\uD83D\uDCAC",
    color: C.purple,
    role: "Gera mensagens, relatorios e notificacoes",
    tools: ["gerar_whatsapp", "gerar_relatorio", "notificar_equipe", "gerar_email"],
    systemPrompt: "Voce e o comunicador. Gere mensagens claras e profissionais adaptadas ao publico.",
  },
};

var AGENT_LIST = Object.keys(AGENTS).map(function(k) { return AGENTS[k]; });

// ============================================================
// MULTI-AGENT SCENARIOS
// ============================================================
var SCENARIOS = [
  {
    id: "full_pipeline",
    title: "Pipeline completo: atendimento a lead",
    input: "Novo lead: Carlos quer piscina 8x4 com prainha. Veio por indicacao.",
    pipeline: ["triador", "analista", "executor", "comunicador"],
    steps: [
      { agent: "triador", type: "think", text: "Lead novo por indicacao. Intencao: CONSTRUCAO. Urgencia media. Indicacao = alta probabilidade de conversao. Pipeline completo necessario." },
      { agent: "triador", type: "result", text: '{ intencao: "CONSTRUCAO", urgencia: "media", score: 92, pipeline: ["analista", "executor", "comunicador"] }' },

      { agent: "analista", type: "tool", name: "buscar_cliente", result: '{ nome: "Carlos Mendes", id: "cli_001", VIP: true, desde: 2024 }' },
      { agent: "analista", type: "tool", name: "listar_obras", result: '{ OBR-034: EM_ANDAMENTO, 35%, R$85k }' },
      { agent: "analista", type: "tool", name: "buscar_estoque", result: '{ bombas: 8, filtros: 5, LED: 1 (BAIXO) }' },
      { agent: "analista", type: "tool", name: "buscar_historico", result: "[5 interacoes, ultima em 08/03, atraso resolvido]" },
      { agent: "analista", type: "think", text: "Carlos e cliente existente e VIP. Ja tem obra em andamento. Nova piscina 8x4 com prainha = ~R$85-95k. Estoque OK exceto LED." },
      { agent: "analista", type: "result", text: "Dados completos: cliente VIP, obra ativa (35%), estoque OK, historico positivo" },

      { agent: "executor", type: "think", text: "Preciso: 1) Criar lead no CRM, 2) Gerar pre-orcamento, 3) Agendar visita tecnica." },
      { agent: "executor", type: "hitl", text: "PREVIEW DE ACOES:\n1. Criar lead: Carlos - CONSTRUCAO - indicacao\n2. Pre-orcamento: Piscina 8x4 + prainha ~R$90k\n3. Agendar visita: 13/03 10h" },
      { agent: "executor", type: "tool", name: "criar_os", result: '{ OS-2026-000107, "Avaliacao piscina 8x4 + prainha" }' },
      { agent: "executor", type: "tool", name: "agendar_visita", result: "{ 13/03 10h, equipe: Felipe + engenheiro }" },
      { agent: "executor", type: "result", text: "OS criada + visita agendada. Aguardando comunicacao." },

      { agent: "comunicador", type: "think", text: "Cliente VIP + indicacao = tom premium. Mensagem WhatsApp + notificacao interna." },
      { agent: "comunicador", type: "tool", name: "gerar_whatsapp", result: '"Ola Carlos! Que otimo ter voce de volta! Agendamos visita tecnica para 13/03 as 10h para avaliar o projeto da piscina 8x4 com prainha. Nosso engenheiro estara presente. Confirma?"' },
      { agent: "comunicador", type: "hitl", text: "PREVIEW MENSAGEM:\nWhatsApp para Carlos: [mensagem acima]\nSlack #comercial: 'Lead VIP - Carlos Mendes quer nova piscina'\n\nAprovar envio?" },
      { agent: "comunicador", type: "result", text: "WhatsApp enviado + equipe notificada" },
    ],
    finalResponse: "Pipeline completo executado:\n\n- Lead classificado: CONSTRUCAO, score 92 (indicacao)\n- Cliente: Carlos Mendes (VIP, obra ativa OBR-034)\n- OS criada: OS-2026-000107\n- Visita agendada: 13/03 10h (Felipe + engenheiro)\n- WhatsApp enviado para Carlos\n- Equipe notificada via Slack\n\n4 agentes | 7 tool calls | 2 aprovacoes humanas",
  },
  {
    id: "emergency",
    title: "Emergencia: bomba parou no condominio",
    input: "URGENTE: bomba parou e esta vazando na piscina do condominio Juliana!",
    pipeline: ["triador", "analista", "executor", "comunicador"],
    steps: [
      { agent: "triador", type: "think", text: "URGENCIA CRITICA detectada: 'parou', 'vazando', 'URGENTE'. Manutencao emergencial. Acionar pipeline completo com prioridade maxima." },
      { agent: "triador", type: "result", text: '{ intencao: "MANUTENCAO", urgencia: "CRITICA", prioridade: "P0", pipeline: ["analista", "executor", "comunicador"], modo: "emergencial" }' },

      { agent: "analista", type: "tool", name: "buscar_cliente", result: '{ "Juliana Ferreira", cli_004, condominio }' },
      { agent: "analista", type: "tool", name: "buscar_estoque", result: "{ bombas: 8 un, filtros: 5 un - estoque OK }" },
      { agent: "analista", type: "tool", name: "consultar_agenda", result: "{ Andre e Paulo disponiveis hoje 16h }" },
      { agent: "analista", type: "result", text: "Cliente encontrada. Bomba em estoque (8 un). Equipe disponivel hoje." },

      { agent: "executor", type: "think", text: "Emergencia P0: criar OS imediata + alocar equipe hoje + levar bomba reserva." },
      { agent: "executor", type: "tool", name: "criar_os", result: '{ OS-2026-000108, P0, "Bomba parou + vazamento" }' },
      { agent: "executor", type: "tool", name: "agendar_visita", result: "{ HOJE 16h, Andre + Paulo, bomba reserva }" },
      { agent: "executor", type: "result", text: "OS P0 criada. Equipe alocada hoje 16h com bomba reserva." },

      { agent: "comunicador", type: "think", text: "Emergencia: tom urgente mas tranquilizador. Instrucoes imediatas (desligar bomba)." },
      { agent: "comunicador", type: "tool", name: "gerar_whatsapp", result: '"Juliana, ja estamos cuidando! Equipe tecnica (Andre e Paulo) chega hoje as 16h com bomba reserva. IMPORTANTE: desligue a bomba pelo disjuntor agora para evitar danos. Qualquer duvida me liga!"' },
      { agent: "comunicador", type: "tool", name: "notificar_equipe", result: '"#urgente Andre, Paulo: emergencia condominio Juliana 16h. Levar bomba 1/2cv. Vazamento ativo."' },
      { agent: "comunicador", type: "result", text: "Cliente notificada com instrucoes + equipe acionada" },
    ],
    finalResponse: "EMERGENCIA PROCESSADA (P0):\n\n- OS-2026-000108 criada (prioridade maxima)\n- Equipe: Andre + Paulo, HOJE 16h\n- Material: bomba reserva 1/2cv separada\n- Cliente: Juliana notificada + instrucao para desligar bomba\n- Equipe: alerta enviado no Slack #urgente\n\nTempo de resposta: <3 segundos do input ate todas as acoes",
  },
  {
    id: "report",
    title: "Relatorio semanal para diretoria",
    input: "Gera um relatorio executivo da semana para a diretoria: obras, financeiro e estoque.",
    pipeline: ["triador", "analista", "comunicador"],
    steps: [
      { agent: "triador", type: "think", text: "Relatorio executivo. Nao precisa de Executor (sem acoes). Analista coleta dados, Comunicador formata." },
      { agent: "triador", type: "result", text: '{ intencao: "RELATORIO", urgencia: "baixa", pipeline: ["analista", "comunicador"] }' },

      { agent: "analista", type: "tool", name: "listar_obras", result: "{ 2 ativas: OBR-034 (35%, R$85k), OBR-045 (70%, R$52k). 1 concluida: OBR-029 }" },
      { agent: "analista", type: "tool", name: "buscar_estoque", result: "{ 5 itens. 2 abaixo do minimo: Kit LED (1/3), Aquec. Solar (2/2) }" },
      { agent: "analista", type: "think", text: "Financeiro: receber R$69k, pagar R$11k, saldo projetado R$58k. Obras ativas somam R$137k." },
      { agent: "analista", type: "result", text: "Todos os dados coletados. 3 obras, R$137k em carteira, estoque com 2 alertas." },

      { agent: "comunicador", type: "think", text: "Relatorio para diretoria: executivo, numeros claros, alertas destacados, recomendacoes." },
      { agent: "comunicador", type: "tool", name: "gerar_relatorio", result: '"RELATORIO SEMANAL\n\nOBRAS: 2 ativas (R$137k), 1 concluida\n- OBR-034: 35% (Carlos Mendes) - no prazo\n- OBR-045: 70% (Marcos Oliveira) - adiantada\n\nFINANCEIRO: Receber R$69k | Pagar R$11k | Saldo +R$58k\n\nESTOQUE: 2 alertas\n- Kit LED: 1/3 (reabastecer)\n- Aquec. Solar: 2/2 (limite)\n\nRECOMENDACOES:\n1. Comprar Kit LED (estoque critico)\n2. Acompanhar concretagem OBR-034 amanha"' },
      { agent: "comunicador", type: "hitl", text: "PREVIEW RELATORIO:\n[relatorio acima]\n\nEnviar por email para diretoria?" },
      { agent: "comunicador", type: "result", text: "Relatorio gerado e enviado" },
    ],
    finalResponse: "Relatorio semanal gerado:\n\n- 2 obras ativas (R$137k em carteira)\n- Saldo financeiro projetado: +R$58k\n- 2 alertas de estoque (LED e Solar)\n- 2 recomendacoes de acao\n\n3 agentes | 4 tool calls | 1 aprovacao | Pipeline sem Executor (nenhuma acao de escrita no sistema)",
  },
];

// ============================================================
// COMPARISON DATA: single agent vs multi-agent
// ============================================================
var COMPARISON = {
  single: {
    label: "Agente Unico",
    color: C.amber,
    systemPrompt: "3.200 tokens (cobre tudo: CRM, obras, estoque, financeiro, comunicacao)",
    tools: "20 tools no contexto",
    quality: "Boa para consultas simples. Degrada em tarefas complexas.",
    issues: [
      "Contexto poluido: 20 tools competem por atencao",
      "System prompt generico: instrucoes vagas para cada dominio",
      "Sem especializacao: mesma 'personalidade' para tudo",
      "Dificil de debugar: tudo no mesmo trace",
      "Escala mal: cada nova tool piora todas",
    ],
  },
  multi: {
    label: "4 Agentes Especializados",
    color: C.green,
    systemPrompt: "4x ~500 tokens = ~2.000 tokens (focado por dominio)",
    tools: "3-5 tools por agente (contexto limpo)",
    quality: "Excelente em cada dominio. Pipeline previsivel.",
    advantages: [
      "Contexto limpo: cada agente ve so suas tools",
      "System prompt focado: instrucoes precisas por dominio",
      "Especializacao: Comunicador gera mensagens melhores que generalista",
      "Debug granular: trace mostra qual agente errou",
      "Escala bem: novo dominio = novo agente, sem afetar outros",
    ],
  },
};

// ============================================================
// COMPONENTS
// ============================================================

function AgentStep(props) {
  var step = props.step;
  var visible = props.visible;
  if (!visible) return null;

  var agent = AGENTS[step.agent];
  if (!agent) return null;

  var bgColors = {
    think: agent.color + "06",
    result: agent.color + "08",
    tool: C.surfaceAlt,
    hitl: C.orange + "08",
  };
  var borderColors = {
    think: agent.color + "18",
    result: agent.color + "22",
    tool: C.border,
    hitl: C.orange + "22",
  };
  var labels = {
    think: "PENSAMENTO",
    result: "RESULTADO",
    tool: "TOOL",
    hitl: "APROVACAO HUMANA",
  };

  return (
    <div style={{
      display: "flex", gap: "10px", marginBottom: "6px",
    }}>
      {/* Agent badge */}
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%",
        background: agent.color + "20", border: "2px solid " + agent.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", flexShrink: 0, marginTop: "4px",
      }}>
        {agent.icon}
      </div>

      <div style={{
        flex: 1, padding: "10px 12px", borderRadius: "8px",
        background: bgColors[step.type] || C.surfaceAlt,
        border: "1px solid " + (borderColors[step.type] || C.border),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span style={{
            fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
            background: agent.color + "15", color: agent.color,
          }}>{agent.name}</span>
          <span style={{ fontSize: "8px", fontWeight: 700, color: step.type === "hitl" ? C.orange : C.textDim }}>
            {labels[step.type] || step.type.toUpperCase()}
          </span>
          {step.name && <span style={{ fontSize: "10px", color: C.cyan, fontWeight: 700 }}>{step.name}</span>}
        </div>

        {step.type === "tool" && step.result && (
          <div style={{
            padding: "6px 8px", borderRadius: "4px", background: C.bg,
            fontSize: "9px", color: C.green, lineHeight: 1.4, fontFamily: "inherit",
          }}>
            {step.result}
          </div>
        )}

        {(step.type === "think" || step.type === "result" || step.type === "hitl") && step.text && (
          <pre style={{
            margin: 0, fontSize: "10px",
            color: step.type === "hitl" ? C.orange : step.type === "result" ? agent.color : C.textMuted,
            lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit",
            fontWeight: step.type === "result" ? 600 : 400,
          }}>
            {step.text}
          </pre>
        )}

        {step.type === "hitl" && (
          <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
            <button style={{
              padding: "4px 14px", borderRadius: "4px", border: "none",
              background: C.green, color: "#fff", fontSize: "9px",
              fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}>Aprovar</button>
            <button style={{
              padding: "4px 14px", borderRadius: "4px",
              border: "1px solid " + C.red + "44", background: "transparent",
              color: C.red, fontSize: "9px", fontFamily: "inherit", cursor: "pointer",
            }}>Rejeitar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineIndicator(props) {
  var pipeline = props.pipeline;
  var activeAgent = props.activeAgent;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "4px", marginBottom: "14px",
      padding: "8px 12px", borderRadius: "8px", background: C.surfaceAlt,
    }}>
      {pipeline.map(function(agentKey, i) {
        var agent = AGENTS[agentKey];
        var isActive = agentKey === activeAgent;
        var isPast = pipeline.indexOf(activeAgent) > i;
        return (
          <div key={agentKey} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: 700,
              background: isActive ? agent.color + "20" : isPast ? agent.color + "10" : "transparent",
              color: isActive ? agent.color : isPast ? agent.color : C.textDim,
              border: "1px solid " + (isActive ? agent.color : isPast ? agent.color + "44" : C.border),
            }}>
              {agent.icon} {agent.name}
            </div>
            {i < pipeline.length - 1 && (
              <span style={{ color: isPast ? C.green : C.textDim, fontSize: "12px" }}>{"\u2192"}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MultiAgentLab() {
  var [activeTab, setActiveTab] = useState("scenarios");
  var [selectedId, setSelectedId] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);

  var selectedScenario = SCENARIOS.find(function(s) { return s.id === selectedId; });

  // Track which agent is currently active
  var activeAgent = null;
  if (selectedScenario && visibleSteps > 0) {
    var lastVisible = selectedScenario.steps[Math.min(visibleSteps - 1, selectedScenario.steps.length - 1)];
    if (lastVisible) activeAgent = lastVisible.agent;
  }

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
      }, (i + 1) * 500);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.pink, padding: "4px 10px", borderRadius: "4px",
            background: C.pink + "12", border: "1px solid " + C.pink + "33",
          }}>Cap 4 - Modulo 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Sistemas Multiagente
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Supervisor | Handoff | Especializacao | Cooperacao entre agentes
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "scenarios", label: "Cenarios" },
            { id: "agents", label: "Agentes (4)" },
            { id: "compare", label: "Single vs Multi" },
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {SCENARIOS.map(function(sc) {
                var isSel = selectedId === sc.id;
                return (
                  <button key={sc.id} onClick={function() { play(sc.id); }} disabled={playing} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    border: "1px solid " + (isSel ? C.blue + "44" : C.border),
                    background: isSel ? C.blue + "08" : C.surface,
                    color: C.text, cursor: playing ? "default" : "pointer", fontFamily: "inherit",
                    opacity: playing && !isSel ? 0.5 : 1,
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>{sc.title}</div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>{sc.input}</div>
                    <div style={{ fontSize: "9px", color: C.textDim }}>
                      Pipeline: {sc.pipeline.map(function(p) { return AGENTS[p].icon + AGENTS[p].name; }).join(" -> ")}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedScenario && (
              <div>
                <PipelineIndicator pipeline={selectedScenario.pipeline} activeAgent={activeAgent} />

                <div style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "14px", marginBottom: "12px",
                }}>
                  <div style={{
                    padding: "8px 12px", borderRadius: "8px", marginBottom: "12px",
                    background: C.blue + "10", border: "1px solid " + C.blue + "22",
                    fontSize: "12px", color: C.text,
                  }}>
                    <span style={{ fontSize: "9px", color: C.blue, fontWeight: 700 }}>INPUT: </span>
                    {selectedScenario.input}
                  </div>

                  {selectedScenario.steps.map(function(step, i) {
                    return <AgentStep key={i} step={step} visible={i < visibleSteps} />;
                  })}

                  {!playing && visibleSteps >= selectedScenario.steps.length && (
                    <div style={{
                      padding: "12px 14px", borderRadius: "8px", marginTop: "8px",
                      background: C.green + "08", border: "1px solid " + C.green + "22",
                      fontSize: "11px", color: C.text, lineHeight: 1.6,
                    }}>
                      <span style={{ fontSize: "9px", color: C.green, fontWeight: 700 }}>RESULTADO FINAL</span>
                      <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                        {selectedScenario.finalResponse}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AGENTS */}
        {activeTab === "agents" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Os 4 agentes especializados do Costa Lima. Cada um tem dominio, tools e personalidade proprios.
            </p>
            {AGENT_LIST.map(function(agent) {
              return (
                <div key={agent.name} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", marginBottom: "10px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "14px 16px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "12px",
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: agent.color + "20", border: "2px solid " + agent.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px",
                    }}>
                      {agent.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: agent.color }}>{agent.name}</div>
                      <div style={{ fontSize: "10px", color: C.textMuted }}>{agent.role}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>TOOLS ({agent.tools.length})</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {agent.tools.map(function(t) {
                        return (
                          <span key={t} style={{
                            padding: "3px 8px", borderRadius: "4px", fontSize: "9px",
                            background: agent.color + "10", color: agent.color,
                            border: "1px solid " + agent.color + "22",
                          }}>{t}</span>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "4px" }}>SYSTEM PROMPT</div>
                    <div style={{
                      padding: "8px 10px", borderRadius: "6px", background: C.bg,
                      fontSize: "10px", color: C.textMuted, lineHeight: 1.5, fontStyle: "italic",
                    }}>
                      {agent.systemPrompt}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMPARE */}
        {activeTab === "compare" && (
          <div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[COMPARISON.single, COMPARISON.multi].map(function(c) {
                var isMulti = c === COMPARISON.multi;
                var items = isMulti ? c.advantages : c.issues;
                return (
                  <div key={c.label} style={{
                    flex: 1, minWidth: "280px",
                    background: C.surface, border: "1px solid " + c.color + "33",
                    borderRadius: "10px", padding: "16px",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: c.color, marginBottom: "10px" }}>{c.label}</div>
                    <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px" }}>System prompt:</div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "8px" }}>{c.systemPrompt}</div>
                    <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px" }}>Tools:</div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "8px" }}>{c.tools}</div>
                    <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px" }}>Qualidade:</div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "10px" }}>{c.quality}</div>
                    <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "6px" }}>{isMulti ? "Vantagens:" : "Problemas:"}</div>
                    {items.map(function(item, i) {
                      return (
                        <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", paddingLeft: "8px" }}>
                          <span style={{ color: isMulti ? C.green : C.red, marginRight: "6px" }}>{isMulti ? "+" : "-"}</span>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{
              background: C.green + "08", border: "1px solid " + C.green + "22",
              borderRadius: "10px", padding: "16px",
            }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: C.green, margin: "0 0 8px" }}>Quando usar qual</h3>
              <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.7 }}>
                Agente unico: ate 5 tools, tarefas simples (consultas, classificacao). E o copiloto do Cap 3.
                <br />Multi-agente: 10+ tools, tarefas complexas (pipeline de atendimento, relatorios cruzados, emergencias). E o sistema completo do Cap 4.
                <br /><br />Comece com agente unico. Quando sentir que o contexto esta poluido e a qualidade cai, divida em especialistas.
              </p>
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Padroes de orquestracao",
                color: C.purple,
                text: "SUPERVISOR: 1 coordenador + N especialistas. Coordenador delega e sintetiza.\nHANDOFF: A -> B -> C -> D pipeline linear. Simples, previsivel.\nHIERARQUICA: coordenadores em niveis. Para sistemas grandes.\nGROUP CHAT: agentes discutem entre si. Para decisoes complexas.\nDELEGATION: qualquer um chama qualquer um. Flexivel mas caótico.\n\nCosta Lima usa HANDOFF + SUPERVISOR: Triador decide o pipeline, agentes executam em sequencia.",
              },
              {
                title: "Comunicacao entre agentes: estado compartilhado",
                color: C.cyan,
                text: "Os agentes NAO conversam diretamente. Eles compartilham um ESTADO (AgentState) que vai sendo enriquecido:\n\n1. Triador adiciona: classificacao, urgencia, pipeline\n2. Analista adiciona: dados do cliente, obras, estoque\n3. Executor adiciona: acoes realizadas (OS, agenda)\n4. Comunicador adiciona: mensagens geradas\n\nCada agente le o que precisa e adiciona sua contribuicao. O estado e o contrato entre eles.",
              },
              {
                title: "Design do sistema Costa Lima",
                color: C.green,
                text: "4 agentes:\n- Triador: 3 tools, classifica e roteia (Haiku = rapido e barato)\n- Analista: 5 tools, busca dados (Haiku = volume alto)\n- Executor: 4 tools, acoes com HITL (Sonnet = precisa de qualidade)\n- Comunicador: 4 tools, mensagens com HITL (Sonnet = tom importa)\n\nO Triador decide se precisa de todos ou so de alguns:\n- Consulta simples: Triador -> Analista (pula Executor e Comunicador)\n- Atendimento completo: todos os 4\n- Relatorio: Triador -> Analista -> Comunicador (pula Executor)\n- Emergencia: todos com prioridade P0",
              },
              {
                title: "Quando NAO usar multiagente",
                color: C.red,
                text: "Multi-agente adiciona complexidade. NAO use quando:\n- Ate 5 tools (agente unico da conta)\n- Tarefa sempre segue o mesmo caminho (use pipeline fixo)\n- Latencia e critica (cada agente = chamada extra de LLM)\n- Time pequeno (mais agentes = mais codigo pra manter)\n\nRegra: se agente unico funciona bem com suas tools, NAO complique. Multi-agente e para quando o generalista degrada.",
              },
              {
                title: "Implementacao no Costa Lima",
                color: C.amber,
                text: "backend/src/agents/\n  supervisor.ts    <- decide pipeline + orquestra\n  triador.ts       <- classifica intencao/urgencia\n  analista.ts      <- busca dados (reusa MCP tools)\n  executor.ts      <- acoes com HITL\n  comunicador.ts   <- mensagens e relatorios\n  state.ts         <- interface AgentState\n  runner.ts        <- executa pipeline\n  traces.ts        <- observabilidade\n\nCada agente tem sua propria instancia de LLM (Haiku ou Sonnet), seu system prompt focado, e suas tools (subset do MCP Server). O runner orquestra a sequencia definida pelo Triador.",
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
