import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED TOOLS
// ============================================================
var TOOLS_DB = {
  buscar_cliente: function(p) {
    var clients = [
      { id: "cli_001", nome: "Carlos Mendes", tel: "24 99999-1234", cidade: "Volta Redonda" },
      { id: "cli_002", nome: "Ana Paula Costa", tel: "24 99888-5678", cidade: "Barra Mansa" },
    ];
    var q = (p.query || "").toLowerCase();
    return clients.filter(function(c) { return c.nome.toLowerCase().includes(q); });
  },
  listar_obras: function(p) {
    var obras = [
      { codigo: "OBR-034", clienteId: "cli_001", cliente: "Carlos Mendes", status: "EM_ANDAMENTO", progresso: 35, valor: 85000, prazo: "2026-05-15" },
      { codigo: "OBR-041", clienteId: "cli_002", cliente: "Ana Paula", status: "APROVADA", progresso: 0, valor: 32000, prazo: "2026-06-01" },
    ];
    if (p.cliente_id) return obras.filter(function(o) { return o.clienteId === p.cliente_id; });
    if (p.status) return obras.filter(function(o) { return o.status === p.status; });
    return obras;
  },
  consultar_agenda: function(p) {
    return [
      { data: "2026-03-12", hora: "08:00", desc: "Concretagem OBR-034", equipe: "Joao, Pedro, Lucas" },
      { data: "2026-03-12", hora: "14:00", desc: "Vistoria Ana Paula", equipe: "Andre" },
    ].filter(function(a) { return !p.data || a.data === p.data; });
  },
  buscar_estoque: function(p) {
    var items = [
      { nome: "Cimento 50kg", estoque: 48, necessario: 40, status: "OK" },
      { nome: "Ferro 3/8", estoque: 120, necessario: 100, status: "OK" },
      { nome: "Bomba 1/2cv", estoque: 8, necessario: 1, status: "OK" },
      { nome: "Kit LED", estoque: 1, necessario: 3, status: "BAIXO" },
    ];
    if (p.query) {
      var sq = p.query.toLowerCase();
      return items.filter(function(i) { return i.nome.toLowerCase().includes(sq); });
    }
    return items;
  },
  consultar_financeiro: function() {
    return { receber_pendente: 69000, pagar_pendente: 11000, saldo_projetado: 58000 };
  },
  criar_os: function(p) {
    return { codigo: "OS-2026-000104", status: "PENDENTE", descricao: p.descricao, prioridade: p.prioridade || "media" };
  },
  agendar_visita: function(p) {
    return { status: "agendado", data: p.data, hora: p.hora, desc: p.descricao };
  },
  enviar_whatsapp: function(p) {
    return { sent: true, to: p.to, preview: (p.msg || "").substring(0, 60) };
  },
};

function callTool(name, params) {
  var fn = TOOLS_DB[name];
  if (!fn) return { error: "Tool nao encontrada: " + name };
  return fn(params || {});
}

// ============================================================
// AGENT SCENARIOS
// ============================================================

