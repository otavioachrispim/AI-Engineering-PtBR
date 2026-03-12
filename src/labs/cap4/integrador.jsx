import { useState, useCallback, useRef, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316", pink: "#ec4899",
};

// ============================================================
// DATABASE
// ============================================================
var DB = {
  clientes: [
    { id: "cli_001", nome: "Carlos Mendes", tel: "24 99999-1234", cidade: "Volta Redonda", vip: true },
    { id: "cli_002", nome: "Ana Paula Costa", tel: "24 99888-5678", cidade: "Barra Mansa", vip: false },
    { id: "cli_004", nome: "Juliana Ferreira", tel: "24 99666-3456", cidade: "Volta Redonda", vip: false },
    { id: "cli_005", nome: "Marcos Oliveira", tel: "24 99555-7890", cidade: "Volta Redonda", vip: false },
  ],
  obras: [
    { codigo: "OBR-034", clienteId: "cli_001", cliente: "Carlos Mendes", status: "EM_ANDAMENTO", progresso: 35, valor: 85000, etapa: "Concretagem" },
    { codigo: "OBR-045", clienteId: "cli_005", cliente: "Marcos Oliveira", status: "EM_ANDAMENTO", progresso: 70, valor: 52000, etapa: "Revestimento" },
    { codigo: "OBR-041", clienteId: "cli_004", cliente: "Juliana Ferreira", status: "APROVADA", progresso: 0, valor: 32000, etapa: "Aguardando inicio" },
  ],
  estoque: [
    { nome: "Bomba 1/2cv", estoque: 8, min: 3, preco: 1250 },
    { nome: "Filtro 19L", estoque: 5, min: 2, preco: 890 },
    { nome: "Kit LED", estoque: 1, min: 3, preco: 480 },
    { nome: "Clorador", estoque: 12, min: 5, preco: 650 },
    { nome: "Aquec. Solar", estoque: 2, min: 2, preco: 3200 },
  ],
  agenda: [
    { data: "11/03", hora: "08:00", desc: "Concretagem OBR-034", equipe: "Joao, Pedro" },
    { data: "11/03", hora: "14:00", desc: "Visita terreno Marcos", equipe: "Felipe" },
    { data: "12/03", hora: "09:00", desc: "Troca bomba Cond.", equipe: "Andre, Paulo" },
  ],
  historico: [
    "15/01: Primeiro contato Carlos - quer piscina 8x4",
    "22/01: Visita tecnica aprovada",
    "01/02: Obra iniciada",
    "28/02: Atraso fornecedor cimento (5 dias)",
    "08/03: Obra retomada, progresso 35%",
  ],
  conhecimento: {
    garantia: "Estrutural 5 anos, equipamentos 2 anos, vinil 3 anos, mao de obra 1 ano",
    precos: "Piscina 6x3: R$45-55k. 8x4: R$75-95k. Reforma: R$8-15k. Manutencao mensal: R$350-500",
    prazos: "6x3: 30 dias. 8x4: 45-60 dias. Reforma: 15-20 dias. Manutencao: 1-3 dias",
  },
  financeiro: { receber: 69000, pagar: 11000, saldo: 58000 },
};

var osCounter = 108;

// ============================================================
// AGENTS
// ============================================================
var AGENTS = {
  triador: { name: "Triador", icon: "\uD83C\uDFAF", color: C.amber, model: "Haiku" },
  analista: { name: "Analista", icon: "\uD83D\uDD0D", color: C.cyan, model: "Haiku" },
  executor: { name: "Executor", icon: "\u26A1", color: C.green, model: "Sonnet" },
  comunicador: { name: "Comunicador", icon: "\uD83D\uDCAC", color: C.purple, model: "Sonnet" },
};

// ============================================================
// MEMORY STORE
// ============================================================
var MEMORIES = [
  { tipo: "L", text: "Carlos Mendes e cliente VIP desde 2024" },
  { tipo: "L", text: "OBR-034 teve atraso de 5 dias (fornecedor cimento, fev)" },
  { tipo: "L", text: "Felipe prefere dados especificos com numeros" },
];

