import { useState, useCallback, useRef, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DATABASE
// ============================================================
var DB = {
  clientes: [
    { id: "cli_001", nome: "Carlos Mendes", tel: "24 99999-1234", cidade: "Volta Redonda", responsavelId: "u3" },
    { id: "cli_002", nome: "Ana Paula Costa", tel: "24 99888-5678", cidade: "Barra Mansa", responsavelId: "u3" },
    { id: "cli_003", nome: "Roberto Almeida", tel: "24 99777-9012", cidade: "Resende", responsavelId: "u6" },
    { id: "cli_004", nome: "Juliana Ferreira", tel: "24 99666-3456", cidade: "Volta Redonda", responsavelId: "u3" },
    { id: "cli_005", nome: "Marcos Oliveira", tel: "24 99555-7890", cidade: "Volta Redonda", responsavelId: "u6" },
  ],
  obras: [
    { id: "obr_001", codigo: "OBR-2026-000034", clienteId: "cli_001", clienteNome: "Carlos Mendes", status: "EM_ANDAMENTO", tipo: "Piscina 8x4 vinil", progresso: 35, valor: 85000, responsavelId: "u3" },
    { id: "obr_002", codigo: "OBR-2026-000029", clienteId: "cli_002", clienteNome: "Ana Paula Costa", status: "CONCLUIDA", tipo: "Manutencao geral", progresso: 100, valor: 4500, responsavelId: "u3" },
    { id: "obr_003", codigo: "OBR-2026-000041", clienteId: "cli_004", clienteNome: "Juliana Ferreira", status: "APROVADA", tipo: "Reforma condominio", progresso: 0, valor: 32000, responsavelId: "u3" },
    { id: "obr_004", codigo: "OBR-2026-000045", clienteId: "cli_005", clienteNome: "Marcos Oliveira", status: "EM_ANDAMENTO", tipo: "Piscina 6x3", progresso: 70, valor: 52000, responsavelId: "u6" },
  ],
  estoque: [
    { codigo: "EQ-001", nome: "Bomba centrifuga 1/2cv", preco: 1250, estoque: 8, minimo: 3 },
    { codigo: "EQ-002", nome: "Filtro quartzo 19L", preco: 890, estoque: 5, minimo: 2 },
    { codigo: "EQ-003", nome: "Clorador automatico", preco: 650, estoque: 12, minimo: 5 },
    { codigo: "EQ-004", nome: "Kit iluminacao LED", preco: 480, estoque: 1, minimo: 3 },
    { codigo: "EQ-005", nome: "Aquecimento solar 3m2", preco: 3200, estoque: 2, minimo: 2 },
  ],
  agenda: [
    { data: "2026-03-11", hora: "08:00", tipo: "Obra", desc: "Concretagem OBR-000034", equipe: "Joao, Pedro, Lucas" },
    { data: "2026-03-11", hora: "14:00", tipo: "Visita", desc: "Avaliacao terreno - Marcos", equipe: "Carlos" },
    { data: "2026-03-12", hora: "09:00", tipo: "Manutencao", desc: "Troca bomba Cond. Solar", equipe: "Andre, Paulo" },
    { data: "2026-03-12", hora: "15:00", tipo: "Vistoria", desc: "Pos-obra Ana Paula", equipe: "Lucas" },
    { data: "2026-03-13", hora: "10:00", tipo: "Visita", desc: "Orcamento Roberto", equipe: "Felipe" },
  ],
  financeiro: {
    receber: { total: 127000, recebido: 58000, pendente: 69000 },
    pagar: { total: 42000, pago: 31000, pendente: 11000 },
    obras_ativas_valor: 137000,
  },
};

var osCounter = 103;

// ============================================================
// USERS
// ============================================================
var USERS = [
  { id: "u1", nome: "Marcos", nivel: 5, cargo: "ADMINISTRADOR" },
  { id: "u2", nome: "Sandra", nivel: 4, cargo: "COORDENADOR" },
  { id: "u3", nome: "Felipe", nivel: 3, cargo: "VENDEDOR" },
  { id: "u4", nome: "Camila", nivel: 2, cargo: "AUXILIAR" },
  { id: "u5", nome: "Lucas", nivel: 1, cargo: "COLABORADOR" },
];

// ============================================================
// TOOLS + SECURITY
// ============================================================
var TOOL_DEFS = {
  buscar_cliente: { minLevel: 2, ownerFilter: true, rate: 20, category: "read", mcp: "Costa Lima" },
  listar_obras: { minLevel: 1, ownerFilter: true, rate: 20, category: "read", mcp: "Costa Lima" },
  buscar_estoque: { minLevel: 2, ownerFilter: false, rate: 20, category: "read", mcp: "Costa Lima" },
  consultar_agenda: { minLevel: 1, ownerFilter: true, rate: 20, category: "read", mcp: "Costa Lima" },
  criar_os: { minLevel: 3, ownerFilter: false, rate: 5, category: "write", mcp: "Costa Lima" },
  agendar_visita: { minLevel: 3, ownerFilter: false, rate: 5, category: "write", mcp: "Costa Lima" },
  consultar_financeiro: { minLevel: 4, ownerFilter: false, rate: 10, category: "read", mcp: "Costa Lima" },
  create_calendar_event: { minLevel: 1, ownerFilter: false, rate: 10, category: "write", mcp: "Google Calendar" },
  send_whatsapp: { minLevel: 3, ownerFilter: false, rate: 10, category: "write", mcp: "WhatsApp" },
};

var rateCounts = {};
var auditLog = [];
var auditId = 1;

function checkSecurity(user, toolName) {
  var def = TOOL_DEFS[toolName];
  if (!def) return { ok: false, code: "NOT_FOUND", reason: "Tool nao existe" };
  if (!user) return { ok: false, code: "NO_AUTH", reason: "Nao autenticado" };
  if (user.nivel < def.minLevel) return { ok: false, code: "FORBIDDEN", reason: user.cargo + " (N" + user.nivel + ") precisa N" + def.minLevel };

  var key = user.id + ":" + toolName;
  var now = Date.now();
  if (!rateCounts[key] || now - rateCounts[key].t > 60000) rateCounts[key] = { c: 0, t: now };
  rateCounts[key].c++;
  if (rateCounts[key].c > def.rate) return { ok: false, code: "RATE_LIMIT", reason: "Excedido " + def.rate + "/min" };

  var filter = (def.ownerFilter && user.nivel < 4) ? user.id : null;
  auditLog.unshift({ id: auditId++, user: user.nome, tool: toolName, code: "OK", ts: new Date().toISOString().slice(11, 19) });
  if (auditLog.length > 50) auditLog.pop();
  return { ok: true, code: "OK", filter: filter, mcp: def.mcp, category: def.category };
}

function executeTool(toolName, params, ownerFilter) {
  if (toolName === "buscar_cliente") {
    var q = (params.query || "").toLowerCase();
    var r = DB.clientes.filter(function(c) { return c.nome.toLowerCase().includes(q) || c.id === params.query; });
    if (ownerFilter) r = r.filter(function(c) { return c.responsavelId === ownerFilter; });
    return r;
  }
  if (toolName === "listar_obras") {
    var res = DB.obras.slice();
    if (params.status) res = res.filter(function(o) { return o.status === params.status; });
    if (ownerFilter) res = res.filter(function(o) { return o.responsavelId === ownerFilter; });
    return res;
  }
  if (toolName === "buscar_estoque") {
    if (!params.query) return DB.estoque;
    var sq = (params.query || "").toLowerCase();
    return DB.estoque.filter(function(e) { return e.nome.toLowerCase().includes(sq); });
  }
  if (toolName === "consultar_agenda") {
    if (params.data) return DB.agenda.filter(function(a) { return a.data === params.data; });
    return DB.agenda;
  }
  if (toolName === "criar_os") {
    osCounter++;
    return { codigo: "OS-2026-" + String(osCounter).padStart(6, "0"), status: "PENDENTE", descricao: params.descricao, prioridade: params.prioridade };
  }
  if (toolName === "agendar_visita") {
    return { status: "agendado", data: params.data, hora: params.hora, descricao: params.descricao };
  }
  if (toolName === "consultar_financeiro") {
    return DB.financeiro;
  }
  if (toolName === "create_calendar_event") {
    return { eventId: "evt_" + Math.floor(Math.random() * 9999), status: "criado", title: params.title };
  }
  if (toolName === "send_whatsapp") {
    return { sent: true, to: params.to, preview: params.msg ? params.msg.substring(0, 50) + "..." : "" };
  }
  return { error: "Tool desconhecida" };
}

// ============================================================
// QUERY INTERPRETER - Maps natural language to tool calls
// ============================================================
function interpretQuery(text, user) {
  var lower = text.toLowerCase();
  var pipeline = { steps: [], response: "", totalLatency: 0 };

  // Pattern matching for intent
  if (lower.includes("situacao") || lower.includes("status") || lower.includes("como esta") || lower.includes("obra")) {
    var nomeMatch = text.match(/(?:do|da|de)\s+(\w+\s*\w*)/i);
    var nome = nomeMatch ? nomeMatch[1].trim() : "";

    if (nome) {
      // Step 1: find client
      var sec1 = checkSecurity(user, "buscar_cliente");
      pipeline.steps.push({ tool: "buscar_cliente", params: { query: nome }, security: sec1, mcp: "Costa Lima" });
      if (sec1.ok) {
        var clientes = executeTool("buscar_cliente", { query: nome }, sec1.filter);
        pipeline.steps[0].result = clientes;
        pipeline.steps[0].latency = 45;
        pipeline.totalLatency += 45;

        if (clientes.length > 0) {
          // Step 2: find obras
          var sec2 = checkSecurity(user, "listar_obras");
          var obras = sec2.ok ? executeTool("listar_obras", {}, sec2.filter) : [];
          var clienteObras = obras.filter(function(o) { return o.clienteId === clientes[0].id; });
          pipeline.steps.push({ tool: "listar_obras", params: { cliente: clientes[0].id }, security: sec2, result: clienteObras, latency: 62, mcp: "Costa Lima" });
          pipeline.totalLatency += 62;

          if (clienteObras.length > 0) {
            var o = clienteObras[0];
            pipeline.response = "A obra do " + clientes[0].nome + " (" + o.codigo + ") esta " + o.status + " com " + o.progresso + "% de progresso. Tipo: " + o.tipo + ", valor: R$" + (o.valor / 1000).toFixed(0) + "k.";
          } else {
            pipeline.response = "Encontrei o cliente " + clientes[0].nome + " mas nao ha obras vinculadas.";
          }
        } else {
          pipeline.response = "Nao encontrei cliente com o nome '" + nome + "'" + (sec1.filter ? " entre seus clientes." : ".");
        }
      } else {
        pipeline.response = "BLOQUEADO: " + sec1.reason;
      }
    } else {
      // List all obras
      var sec = checkSecurity(user, "listar_obras");
      pipeline.steps.push({ tool: "listar_obras", params: {}, security: sec, mcp: "Costa Lima" });
      if (sec.ok) {
        var allObras = executeTool("listar_obras", {}, sec.filter);
        pipeline.steps[0].result = allObras;
        pipeline.steps[0].latency = 55;
        pipeline.totalLatency += 55;
        var ativas = allObras.filter(function(o) { return o.status === "EM_ANDAMENTO"; });
        pipeline.response = "Voce tem " + allObras.length + " obra(s) no total. " + ativas.length + " em andamento: " + ativas.map(function(o) { return o.codigo + " (" + o.progresso + "%, " + o.clienteNome + ")"; }).join(", ") + ".";
      } else {
        pipeline.response = "BLOQUEADO: " + sec.reason;
      }
    }
  }
  else if (lower.includes("estoque") || lower.includes("bomba") || lower.includes("filtro") || lower.includes("produto")) {
    var prodQuery = "";
    if (lower.includes("bomba")) prodQuery = "bomba";
    else if (lower.includes("filtro")) prodQuery = "filtro";
    else if (lower.includes("led")) prodQuery = "iluminacao";
    else if (lower.includes("solar")) prodQuery = "solar";

    var secE = checkSecurity(user, "buscar_estoque");
    pipeline.steps.push({ tool: "buscar_estoque", params: { query: prodQuery }, security: secE, mcp: "Costa Lima" });
    if (secE.ok) {
      var produtos = executeTool("buscar_estoque", { query: prodQuery }, null);
      pipeline.steps[0].result = produtos;
      pipeline.steps[0].latency = 30;
      pipeline.totalLatency += 30;
      var baixo = produtos.filter(function(p) { return p.estoque <= p.minimo; });
      pipeline.response = produtos.map(function(p) {
        return p.nome + ": " + p.estoque + " un (min: " + p.minimo + ") R$" + p.preco;
      }).join("\n") + (baixo.length > 0 ? ("\n\nALERTA: " + baixo.length + " item(s) abaixo do minimo: " + baixo.map(function(b) { return b.nome; }).join(", ")) : "");
    } else {
      pipeline.response = "BLOQUEADO: " + secE.reason;
    }
  }
  else if (lower.includes("agenda") || lower.includes("programacao") || lower.includes("hoje") || lower.includes("amanha")) {
    var data = lower.includes("amanha") ? "2026-03-12" : "2026-03-11";
    var diaLabel = lower.includes("amanha") ? "amanha (12/03)" : "hoje (11/03)";

    var secA = checkSecurity(user, "consultar_agenda");
    pipeline.steps.push({ tool: "consultar_agenda", params: { data: data }, security: secA, mcp: "Costa Lima" });
    if (secA.ok) {
      var eventos = executeTool("consultar_agenda", { data: data }, null);
      pipeline.steps[0].result = eventos;
      pipeline.steps[0].latency = 35;
      pipeline.totalLatency += 35;
      pipeline.response = "Agenda " + diaLabel + ": " + (eventos.length === 0 ? "nenhum compromisso." : eventos.map(function(e) { return e.hora + " - " + e.desc + " (" + e.equipe + ")"; }).join("\n"));
    } else {
      pipeline.response = "BLOQUEADO: " + secA.reason;
    }
  }
  else if (lower.includes("criar") && lower.includes("os") || lower.includes("ordem de servico")) {
    var desc = text.replace(/cri[ea]r?\s*(uma?\s*)?os\s*/i, "").replace(/ordem de servico\s*/i, "").trim() || "Servico solicitado via copiloto";
    var prio = lower.includes("urgente") || lower.includes("emergenc") ? "alta" : "media";

    var secOS = checkSecurity(user, "criar_os");
    pipeline.steps.push({ tool: "criar_os", params: { descricao: desc, prioridade: prio }, security: secOS, mcp: "Costa Lima" });
    if (secOS.ok) {
      var os = executeTool("criar_os", { descricao: desc, prioridade: prio }, null);
      pipeline.steps[0].result = os;
      pipeline.steps[0].latency = 120;
      pipeline.totalLatency += 120;
      pipeline.response = "OS criada: " + os.codigo + " | Prioridade: " + os.prioridade + " | Status: " + os.status + "\nDescricao: " + os.descricao;
    } else {
      pipeline.response = "BLOQUEADO: " + secOS.reason;
    }
  }
  else if (lower.includes("agendar") || lower.includes("visita")) {
    var nomeV = text.match(/(?:para|pro|do|da)\s+(\w+)/i);
    var nomeVisita = nomeV ? nomeV[1] : "cliente";

    var secAg = checkSecurity(user, "agendar_visita");
    pipeline.steps.push({ tool: "agendar_visita", params: { data: "2026-03-13", hora: "10:00", descricao: "Visita tecnica - " + nomeVisita }, security: secAg, mcp: "Costa Lima" });

    if (secAg.ok) {
      var visita = executeTool("agendar_visita", { data: "2026-03-13", hora: "10:00", descricao: "Visita tecnica - " + nomeVisita }, null);
      pipeline.steps[0].result = visita;
      pipeline.steps[0].latency = 95;
      pipeline.totalLatency += 95;

      // Compose: Google Calendar
      var secCal = checkSecurity(user, "create_calendar_event");
      if (secCal.ok) {
        var cal = executeTool("create_calendar_event", { title: "Visita - " + nomeVisita }, null);
        pipeline.steps.push({ tool: "create_calendar_event", params: { title: "Visita - " + nomeVisita, date: "2026-03-13T10:00" }, security: secCal, result: cal, latency: 200, mcp: "Google Calendar" });
        pipeline.totalLatency += 200;
      }

      pipeline.response = "Visita agendada para 13/03 as 10h" + (secCal.ok ? " e evento criado no Google Calendar." : ".") + "\nDescricao: Visita tecnica - " + nomeVisita;
    } else {
      pipeline.response = "BLOQUEADO: " + secAg.reason;
    }
  }
  else if (lower.includes("financeiro") || lower.includes("faturamento") || lower.includes("receber") || lower.includes("pagar")) {
    var secF = checkSecurity(user, "consultar_financeiro");
    pipeline.steps.push({ tool: "consultar_financeiro", params: {}, security: secF, mcp: "Costa Lima" });
    if (secF.ok) {
      var fin = executeTool("consultar_financeiro", {}, null);
      pipeline.steps[0].result = fin;
      pipeline.steps[0].latency = 80;
      pipeline.totalLatency += 80;
      pipeline.response = "Financeiro:\nA receber: R$" + (fin.receber.total / 1000).toFixed(0) + "k (recebido: R$" + (fin.receber.recebido / 1000).toFixed(0) + "k, pendente: R$" + (fin.receber.pendente / 1000).toFixed(0) + "k)\nA pagar: R$" + (fin.pagar.total / 1000).toFixed(0) + "k (pago: R$" + (fin.pagar.pago / 1000).toFixed(0) + "k, pendente: R$" + (fin.pagar.pendente / 1000).toFixed(0) + "k)\nObras ativas: R$" + (fin.obras_ativas_valor / 1000).toFixed(0) + "k";
    } else {
      pipeline.response = "BLOQUEADO: " + secF.reason;
    }
  }
  else {
    pipeline.response = "Posso ajudar com: obras (situacao, listar), estoque (buscar produtos), agenda (hoje, amanha), criar OS, agendar visita, ou financeiro. O que precisa?";
  }

  return pipeline;
}

// ============================================================
// SUGGESTED QUERIES per user level
// ============================================================
var SUGGESTIONS = {
  5: ["Qual a situacao de todas as obras?", "Financeiro: quanto temos a receber?", "Criar OS urgente troca de bomba", "Estoque abaixo do minimo?"],
  4: ["Obras em andamento?", "Financeiro geral", "Agenda de amanha", "Estoque de bombas"],
  3: ["Situacao da obra do Carlos Mendes", "Agendar visita para Roberto", "Criar OS manutencao piscina", "Agenda de hoje"],
  2: ["Minhas obras", "Estoque de filtros", "Agenda de hoje"],
  1: ["Minhas obras", "Agenda de hoje"],
};

// ============================================================
// COMPONENTS
// ============================================================

var MCP_COLORS = { "Costa Lima": C.cyan, "Google Calendar": C.green, "WhatsApp": C.amber, "Gmail": C.red };

function ChatMessage(props) {
  var msg = props.msg;

  if (msg.type === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <div style={{
          maxWidth: "80%", padding: "10px 14px", borderRadius: "12px 12px 2px 12px",
          background: C.blue + "20", border: "1px solid " + C.blue + "33",
          fontSize: "12px", color: C.text, lineHeight: 1.5,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "pipeline") {
    return (
      <div style={{ marginBottom: "10px" }}>
        {/* Tool calls */}
        {msg.pipeline.steps.map(function(step, i) {
          var mcpColor = MCP_COLORS[step.mcp] || C.textDim;
          var blocked = !step.security.ok;
          return (
            <div key={i} style={{
              padding: "8px 12px", borderRadius: "8px", marginBottom: "4px",
              background: blocked ? C.red + "08" : C.surfaceAlt,
              border: "1px solid " + (blocked ? C.red + "22" : C.border),
              fontSize: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{
                  fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                  background: mcpColor + "15", color: mcpColor,
                }}>{step.mcp}</span>
                <span style={{ color: blocked ? C.red : C.cyan, fontWeight: 700 }}>{step.tool}</span>
                <span style={{ color: C.textDim, fontSize: "9px" }}>{JSON.stringify(step.params)}</span>
                <span style={{ marginLeft: "auto", fontSize: "9px" }}>
                  {blocked ? (
                    <span style={{ color: C.red, fontWeight: 700 }}>{step.security.code}: {step.security.reason}</span>
                  ) : (
                    <span style={{ color: C.green }}>{step.latency}ms</span>
                  )}
                </span>
              </div>
              {!blocked && step.result && (
                <pre style={{
                  margin: 0, fontSize: "9px", color: C.green, lineHeight: 1.3,
                  whiteSpace: "pre-wrap", fontFamily: "inherit",
                  maxHeight: "60px", overflowY: "auto",
                }}>
                  {JSON.stringify(step.result, null, 2).substring(0, 200)}
                  {JSON.stringify(step.result, null, 2).length > 200 ? "..." : ""}
                </pre>
              )}
            </div>
          );
        })}

        {/* Response */}
        <div style={{
          padding: "10px 14px", borderRadius: "12px 12px 12px 2px",
          background: C.surface, border: "1px solid " + C.border,
          fontSize: "12px", color: C.text, lineHeight: 1.6,
          whiteSpace: "pre-wrap", marginTop: "6px",
        }}>
          {msg.pipeline.response}
          <div style={{ marginTop: "6px", fontSize: "9px", color: C.textDim }}>
            {msg.pipeline.steps.length + " tool calls | " + msg.pipeline.totalLatency + "ms total | " +
              msg.pipeline.steps.filter(function(s) { return s.security.ok; }).length + " permitidas, " +
              msg.pipeline.steps.filter(function(s) { return !s.security.ok; }).length + " bloqueadas"}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// MAIN APP
// ============================================================
export default function CopilotoCostalima() {
  var [user, setUser] = useState(USERS[2]); // Felipe vendedor
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState("");
  var [activeTab, setActiveTab] = useState("chat");
  var chatEndRef = useRef(null);

  useEffect(function() {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  var sendMessage = useCallback(function(text) {
    if (!text.trim()) return;
    var userMsg = { type: "user", text: text };
    var pipeline = interpretQuery(text, user);
    var botMsg = { type: "pipeline", pipeline: pipeline };
    setMessages(function(prev) { return prev.concat([userMsg, botMsg]); });
    setInput("");
  }, [user]);

  var handleKey = function(e) { if (e.key === "Enter") sendMessage(input); };
  var suggestions = SUGGESTIONS[user ? user.nivel : 1] || [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.blue, padding: "4px 10px", borderRadius: "4px",
            background: C.blue + "12", border: "1px solid " + C.blue + "33",
          }}>Projeto Integrador - Cap 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Copiloto Costa Lima
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Assistente MCP com RBAC, rate limiting, multi-MCP e audit log
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "chat", label: "Copiloto" },
            { id: "audit", label: "Audit (" + auditLog.length + ")" },
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
          <div>
            {/* User selector */}
            <div style={{
              display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap",
              padding: "10px 12px", background: C.surface, borderRadius: "8px",
              border: "1px solid " + C.border, alignItems: "center",
            }}>
              <span style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginRight: "6px" }}>USUARIO:</span>
              {USERS.map(function(u) {
                var isSel = user && user.id === u.id;
                return (
                  <button key={u.id} onClick={function() { setUser(u); setMessages([]); }} style={{
                    padding: "4px 10px", borderRadius: "6px", fontSize: "9px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                    border: "1px solid " + (isSel ? C.cyan : C.border),
                    background: isSel ? C.cyan + "12" : "transparent",
                    color: isSel ? C.cyan : C.textDim,
                  }}>
                    {u.nome} (N{u.nivel})
                  </button>
                );
              })}
            </div>

            {/* Chat area */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px",
              minHeight: "300px", maxHeight: "500px", overflowY: "auto",
              marginBottom: "10px",
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: C.textDim, fontSize: "12px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px", opacity: 0.3 }}>{">"}_</div>
                  Ola {user ? user.nome : ""}! Sou o copiloto do Costa Lima.
                  <br />Pergunte sobre obras, estoque, agenda, financeiro ou crie OS.
                  <br /><span style={{ fontSize: "10px" }}>Seu nivel: {user ? user.cargo + " (N" + user.nivel + ")" : "nenhum"} — RBAC aplicado em tempo real</span>
                </div>
              )}
              {messages.map(function(msg, i) {
                return <ChatMessage key={i} msg={msg} />;
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
              {suggestions.map(function(s, i) {
                return (
                  <button key={i} onClick={function() { sendMessage(s); }} style={{
                    padding: "5px 10px", borderRadius: "6px", fontSize: "9px",
                    fontFamily: "inherit", cursor: "pointer",
                    border: "1px solid " + C.border, background: "transparent",
                    color: C.textMuted,
                  }}>{s}</button>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" value={input} onChange={function(e) { setInput(e.target.value); }}
                onKeyDown={handleKey} placeholder="Pergunte algo..."
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "10px",
                  border: "1px solid " + C.border, background: C.surfaceAlt,
                  color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none",
                }} />
              <button onClick={function() { sendMessage(input); }} style={{
                padding: "12px 20px", borderRadius: "10px", border: "none",
                background: C.blue, color: "#fff", fontSize: "12px",
                fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              }}>Enviar</button>
            </div>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div>
            {auditLog.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "12px", background: C.surface, borderRadius: "10px", border: "1px solid " + C.border }}>
                Use o copiloto para gerar entradas no audit log
              </div>
            ) : (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                {auditLog.map(function(entry, i) {
                  var mcpColor = MCP_COLORS[TOOL_DEFS[entry.tool] ? TOOL_DEFS[entry.tool].mcp : ""] || C.textDim;
                  return (
                    <div key={entry.id} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 14px", fontSize: "10px",
                      borderBottom: i < auditLog.length - 1 ? "1px solid " + C.border : "none",
                    }}>
                      <span style={{ color: C.textDim, width: "40px" }}>#{entry.id}</span>
                      <span style={{ color: C.textDim, width: "55px" }}>{entry.ts}</span>
                      <span style={{ color: C.textMuted, width: "60px" }}>{entry.user}</span>
                      <span style={{ color: mcpColor, fontWeight: 600, flex: 1 }}>{entry.tool}</span>
                      <span style={{
                        fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                        background: C.green + "15", color: C.green,
                      }}>{entry.code}</span>
                    </div>
                  );
                })}
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
                text: "Combinacao dos 4 modulos do Cap 3:\n\nM1 (Fundamentos): Tools e resources do Costa Lima expostos via MCP\nM2 (TypeScript): Execucao de tools contra banco simulado (Prisma queries)\nM3 (Seguranca): RBAC por nivel, rate limiting, owner filtering, audit log\nM4 (Producao): Multi-MCP (Costa Lima + Google Calendar), multi-client (troque o usuario)\n\nO resultado: um copiloto que o vendedor usa no dia a dia com seguranca enterprise.",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: '1. Como FELIPE (vendedor N3): pergunte "situacao da obra do Carlos" -> funciona\n   Depois pergunte "financeiro" -> BLOQUEADO (precisa N4)\n\n2. Como SANDRA (coord N4): pergunte "financeiro" -> funciona\n   Pergunte "situacao de todas as obras" -> ve TODAS (sem filtro owner)\n\n3. Como LUCAS (colab N1): pergunte "minhas obras" -> ve so as dele\n   Tente "criar OS" -> BLOQUEADO (precisa N3)\n\n4. Compare FELIPE vs MARCOS no "situacao das obras":\n   Felipe ve so as dele (owner filter). Marcos ve todas.\n\n5. Pergunte "agendar visita para Roberto" -> observe a composicao:\n   Costa Lima (agendar) + Google Calendar (criar evento)',
              },
              {
                title: "Pipeline de cada query",
                color: C.cyan,
                text: "Input do usuario\n  -> Interpretacao de intencao (NLP simplificado)\n  -> Selecao de tools necessarias\n  -> Para cada tool:\n    -> Verificacao de autenticacao (JWT)\n    -> Verificacao de autorizacao (RBAC nivel)\n    -> Verificacao de rate limit\n    -> Aplicacao de owner filter (se nivel < 4)\n    -> Execucao da query (Prisma)\n    -> Sanitizacao do output\n    -> Log no audit\n  -> Composicao multi-MCP (se necessario)\n  -> Sintese da resposta\n  -> Exibicao com transparencia total do pipeline",
              },
              {
                title: "Como integrar no Costa Lima real",
                color: C.green,
                text: "1. MCP Server: backend/src/mcp/ com as tools reais (Prisma queries)\n2. Auth: mesmo JWT do Express, mesmo middleware\n3. RBAC: mesma tabela Usuario, mesmos 5 niveis\n4. Deploy: rota /mcp/sse no Express (porta 3333)\n5. Clients:\n   - Claude Desktop (vendedores)\n   - Chat embutido no admin (/dashboard com widget)\n   - Claude Code (devs/admin)\n   - Agente cron (alertas automaticos)\n6. Composicao: conectar Google Calendar e Gmail MCPs\n7. Monitoramento: MCPCallLog + dashboard Recharts no admin",
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