var SCENARIOS = [
  {
    id: "react_status",
    name: "ReAct: Status completo de obra",
    pattern: "ReAct",
    patternColor: C.cyan,
    objective: "Dar um relatorio completo da obra do Carlos Mendes: progresso, proximas atividades, materiais e financeiro.",
    steps: [
      { type: "thought", text: "O usuario quer um relatorio completo da obra do Carlos. Preciso: 1) encontrar o cliente, 2) dados da obra, 3) agenda, 4) materiais, 5) financeiro." },
      { type: "action", tool: "buscar_cliente", params: { query: "Carlos Mendes" } },
      { type: "thought", text: "Encontrei Carlos Mendes (cli_001). Agora busco as obras dele." },
      { type: "action", tool: "listar_obras", params: { cliente_id: "cli_001" } },
      { type: "thought", text: "Obra OBR-034, 35% concluida, R$85k. Preciso ver a agenda proxima e estoque de materiais." },
      { type: "action", tool: "consultar_agenda", params: { data: "2026-03-12" } },
      { type: "thought", text: "Amanha tem concretagem as 8h. Preciso verificar se tem cimento suficiente." },
      { type: "action", tool: "buscar_estoque", params: { query: "cimento" } },
      { type: "thought", text: "Cimento: 48 sacos, precisa de 40. OK. Agora o financeiro." },
      { type: "action", tool: "consultar_financeiro", params: {} },
      { type: "thought", text: "Financeiro: R$69k a receber, R$11k a pagar. Tenho todas as informacoes para o relatorio." },
      { type: "answer", text: "Relatorio da Obra OBR-034 (Carlos Mendes):\n\nProgresso: 35% concluida | Prazo: 15/05/2026\nProxima atividade: Concretagem amanha 08h (Joao, Pedro, Lucas)\nMateriais: Cimento OK (48/40 sacos)\nFinanceiro: R$69k a receber, saldo projetado R$58k\n\nStatus geral: No prazo, materiais disponiveis. Proxima fase critica e a concretagem de amanha." },
    ],
  },
  {
    id: "plan_exec",
    name: "Plan-and-Execute: Processar lead completo",
    pattern: "Plan-and-Execute",
    patternColor: C.purple,
    objective: "Lead novo chegou: Ana Paula quer reforma de piscina. Processar completamente: classificar, criar registro, agendar visita, notificar.",
    steps: [
      { type: "plan", text: "PLANO DE EXECUCAO:\n1. Buscar se cliente ja existe no sistema\n2. Verificar se ha obra anterior\n3. Criar OS para avaliacao\n4. Agendar visita tecnica\n5. Enviar confirmacao por WhatsApp\n\nTotal: 5 passos. Estimativa: 3 segundos." },
      { type: "action", tool: "buscar_cliente", params: { query: "Ana Paula" }, planStep: 1 },
      { type: "checkpoint", text: "Passo 1 OK: Cliente encontrado (cli_002). Ja e cadastrada." },
      { type: "action", tool: "listar_obras", params: { cliente_id: "cli_002" }, planStep: 2 },
      { type: "checkpoint", text: "Passo 2 OK: 1 obra anterior (CONCLUIDA). Cliente recorrente - bom sinal." },
      { type: "action", tool: "criar_os", params: { descricao: "Avaliacao para reforma de piscina - cliente recorrente", prioridade: "media" }, planStep: 3 },
      { type: "checkpoint", text: "Passo 3 OK: OS criada (OS-2026-000104)." },
      { type: "action", tool: "agendar_visita", params: { data: "2026-03-13", hora: "10:00", descricao: "Visita reforma - Ana Paula" }, planStep: 4 },
      { type: "checkpoint", text: "Passo 4 OK: Visita agendada 13/03 10h." },
      { type: "action", tool: "enviar_whatsapp", params: { to: "24 99888-5678", msg: "Ola Ana Paula! Agendamos visita tecnica para 13/03 as 10h para avaliar a reforma da piscina. Confirma?" }, planStep: 5 },
      { type: "checkpoint", text: "Passo 5 OK: WhatsApp enviado. PLANO CONCLUIDO (5/5 passos)." },
      { type: "answer", text: "Lead processado com sucesso!\n\nCliente: Ana Paula Costa (recorrente - obra anterior concluida)\nOS criada: OS-2026-000104 (avaliacao reforma)\nVisita agendada: 13/03 as 10h\nWhatsApp: Confirmacao enviada para 24 99888-5678\n\nTodas as 5 etapas concluidas. Aguardando confirmacao da cliente." },
    ],
  },
  {
    id: "reflection",
    name: "Reflection: Gerar orcamento revisado",
    pattern: "Reflection",
    patternColor: C.orange,
    objective: "Gerar um pre-orcamento para reforma da piscina da Ana Paula, revisar se esta completo e corrigir se necessario.",
    steps: [
      { type: "thought", text: "Preciso gerar um orcamento. Primeiro, buscar dados da cliente e o que ela precisa." },
      { type: "action", tool: "buscar_cliente", params: { query: "Ana Paula" } },
      { type: "action", tool: "buscar_estoque", params: {} },
      { type: "thought", text: "Vou gerar um pre-orcamento baseado em reforma tipica." },
      { type: "draft", text: "PRE-ORCAMENTO v1:\n- Troca de vinil 6x3: R$8.000\n- Mao de obra: R$4.000\n\nTotal: R$12.000" },
      { type: "reflection", text: "REVISAO DO ORCAMENTO v1:\n[X] Faltou iluminacao (cliente pode querer upgrade)\n[X] Faltou troca de bomba (piscina antiga, provavel necessidade)\n[X] Nao incluiu prazo\n[ ] Valores unitarios parecem corretos\n\nVeredito: INCOMPLETO. Preciso adicionar itens e prazo.", quality: 40 },
      { type: "draft", text: "PRE-ORCAMENTO v2:\n- Troca de vinil 6x3: R$8.000\n- Kit iluminacao LED: R$480\n- Bomba centrifuga 1/2cv: R$1.250\n- Mao de obra instalacao: R$4.500\n- Mao de obra hidraulica: R$2.000\n\nTotal: R$16.230\nPrazo estimado: 12 dias uteis\nCondicoes: 50% entrada + 2x" },
      { type: "reflection", text: "REVISAO DO ORCAMENTO v2:\n[OK] Todos os itens tipicos incluidos\n[OK] Precos conferidos com catalogo\n[OK] Prazo estimado presente\n[OK] Condicoes de pagamento definidas\n[X] Poderia incluir garantia\n\nVeredito: BOM. Adicionar garantia e finalizar.", quality: 82 },
      { type: "answer", text: "Pre-orcamento para Ana Paula Costa - Reforma de Piscina:\n\n1. Troca de vinil 6x3: R$8.000,00\n2. Kit iluminacao LED: R$480,00\n3. Bomba centrifuga 1/2cv: R$1.250,00\n4. Mao de obra (instalacao + hidraulica): R$6.500,00\n\nTotal: R$16.230,00\nPrazo: 12 dias uteis\nPagamento: 50% entrada + 2x sem juros\nGarantia: 2 anos estrutural, 1 ano equipamentos\n\nOrcamento revisado 2x pelo agente. Pronto para envio." },
    ],
  },
];