// ============================================================
// COMMAND INTERPRETER + MULTI-AGENT PIPELINE
// ============================================================
function runAgentSystem(input) {
  var lower = input.toLowerCase();
  var trace = { steps: [], totalMs: 0, totalCost: 0, agents: [], toolCalls: 0, hitlCount: 0 };

  // Detect characteristics
  var isUrgent = lower.includes("urgente") || lower.includes("vazando") || lower.includes("parou") || lower.includes("emergenc");
  var wantsFinanceiro = lower.includes("financeiro") || lower.includes("faturamento") || lower.includes("receber");
  var wantsRelatorio = lower.includes("relatorio") || lower.includes("resumo") || lower.includes("semanal");
  var wantsAction = lower.includes("cria") || lower.includes("agenda") || lower.includes("manda") || lower.includes("envia");
  var mentionsClient = lower.match(/(?:do|da|de|pro|pra)\s+(\w+)/i);
  var clientName = mentionsClient ? mentionsClient[1] : "";

  // ============ TRIADOR ============
  trace.agents.push("triador");

  // Memory load
  trace.steps.push({
    agent: "triador", type: "memory",
    text: MEMORIES.map(function(m) { return "[" + m.tipo + "] " + m.text; }).join("\n"),
    ms: 5, cost: 0,
  });
  trace.totalMs += 5;

  var intencao = isUrgent ? "EMERGENCIA" : wantsRelatorio ? "RELATORIO" : wantsFinanceiro ? "FINANCEIRO" : wantsAction ? "ACAO" : "CONSULTA";
  var urgencia = isUrgent ? "CRITICA" : "media";
  var pipeline = [];

  if (intencao === "EMERGENCIA") pipeline = ["analista", "executor", "comunicador"];
  else if (intencao === "RELATORIO") pipeline = ["analista", "comunicador"];
  else if (intencao === "ACAO") pipeline = ["analista", "executor", "comunicador"];
  else pipeline = ["analista"];

  if (wantsFinanceiro && AGENTS.analista) pipeline = ["analista"];

  trace.steps.push({
    agent: "triador", type: "think",
    text: "Intencao: " + intencao + " | Urgencia: " + urgencia + "\nCliente mencionado: " + (clientName || "nenhum") + "\nPipeline: " + pipeline.map(function(p) { return AGENTS[p].icon + AGENTS[p].name; }).join(" -> "),
    ms: 120, cost: 0.0003,
  });
  trace.totalMs += 120;
  trace.totalCost += 0.0003;

  trace.steps.push({
    agent: "triador", type: "route",
    text: intencao + " -> [" + pipeline.join(", ") + "]",
    ms: 2, cost: 0,
  });
  trace.totalMs += 2;

  // ============ ANALISTA ============
  if (pipeline.indexOf("analista") >= 0) {
    trace.agents.push("analista");

    // Find client
    if (clientName) {
      var cl = DB.clientes.find(function(c) { return c.nome.toLowerCase().includes(clientName.toLowerCase()); });
      if (cl) {
        trace.steps.push({
          agent: "analista", type: "tool", name: "buscar_cliente",
          result: JSON.stringify({ nome: cl.nome, id: cl.id, vip: cl.vip, tel: cl.tel }),
          ms: 45, cost: 0,
        });
        trace.totalMs += 45;
        trace.toolCalls++;

        var obras = DB.obras.filter(function(o) { return o.clienteId === cl.id; });
        if (obras.length > 0) {
          trace.steps.push({
            agent: "analista", type: "tool", name: "listar_obras",
            result: JSON.stringify(obras.map(function(o) { return o.codigo + ": " + o.status + " " + o.progresso + "% R$" + (o.valor/1000) + "k"; })),
            ms: 62, cost: 0,
          });
          trace.totalMs += 62;
          trace.toolCalls++;
        }

        // Historico
        trace.steps.push({
          agent: "analista", type: "tool", name: "buscar_historico",
          result: DB.historico.slice(-3).join(" | "),
          ms: 50, cost: 0,
        });
        trace.totalMs += 50;
        trace.toolCalls++;
      }
    }

    // Always check estoque for reports
    if (wantsRelatorio || lower.includes("estoque")) {
      var baixo = DB.estoque.filter(function(e) { return e.estoque <= e.min; });
      trace.steps.push({
        agent: "analista", type: "tool", name: "buscar_estoque",
        result: DB.estoque.length + " itens. " + baixo.length + " abaixo do min: " + baixo.map(function(e) { return e.nome + " (" + e.estoque + "/" + e.min + ")"; }).join(", "),
        ms: 35, cost: 0,
      });
      trace.totalMs += 35;
      trace.toolCalls++;
    }

    // Financeiro
    if (wantsFinanceiro || wantsRelatorio) {
      trace.steps.push({
        agent: "analista", type: "tool", name: "consultar_financeiro",
        result: "Receber: R$" + (DB.financeiro.receber/1000) + "k | Pagar: R$" + (DB.financeiro.pagar/1000) + "k | Saldo: R$" + (DB.financeiro.saldo/1000) + "k",
        ms: 55, cost: 0,
      });
      trace.totalMs += 55;
      trace.toolCalls++;
    }

    // Agenda for urgent
    if (isUrgent) {
      trace.steps.push({
        agent: "analista", type: "tool", name: "consultar_agenda",
        result: "Andre e Paulo disponiveis hoje 16h",
        ms: 40, cost: 0,
      });
      trace.totalMs += 40;
      trace.toolCalls++;
    }

    // RAG search for knowledge queries
    if (lower.includes("garantia") || lower.includes("preco") || lower.includes("prazo")) {
      var kbKey = lower.includes("garantia") ? "garantia" : lower.includes("preco") ? "precos" : "prazos";
      trace.steps.push({
        agent: "analista", type: "rag",
        text: "Busca RAG: " + kbKey + " -> " + DB.conhecimento[kbKey],
        ms: 30, cost: 0,
      });
      trace.totalMs += 30;
    }

    trace.steps.push({
      agent: "analista", type: "think",
      text: "Dados coletados. " + trace.toolCalls + " consultas realizadas. Sintetizando para proximo agente.",
      ms: 5, cost: 0,
    });
    trace.totalMs += 5;
  }

  // ============ EXECUTOR ============
  if (pipeline.indexOf("executor") >= 0) {
    trace.agents.push("executor");

    var acoes = [];
    if (isUrgent) {
      osCounter++;
      acoes.push({ tipo: "OS", desc: "OS-2026-" + String(osCounter).padStart(6, "0") + " P0 - Emergencia", auto: true });
      acoes.push({ tipo: "AGENDA", desc: "Tecnico hoje 16h (Andre + Paulo)", auto: true });
    } else if (wantsAction) {
      if (lower.includes("cria") && lower.includes("os")) {
        osCounter++;
        acoes.push({ tipo: "OS", desc: "OS-2026-" + String(osCounter).padStart(6, "0") + " - Servico solicitado", auto: false });
      }
      if (lower.includes("agenda")) {
        acoes.push({ tipo: "AGENDA", desc: "Visita 13/03 10h", auto: false });
      }
    }

    if (acoes.length > 0) {
      trace.steps.push({
        agent: "executor", type: "hitl",
        text: "PREVIEW DE ACOES:\n" + acoes.map(function(a, i) { return (i+1) + ". [" + a.tipo + "] " + a.desc; }).join("\n") + "\n\nAprovar?",
        ms: 0, cost: 0,
      });
      trace.hitlCount++;

      acoes.forEach(function(a) {
        trace.steps.push({
          agent: "executor", type: "tool", name: a.tipo === "OS" ? "criar_os" : "agendar_visita",
          result: a.desc + " -> OK",
          ms: a.tipo === "OS" ? 110 : 90, cost: 0,
        });
        trace.totalMs += a.tipo === "OS" ? 110 : 90;
        trace.toolCalls++;
      });

      trace.steps.push({
        agent: "executor", type: "think",
        text: acoes.length + " acao(oes) executada(s) apos aprovacao.",
        ms: 5, cost: 0,
      });
      trace.totalMs += 5;
    }
  }

  // ============ COMUNICADOR ============
  if (pipeline.indexOf("comunicador") >= 0) {
    trace.agents.push("comunicador");

    var cl2 = clientName ? DB.clientes.find(function(c) { return c.nome.toLowerCase().includes(clientName.toLowerCase()); }) : null;
    var tom = cl2 && cl2.vip ? "premium (VIP)" : isUrgent ? "urgente + tranquilizador" : "profissional";

    trace.steps.push({
      agent: "comunicador", type: "think",
      text: "Tom: " + tom + ". Gerando mensagem adaptada ao contexto.",
      ms: 10, cost: 0,
    });
    trace.totalMs += 10;

    var msg = "";
    if (isUrgent) {
      msg = "Ola! Ja estamos cuidando. Equipe tecnica chega hoje 16h com equipamento reserva. IMPORTANTE: desligue a bomba pelo disjuntor agora. Confirmo horario em instantes.";
    } else if (wantsRelatorio) {
      var ativas = DB.obras.filter(function(o) { return o.status === "EM_ANDAMENTO"; });
      msg = "RELATORIO SEMANAL\n\nOBRAS: " + ativas.length + " ativas\n" + ativas.map(function(o) { return "- " + o.codigo + ": " + o.progresso + "% (" + o.cliente + ")"; }).join("\n") + "\n\nFINANCEIRO: Receber R$" + (DB.financeiro.receber/1000) + "k | Saldo R$" + (DB.financeiro.saldo/1000) + "k\n\nESTOQUE: " + DB.estoque.filter(function(e) { return e.estoque <= e.min; }).length + " item(s) abaixo do minimo";
    } else if (cl2) {
      var obra = DB.obras.find(function(o) { return o.clienteId === cl2.id; });
      msg = "Ola " + cl2.nome.split(" ")[0] + "! " + (obra ? "Sua obra " + obra.codigo + " esta em " + obra.progresso + "%, etapa: " + obra.etapa + "." : "Temos seus dados atualizados no sistema.");
    } else {
      msg = "Informacoes consultadas com sucesso. Todos os dados estao atualizados.";
    }

    trace.steps.push({
      agent: "comunicador", type: "tool", name: "gerar_mensagem",
      result: msg,
      ms: 380, cost: 0.0004,
    });
    trace.totalMs += 380;
    trace.totalCost += 0.0004;
    trace.toolCalls++;

    if (isUrgent || wantsAction) {
      trace.steps.push({
        agent: "comunicador", type: "hitl",
        text: "PREVIEW:\n" + msg.substring(0, 120) + "...\n\nEnviar via WhatsApp?",
        ms: 0, cost: 0,
      });
      trace.hitlCount++;
    }
  }

  // ============ FINAL RESPONSE ============
  var response = "";
  if (isUrgent) {
    response = "EMERGENCIA PROCESSADA:\n- OS P0 criada\n- Equipe: Andre + Paulo, hoje 16h\n- Cliente notificada (desligar bomba)\n- " + trace.agents.length + " agentes | " + trace.toolCalls + " tools | " + trace.hitlCount + " aprovacoes";
  } else if (wantsRelatorio) {
    response = msg + "\n\n" + trace.agents.length + " agentes | " + trace.toolCalls + " tools | Custo: $" + trace.totalCost.toFixed(4);
  } else if (wantsFinanceiro) {
    response = "Financeiro:\nA receber: R$" + (DB.financeiro.receber/1000) + "k\nA pagar: R$" + (DB.financeiro.pagar/1000) + "k\nSaldo projetado: R$" + (DB.financeiro.saldo/1000) + "k";
  } else {
    var cl3 = clientName ? DB.clientes.find(function(c) { return c.nome.toLowerCase().includes(clientName.toLowerCase()); }) : null;
    var ob3 = cl3 ? DB.obras.find(function(o) { return o.clienteId === cl3.id; }) : null;
    if (ob3) {
      response = "Obra " + ob3.codigo + " (" + cl3.nome + "):\nStatus: " + ob3.status + " | Progresso: " + ob3.progresso + "%\nEtapa: " + ob3.etapa + " | Valor: R$" + (ob3.valor/1000) + "k" + (cl3.vip ? "\n[Cliente VIP - priorizar acompanhamento]" : "");
    } else if (cl3) {
      response = "Cliente: " + cl3.nome + " (" + cl3.cidade + ")\nTelefone: " + cl3.tel + (cl3.vip ? "\n[Cliente VIP]" : "");
    } else {
      response = "Posso ajudar com: obras, estoque, agenda, financeiro, criar OS, agendar visitas, gerar relatorios.";
    }
  }

  trace.response = response;
  trace.pipeline = [{ name: "triador", agent: AGENTS.triador }].concat(
    pipeline.map(function(p) { return { name: p, agent: AGENTS[p] }; })
  );

  return trace;
}

// ============================================================
// TRACE HISTORY
// ============================================================
var traceHistory = [];
var traceId = 1;

// ============================================================
// SUGGESTED QUERIES
// ============================================================
var SUGGESTIONS = [
  "Qual a situacao da obra do Carlos?",
  "URGENTE: bomba parou no condominio da Juliana!",
  "Gera um relatorio semanal para a diretoria",
  "Financeiro: quanto temos a receber?",
  "Cria uma OS e agenda visita pro Marcos",
  "Qual a garantia das nossas obras?",
];

// ============================================================
// COMPONENTS
// ============================================================

function StepViz(props) {
  var step = props.step;
  var visible = props.visible;
  if (!visible) return null;

  var agent = AGENTS[step.agent];
  if (!agent) return null;

  var typeLabels = { memory: "MEMORIA", think: "PENSAMENTO", route: "ROTEAMENTO", tool: "TOOL", hitl: "APROVACAO", rag: "RAG SEARCH" };
  var typeIcons = { memory: "\uD83E\uDDE0", think: "\uD83D\uDCA1", route: "\u2934", tool: "\uD83D\uDD27", hitl: "\u270B", rag: "\uD83D\uDCDA" };
  var typeBg = { memory: C.purple + "06", think: agent.color + "06", route: C.amber + "08", tool: C.cyan + "06", hitl: C.orange + "08", rag: C.orange + "06" };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: agent.color + "20", border: "1px solid " + agent.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", flexShrink: 0, marginTop: "4px",
      }}>
        {agent.icon}
      </div>
      <div style={{
        flex: 1, padding: "8px 10px", borderRadius: "8px",
        background: typeBg[step.type] || C.surfaceAlt,
        border: "1px solid " + (step.type === "hitl" ? C.orange + "22" : C.border),
        fontSize: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
          <span style={{ fontSize: "9px" }}>{typeIcons[step.type] || ""}</span>
          <span style={{ fontSize: "8px", fontWeight: 800, color: agent.color }}>{agent.name}</span>
          <span style={{ fontSize: "8px", color: C.textDim }}>{typeLabels[step.type] || ""}</span>
          {step.name && <span style={{ color: C.cyan, fontWeight: 700, fontSize: "9px" }}>{step.name}</span>}
          {step.ms > 0 && <span style={{ color: C.textDim, fontSize: "8px", marginLeft: "auto" }}>{step.ms}ms</span>}
        </div>
        {step.text && (
          <pre style={{ margin: 0, fontSize: "9px", color: C.textMuted, lineHeight: 1.4, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {step.text}
          </pre>
        )}
        {step.result && (
          <div style={{ padding: "4px 6px", borderRadius: "4px", background: C.bg, fontSize: "9px", color: C.green, lineHeight: 1.3, marginTop: "3px" }}>
            {step.result}
          </div>
        )}
        {step.type === "hitl" && (
          <div style={{ marginTop: "6px", display: "flex", gap: "4px" }}>
            <button style={{ padding: "3px 10px", borderRadius: "4px", border: "none", background: C.green, color: "#fff", fontSize: "8px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Aprovar</button>
            <button style={{ padding: "3px 10px", borderRadius: "4px", border: "1px solid " + C.red + "33", background: "transparent", color: C.red, fontSize: "8px", fontFamily: "inherit", cursor: "pointer" }}>Rejeitar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineBadges(props) {
  var pipeline = props.pipeline;
  var activeAgent = props.activeAgent;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap", marginBottom: "10px" }}>
      {pipeline.map(function(p, i) {
        var isActive = p.name === activeAgent;
        var isPast = pipeline.findIndex(function(pp) { return pp.name === activeAgent; }) > i;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{
              padding: "3px 8px", borderRadius: "5px", fontSize: "9px", fontWeight: 700,
              background: isActive ? p.agent.color + "20" : isPast ? p.agent.color + "10" : "transparent",
              color: isActive ? p.agent.color : isPast ? p.agent.color : C.textDim,
              border: "1px solid " + (isActive ? p.agent.color : isPast ? p.agent.color + "44" : C.border),
            }}>
              {p.agent.icon} {p.agent.name}
            </span>
            {i < pipeline.length - 1 && <span style={{ color: isPast ? C.green : C.textDim, fontSize: "10px" }}>{"\u2192"}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AgentCommandCenter() {
  var [activeTab, setActiveTab] = useState("chat");
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState("");
  var [currentTrace, setCurrentTrace] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);
  var [showTrace, setShowTrace] = useState(true);
  var chatEndRef = useRef(null);

  useEffect(function() {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, visibleSteps]);

  var sendMessage = useCallback(function(text) {
    if (!text.trim() || playing) return;
    setInput("");

    var userMsg = { type: "user", text: text };
    var trace = runAgentSystem(text);

    // Save to history
    var entry = {
      id: traceId++,
      input: text,
      agents: trace.agents.length,
      tools: trace.toolCalls,
      hitl: trace.hitlCount,
      ms: trace.totalMs,
      cost: trace.totalCost,
      time: new Date().toISOString().slice(11, 19),
    };
    traceHistory.unshift(entry);
    if (traceHistory.length > 20) traceHistory.pop();

    setCurrentTrace(trace);
    setVisibleSteps(0);
    setPlaying(true);
    setMessages(function(prev) { return prev.concat([userMsg]); });

    // Animate steps
    trace.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
      }, (i + 1) * 400);
    });

    // Show response
    setTimeout(function() {
      setMessages(function(prev) { return prev.concat([{ type: "agent", text: trace.response, trace: trace }]); });
      setPlaying(false);
    }, (trace.steps.length + 1) * 400);
  }, [playing]);

  var handleKey = function(e) { if (e.key === "Enter") sendMessage(input); };

  // Active agent tracking
  var activeAgent = null;
  if (currentTrace && visibleSteps > 0 && visibleSteps <= currentTrace.steps.length) {
    activeAgent = currentTrace.steps[visibleSteps - 1].agent;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.blue, padding: "4px 10px", borderRadius: "4px",
            background: C.blue + "12", border: "1px solid " + C.blue + "33",
          }}>Projeto Integrador - Cap 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Central de Agentes Costa Lima
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            4 agentes especializados | Memoria | HITL | Grafos | Traces
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "chat", label: "Central de Comando" },
            { id: "traces", label: "Traces (" + traceHistory.length + ")" },
            { id: "arch", label: "Arquitetura" },
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

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* Main chat */}
            <div style={{ flex: 1.3, minWidth: "320px" }}>
              {/* Pipeline indicator */}
              {currentTrace && playing && (
                <PipelineBadges pipeline={currentTrace.pipeline} activeAgent={activeAgent} />
              )}

              {/* Chat area */}
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", padding: "12px",
                minHeight: "280px", maxHeight: "450px", overflowY: "auto",
                marginBottom: "8px",
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 16px", color: C.textDim, fontSize: "12px" }}>
                    Central de Agentes Costa Lima
                    <br /><span style={{ fontSize: "10px" }}>4 agentes: {Object.keys(AGENTS).map(function(k) { return AGENTS[k].icon + AGENTS[k].name; }).join(" | ")}</span>
                  </div>
                )}

                {messages.map(function(msg, i) {
                  if (msg.type === "user") {
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                        <div style={{
                          maxWidth: "80%", padding: "8px 12px", borderRadius: "10px 10px 2px 10px",
                          background: C.blue + "18", border: "1px solid " + C.blue + "28",
                          fontSize: "12px", color: C.text,
                        }}>{msg.text}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} style={{ marginBottom: "8px" }}>
                      <div style={{
                        maxWidth: "90%", padding: "10px 12px", borderRadius: "10px 10px 10px 2px",
                        background: C.surfaceAlt, border: "1px solid " + C.border,
                        fontSize: "11px", color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap",
                      }}>
                        {msg.text}
                        {msg.trace && (
                          <div style={{ marginTop: "6px", fontSize: "9px", color: C.textDim, borderTop: "1px solid " + C.border, paddingTop: "6px" }}>
                            {msg.trace.agents.length} agentes | {msg.trace.toolCalls} tools | {msg.trace.hitlCount} HITL | {msg.trace.totalMs}ms | ${msg.trace.totalCost.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
                {SUGGESTIONS.map(function(s, i) {
                  return (
                    <button key={i} onClick={function() { sendMessage(s); }} disabled={playing} style={{
                      padding: "4px 8px", borderRadius: "6px", fontSize: "8px",
                      fontFamily: "inherit", cursor: playing ? "default" : "pointer",
                      border: "1px solid " + C.border, background: "transparent",
                      color: C.textMuted, opacity: playing ? 0.5 : 1,
                    }}>{s.length > 40 ? s.substring(0, 40) + "..." : s}</button>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ display: "flex", gap: "6px" }}>
                <input type="text" value={input} onChange={function(e) { setInput(e.target.value); }}
                  onKeyDown={handleKey} placeholder="Pergunte ao sistema..."
                  disabled={playing}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid " + C.border, background: C.surfaceAlt,
                    color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none",
                  }} />
                <button onClick={function() { sendMessage(input); }} disabled={playing} style={{
                  padding: "10px 18px", borderRadius: "8px", border: "none",
                  background: playing ? C.surfaceAlt : C.blue, color: playing ? C.textDim : "#fff",
                  fontSize: "11px", fontWeight: 700, fontFamily: "inherit", cursor: playing ? "default" : "pointer",
                }}>Enviar</button>
              </div>
            </div>

            {/* Trace panel */}
            <div style={{ flex: 0.9, minWidth: "280px" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "8px",
              }}>
                <span style={{ fontSize: "10px", color: C.textDim, fontWeight: 700 }}>AGENT TRACE</span>
                <button onClick={function() { setShowTrace(!showTrace); }} style={{
                  padding: "3px 8px", borderRadius: "4px", border: "1px solid " + C.border,
                  background: "transparent", color: C.textDim, fontSize: "9px",
                  fontFamily: "inherit", cursor: "pointer",
                }}>{showTrace ? "Ocultar" : "Mostrar"}</button>
              </div>

              {showTrace && currentTrace && (
                <div style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "10px",
                  maxHeight: "500px", overflowY: "auto",
                }}>
                  {/* Stats bar */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "4px", marginBottom: "10px",
                  }}>
                    {[
                      { v: currentTrace.agents.length + " agentes", c: C.purple },
                      { v: currentTrace.toolCalls + " tools", c: C.cyan },
                      { v: currentTrace.hitlCount + " HITL", c: C.orange },
                      { v: currentTrace.totalMs + "ms", c: C.amber },
                      { v: "$" + currentTrace.totalCost.toFixed(4), c: C.green },
                      { v: Math.min(visibleSteps, currentTrace.steps.length) + "/" + currentTrace.steps.length, c: C.text },
                    ].map(function(s, i) {
                      return (
                        <div key={i} style={{
                          padding: "4px", borderRadius: "4px", background: C.surfaceAlt,
                          textAlign: "center", fontSize: "9px", color: s.c, fontWeight: 700,
                        }}>{s.v}</div>
                      );
                    })}
                  </div>

                  {/* Steps */}
                  {currentTrace.steps.map(function(step, i) {
                    return <StepViz key={i} step={step} visible={i < visibleSteps} />;
                  })}

                  {playing && visibleSteps < currentTrace.steps.length && (
                    <div style={{ textAlign: "center", padding: "8px", color: C.amber, fontSize: "10px" }}>
                      Processando...
                    </div>
                  )}
                </div>
              )}

              {!currentTrace && (
                <div style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "30px 16px",
                  textAlign: "center", color: C.textDim, fontSize: "11px",
                }}>
                  Envie uma mensagem para ver o trace dos agentes
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRACES TAB */}
        {activeTab === "traces" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px" }}>
              Historico completo de todas as execucoes do sistema multiagente.
            </p>
            {traceHistory.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "12px", background: C.surface, borderRadius: "10px", border: "1px solid " + C.border }}>
                Nenhum trace ainda. Use a Central de Comando.
              </div>
            ) : (
              <div>
                {/* Summary */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {[
                    { label: "Total", value: traceHistory.length, color: C.text },
                    { label: "Agentes (media)", value: (traceHistory.reduce(function(s, t) { return s + t.agents; }, 0) / traceHistory.length).toFixed(1), color: C.purple },
                    { label: "Tools (media)", value: (traceHistory.reduce(function(s, t) { return s + t.tools; }, 0) / traceHistory.length).toFixed(1), color: C.cyan },
                    { label: "Custo total", value: "$" + traceHistory.reduce(function(s, t) { return s + t.cost; }, 0).toFixed(4), color: C.green },
                  ].map(function(s) {
                    return (
                      <div key={s.label} style={{
                        flex: 1, minWidth: "90px", padding: "10px 8px",
                        background: C.surface, border: "1px solid " + C.border,
                        borderRadius: "8px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: "9px", color: C.textDim }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                  {traceHistory.map(function(t, i) {
                    return (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 14px", fontSize: "10px",
                        borderBottom: i < traceHistory.length - 1 ? "1px solid " + C.border : "none",
                      }}>
                        <span style={{ color: C.textDim, width: "20px" }}>{"#" + t.id}</span>
                        <span style={{ color: C.textDim, width: "50px" }}>{t.time}</span>
                        <span style={{ color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.input}
                        </span>
                        <span style={{ color: C.purple }}>{t.agents}ag</span>
                        <span style={{ color: C.cyan }}>{t.tools}t</span>
                        {t.hitl > 0 && <span style={{ color: C.orange }}>{t.hitl}h</span>}
                        <span style={{ color: C.amber }}>{t.ms}ms</span>
                        <span style={{ color: C.green }}>${t.cost.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARCH TAB */}
        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.blue,
                text: "Cap 4 completo:\n\nM1 (Padroes): ReAct no Triador + Analista. Plan-Execute no pipeline geral.\nM2 (Memory): Memorias de longo prazo injetadas no inicio. RAG para garantia/precos.\nM3 (Grafos): Roteamento condicional (urgencia -> emergencia). HITL para escrita. Traces.\nM4 (Multi-agent): 4 agentes especializados cooperando via estado compartilhado.\n\nResultado: sistema multiagente completo que processa desde consulta simples (2 agentes, 2 tools) ate emergencia com 4 agentes, 7+ tools e 2 aprovacoes humanas.",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: '1. "Qual a situacao da obra do Carlos?" -> 2 agentes (Triador + Analista), 3 tools, <300ms\n\n2. "URGENTE: bomba parou no condominio da Juliana!" -> 4 agentes, 6+ tools, 2 HITL\n\n3. "Gera um relatorio semanal para a diretoria" -> 3 agentes (sem Executor), dados cruzados\n\n4. "Financeiro: quanto temos a receber?" -> 2 agentes, 1 tool financeiro\n\n5. "Cria uma OS e agenda visita pro Marcos" -> 3 agentes, acoes com HITL\n\nObserve como o Triador ajusta o pipeline para cada caso. E como o painel de trace mostra cada decisao.',
              },
              {
                title: "Arquitetura do sistema",
                color: C.cyan,
                text: "4 agentes:\n\nTriador (Haiku, $0.0003/call)\n  Tools: classificar, avaliar urgencia, definir pipeline\n  Funcao: decide QUAIS agentes acionar e em que ORDEM\n\nAnalista (Haiku, ~$0 por tool call)\n  Tools: buscar_cliente, listar_obras, historico, estoque, agenda, financeiro\n  Funcao: coleta e cruza TODOS os dados relevantes\n\nExecutor (Sonnet, ~$0.0004/call)\n  Tools: criar_os, agendar_visita, gerar_orcamento\n  Funcao: executa ACOES no sistema (sempre com HITL)\n\nComunicador (Sonnet, ~$0.0004/call)\n  Tools: gerar_whatsapp, relatorio, notificar_equipe\n  Funcao: gera MENSAGENS adaptadas ao tom e publico",
              },
              {
                title: "Como integrar no Costa Lima real",
                color: C.green,
                text: "backend/src/agents/\n  supervisor.ts     <- Triador (classifica + roteia)\n  analista.ts       <- Busca dados (reusa MCP tools)\n  executor.ts       <- Acoes com HITL\n  comunicador.ts    <- Mensagens e relatorios\n  state.ts          <- AgentState compartilhado\n  runner.ts         <- Orquestra o pipeline\n  memory.ts         <- Prisma MemoriaAgente\n  traces.ts         <- Prisma AgentTrace\n\nFrontend:\n  /dashboard -> widget de chat com Central de Agentes\n  /administracao/agentes -> dashboard de traces e metricas\n\nCada agente reusa as tools do MCP Server (Cap 3). O runner orquestra a sequencia definida pelo Triador. O estado (AgentState) e o contrato entre agentes.",
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