// ============================================================
// GUARDRAILS SIMULATOR
// ============================================================
var DEFAULT_GUARDRAILS = {
  maxIterations: 10,
  maxCostUsd: 0.05,
  blockedTools: ["deletar_registro", "alterar_permissoes"],
  requireApproval: ["criar_os", "agendar_visita", "enviar_whatsapp"],
  circuitBreakerErrors: 3,
};

// ============================================================
// COMPONENTS
// ============================================================

function StepDisplay(props) {
  var step = props.step;
  var index = props.index;
  var visible = props.visible;

  if (!visible) return null;

  var styles = {
    thought: { icon: "brain", label: "PENSAMENTO", color: C.amber, bg: C.amber + "08", border: C.amber + "22" },
    action: { icon: "tool", label: "ACAO", color: C.cyan, bg: C.cyan + "08", border: C.cyan + "22" },
    answer: { icon: "check", label: "RESPOSTA FINAL", color: C.green, bg: C.green + "08", border: C.green + "22" },
    plan: { icon: "list", label: "PLANO", color: C.purple, bg: C.purple + "08", border: C.purple + "22" },
    checkpoint: { icon: "flag", label: "CHECKPOINT", color: C.green, bg: C.green + "06", border: C.green + "18" },
    draft: { icon: "doc", label: "RASCUNHO", color: C.blue, bg: C.blue + "08", border: C.blue + "22" },
    reflection: { icon: "mirror", label: "REFLEXAO", color: C.orange, bg: C.orange + "08", border: C.orange + "22" },
  };

  var s = styles[step.type] || styles.thought;
  var icons = { brain: "\uD83E\uDDE0", tool: "\uD83D\uDD27", check: "\u2705", list: "\uD83D\uDCCB", flag: "\u2691", doc: "\uD83D\uDCC4", mirror: "\uD83D\uDD0D" };

  // Execute tool if action
  var toolResult = null;
  if (step.type === "action" && step.tool) {
    toolResult = callTool(step.tool, step.params);
  }

  return (
    <div style={{
      padding: "12px 14px", borderRadius: "10px", marginBottom: "8px",
      background: s.bg, border: "1px solid " + s.border,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px" }}>{icons[s.icon] || "\u25CF"}</span>
        <span style={{ fontSize: "9px", fontWeight: 800, color: s.color, letterSpacing: "0.5px" }}>{s.label}</span>
        {step.planStep && <span style={{ fontSize: "9px", color: C.textDim }}>Passo {step.planStep}/5</span>}
        {step.tool && <span style={{ fontSize: "10px", color: C.cyan, fontWeight: 700 }}>{step.tool}({JSON.stringify(step.params)})</span>}
        {step.quality !== undefined && (
          <span style={{
            marginLeft: "auto", fontSize: "10px", fontWeight: 800,
            color: step.quality >= 80 ? C.green : step.quality >= 50 ? C.amber : C.red,
          }}>
            {step.quality}%
          </span>
        )}
        <span style={{ marginLeft: step.quality !== undefined ? "0" : "auto", fontSize: "9px", color: C.textDim }}>#{index + 1}</span>
      </div>

      {step.text && (
        <pre style={{
          margin: 0, fontSize: "11px", color: step.type === "answer" ? C.green : C.textMuted,
          lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit",
          fontWeight: step.type === "answer" ? 600 : 400,
        }}>
          {step.text}
        </pre>
      )}

      {toolResult && (
        <pre style={{
          margin: "8px 0 0", padding: "8px 10px", borderRadius: "6px",
          background: C.bg, fontSize: "9px", color: C.green,
          lineHeight: 1.4, whiteSpace: "pre-wrap", fontFamily: "inherit",
          maxHeight: "80px", overflowY: "auto",
        }}>
          {JSON.stringify(toolResult, null, 2)}
        </pre>
      )}
    </div>
  );
}

function GuardrailsPanel(props) {
  var guardrails = props.guardrails;
  var scenario = props.scenario;

  var toolCalls = scenario ? scenario.steps.filter(function(s) { return s.type === "action"; }).length : 0;
  var costEstimate = toolCalls * 0.003;
  var writeCalls = scenario ? scenario.steps.filter(function(s) {
    return s.type === "action" && (s.tool === "criar_os" || s.tool === "agendar_visita" || s.tool === "enviar_whatsapp");
  }).length : 0;

  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "10px", padding: "14px",
    }}>
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>GUARDRAILS</div>
      {[
        {
          label: "Max iteracoes",
          value: toolCalls + "/" + guardrails.maxIterations,
          ok: toolCalls <= guardrails.maxIterations,
        },
        {
          label: "Budget custo",
          value: "$" + costEstimate.toFixed(4) + " / $" + guardrails.maxCostUsd.toFixed(2),
          ok: costEstimate <= guardrails.maxCostUsd,
        },
        {
          label: "Acoes com aprovacao",
          value: writeCalls + " acoes de escrita",
          ok: true,
          warn: writeCalls > 0,
        },
        {
          label: "Tools bloqueadas",
          value: guardrails.blockedTools.join(", "),
          ok: true,
        },
        {
          label: "Circuit breaker",
          value: "0/" + guardrails.circuitBreakerErrors + " erros",
          ok: true,
        },
      ].map(function(g, i) {
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 0", fontSize: "10px",
            borderBottom: i < 4 ? "1px solid " + C.border : "none",
          }}>
            <span style={{ color: C.textMuted }}>{g.label}</span>
            <span style={{
              color: !g.ok ? C.red : g.warn ? C.amber : C.green,
              fontWeight: 600,
            }}>
              {g.ok ? (g.warn ? "\u26A0 " : "\u2713 ") : "\u2717 "}{g.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentLoopLab() {
  var [activeTab, setActiveTab] = useState("simulator");
  var [selectedScenario, setSelectedScenario] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);

  var playScenario = useCallback(function(scenario) {
    setSelectedScenario(scenario);
    setVisibleSteps(0);
    setPlaying(true);

    scenario.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
        if (i === scenario.steps.length - 1) setPlaying(false);
      }, (i + 1) * 600);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Cap 4 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Agentes Autonomos: Padroes de Execucao
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            ReAct | Plan-and-Execute | Reflection | Guardrails
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "simulator", label: "Simulador" },
            { id: "compare", label: "Comparativo" },
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

        {/* SIMULATOR */}
        {activeTab === "simulator" && (
          <div>
            {/* Scenario selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {SCENARIOS.map(function(sc) {
                var isSelected = selectedScenario && selectedScenario.id === sc.id;
                return (
                  <button key={sc.id} onClick={function() { playScenario(sc); }} disabled={playing}
                    style={{
                      textAlign: "left", padding: "14px", borderRadius: "10px",
                      border: "1px solid " + (isSelected ? sc.patternColor + "44" : C.border),
                      background: isSelected ? sc.patternColor + "08" : C.surface,
                      color: C.text, cursor: playing ? "default" : "pointer", fontFamily: "inherit",
                      opacity: playing && !isSelected ? 0.5 : 1,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px",
                        background: sc.patternColor + "15", color: sc.patternColor,
                      }}>{sc.pattern}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{sc.name}</span>
                      <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "auto" }}>
                        {sc.steps.filter(function(s) { return s.type === "action"; }).length} tool calls
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted }}>{sc.objective}</div>
                  </button>
                );
              })}
            </div>

            {/* Execution */}
            {selectedScenario && (
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {/* Steps */}
                <div style={{ flex: 1.5, minWidth: "350px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                    AGENT LOOP — {selectedScenario.pattern}
                    {playing && <span style={{ color: C.amber, marginLeft: "8px" }}>executando...</span>}
                  </div>
                  {selectedScenario.steps.map(function(step, i) {
                    return <StepDisplay key={i} step={step} index={i} visible={i < visibleSteps} />;
                  })}
                  {playing && visibleSteps < selectedScenario.steps.length && (
                    <div style={{ textAlign: "center", padding: "12px", color: C.textDim, fontSize: "11px" }}>
                      Etapa {visibleSteps + 1}/{selectedScenario.steps.length}...
                    </div>
                  )}
                </div>

                {/* Guardrails */}
                <div style={{ flex: 0.7, minWidth: "220px" }}>
                  <GuardrailsPanel guardrails={DEFAULT_GUARDRAILS} scenario={selectedScenario} />

                  {/* Stats */}
                  <div style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "14px", marginTop: "10px",
                  }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>METRICAS</div>
                    {[
                      { label: "Padrao", value: selectedScenario.pattern, color: selectedScenario.patternColor },
                      { label: "Total passos", value: selectedScenario.steps.length, color: C.text },
                      { label: "Tool calls", value: selectedScenario.steps.filter(function(s) { return s.type === "action"; }).length, color: C.cyan },
                      { label: "Pensamentos", value: selectedScenario.steps.filter(function(s) { return s.type === "thought"; }).length, color: C.amber },
                      { label: "Reflexoes", value: selectedScenario.steps.filter(function(s) { return s.type === "reflection"; }).length, color: C.orange },
                    ].map(function(m, i) {
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "4px 0", fontSize: "10px",
                        }}>
                          <span style={{ color: C.textMuted }}>{m.label}</span>
                          <span style={{ color: m.color, fontWeight: 700 }}>{m.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px",
              marginBottom: "16px",
            }}>
              {[
                {
                  name: "ReAct", color: C.cyan,
                  flow: "Pensamento -> Acao -> Observacao -> Pensamento -> ...",
                  strengths: "Adaptavel (muda plano em tempo real), transparente (raciocinio visivel), simples de implementar",
                  weaknesses: "Pode ser ineficiente (decide passo a passo), dificil prever custo total",
                  useCase: "Busca de informacoes, troubleshooting, atendimento ao cliente",
                  costaLima: "Copiloto do vendedor: 'qual a situacao da obra?' -> busca e sintetiza",
                },
                {
                  name: "Plan-Execute", color: C.purple,
                  flow: "Plano completo -> Execucao passo a passo -> Resultado",
                  strengths: "Previsivel (plano visivel antes), auditavel, custo estimavel",
                  weaknesses: "Rigido (plano pode ficar obsoleto), overhead do planejamento",
                  useCase: "Workflows multi-etapa, processamento de leads, onboarding",
                  costaLima: "Processar lead: classificar -> criar registro -> agendar -> notificar",
                },
                {
                  name: "Reflection", color: C.orange,
                  flow: "Execucao -> Auto-avaliacao -> Melhoria -> Re-avaliacao -> ...",
                  strengths: "Alta qualidade (auto-correcao), bom para conteudo/documentos",
                  weaknesses: "Mais caro (multiplas iteracoes), mais lento, pode over-optimize",
                  useCase: "Geracao de documentos, orcamentos, relatorios, analises",
                  costaLima: "Gerar orcamento: rascunho -> revisar -> completar -> revisar -> finalizar",
                },
              ].map(function(p) {
                return (
                  <div key={p.name} style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "16px", fontSize: "10px",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: p.color, marginBottom: "10px" }}>{p.name}</div>
                    <div style={{ color: C.textDim, marginBottom: "8px", fontStyle: "italic" }}>{p.flow}</div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: C.green, fontWeight: 700 }}>+</span>
                      <span style={{ color: C.textMuted }}> {p.strengths}</span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: C.red, fontWeight: 700 }}>-</span>
                      <span style={{ color: C.textMuted }}> {p.weaknesses}</span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: C.cyan, fontWeight: 700 }}>Uso:</span>
                      <span style={{ color: C.textMuted }}> {p.useCase}</span>
                    </div>
                    <div style={{
                      padding: "8px", borderRadius: "6px", background: p.color + "08",
                      border: "1px solid " + p.color + "18",
                    }}>
                      <span style={{ color: p.color, fontWeight: 700 }}>Costa Lima:</span>
                      <span style={{ color: C.textMuted }}> {p.costaLima}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: C.green + "08", border: "1px solid " + C.green + "22",
              borderRadius: "10px", padding: "16px",
            }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: C.green, margin: "0 0 8px" }}>Regra de ouro</h3>
              <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.7 }}>
                Comece com ReAct (simples, adaptavel). Se a tarefa tem etapas previsiveis, use Plan-and-Execute. Se qualidade e critica, adicione Reflection. Na pratica, agentes maduros combinam os tres: planejam, executam com ReAct, e refletem no final.
              </p>
            </div>
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Autonomia: comece curta, escale com confianca",
                color: C.amber,
                text: "Curta (1-3 tools): busca + resposta. Baixo risco. Comece aqui.\nMedia (3-10 tools): workflow completo. Risco moderado. Guardrails obrigatorios.\nLonga (10+ tools): operacao autonoma. Risco alto. Monitoramento + circuit breaker + HITL.\n\nPara o Costa Lima hoje: autonomia curta para o copiloto, media para processamento de leads (com aprovacao humana para acoes de escrita).",
              },
              {
                title: "Guardrails - nao sao opcionais",
                color: C.red,
                text: "1. MAX_ITERATIONS: limite de tool calls (10 para curta, 20 para media)\n2. MAX_COST: budget em dolares por execucao\n3. BLOCKED_TOOLS: lista de tools proibidas (delete, alter permissions)\n4. REQUIRE_APPROVAL: tools de escrita precisam OK humano\n5. CIRCUIT_BREAKER: 3 erros seguidos = para e escala\n6. TIMEOUT: 30s para agente curto, 120s para medio\n\nSem guardrails, um agente com bug pode: criar 100 OS, enviar 50 WhatsApps, gastar $100 em tokens. Com guardrails, para na hora.",
              },
              {
                title: "Agent Loop no Costa Lima - implementacao",
                color: C.cyan,
                text: "O agent loop e um while com LLM no meio:\n\n1. Recebe objetivo do usuario\n2. while (!done && iterations < MAX):\n   a. Envia contexto + historico para LLM\n   b. LLM decide: chamar tool OU responder\n   c. Se tool: executa via MCP, adiciona resultado ao contexto\n   d. Se resposta: done = true\n   e. iterations++\n3. Retorna resposta (ou 'nao consegui resolver')\n\nO MCP Server do Cap 3 ja tem as tools. O agent loop e a camada que orquestra as chamadas.",
              },
              {
                title: "Quando NAO usar agente",
                color: C.red,
                text: "Nem tudo precisa de agente. Use chamada direta quando:\n- A tarefa e previsivel (sempre os mesmos passos)\n- Nao precisa de decisao condicional\n- Latencia importa (agente = multiplas chamadas = lento)\n- Custo importa muito (agente = mais tokens)\n\nExemplo: classificar intencao de lead nao precisa de agente. Um prompt com few-shot resolve. Agente e para quando o fluxo depende dos resultados intermediarios.",
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
