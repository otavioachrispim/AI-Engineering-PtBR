import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED COSTA LIMA DATABASE
// ============================================================
var DB = {
  clientes: [
    { id: "cli_001", nome: "Carlos Mendes", telefone: "24 99999-1234", email: "carlos@email.com", cidade: "Volta Redonda", obras: ["obr_001"] },
    { id: "cli_002", nome: "Ana Paula Costa", telefone: "24 99888-5678", email: "ana@email.com", cidade: "Barra Mansa", obras: ["obr_002"] },
    { id: "cli_003", nome: "Roberto Almeida", telefone: "24 99777-9012", email: "roberto@email.com", cidade: "Resende", obras: [] },
    { id: "cli_004", nome: "Juliana Ferreira", telefone: "24 99666-3456", email: "juliana@email.com", cidade: "Volta Redonda", obras: ["obr_003"] },
  ],
  obras: [
    { id: "obr_001", codigo: "OBR-2026-000034", cliente_id: "cli_001", status: "EM_ANDAMENTO", tipo: "Construcao piscina 8x4", progresso: 35, valor: 85000 },
    { id: "obr_002", codigo: "OBR-2026-000029", cliente_id: "cli_002", status: "CONCLUIDA", tipo: "Manutencao geral", progresso: 100, valor: 4500 },
    { id: "obr_003", codigo: "OBR-2026-000041", cliente_id: "cli_004", status: "APROVADA", tipo: "Reforma piscina condominio", progresso: 0, valor: 32000 },
  ],
  estoque: [
    { codigo: "EQ-001", nome: "Bomba centrifuga 1/2cv", preco: 1250, estoque: 8, minimo: 3 },
    { codigo: "EQ-002", nome: "Filtro quartzo 19L", preco: 890, estoque: 5, minimo: 2 },
    { codigo: "EQ-003", nome: "Clorador automatico", preco: 650, estoque: 12, minimo: 5 },
    { codigo: "EQ-004", nome: "Kit iluminacao LED", preco: 480, estoque: 1, minimo: 3 },
    { codigo: "EQ-005", nome: "Aquecimento solar 3m2", preco: 3200, estoque: 2, minimo: 2 },
  ],
  agenda: [
    { data: "2026-03-11", hora: "08:00", tipo: "Obra", desc: "OBR-2026-000034 - Concretagem", equipe: "Joao, Pedro, Lucas" },
    { data: "2026-03-11", hora: "14:00", tipo: "Visita", desc: "Avaliacao terreno - Marcos Oliveira", equipe: "Carlos (vendedor)" },
    { data: "2026-03-12", hora: "09:00", tipo: "Manutencao", desc: "Troca bomba - Cond. Solar", equipe: "Andre, Paulo" },
    { data: "2026-03-12", hora: "15:00", tipo: "Vistoria", desc: "Vistoria pos-obra - Ana Paula", equipe: "Lucas" },
  ],
  tarefas: [
    { id: "os_101", codigo: "OS-2026-000101", status: "EM_ANDAMENTO", desc: "Troca de bomba condominio", prioridade: "alta" },
    { id: "os_102", codigo: "OS-2026-000102", status: "PENDENTE", desc: "Instalacao iluminacao LED", prioridade: "media" },
  ],
};

// ============================================================
// MCP SERVER - Tools and Resources definitions
// ============================================================
var MCP_TOOLS = [
  {
    name: "buscar_cliente",
    description: "Busca cliente por nome ou ID. Retorna dados cadastrais e obras vinculadas.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome parcial ou ID do cliente" },
      },
      required: ["query"],
    },
    execute: function(params) {
      var q = params.query.toLowerCase();
      var found = DB.clientes.filter(function(c) {
        return c.nome.toLowerCase().includes(q) || c.id === q;
      });
      return found.length > 0 ? found : { error: "Nenhum cliente encontrado para: " + params.query };
    },
  },
  {
    name: "listar_obras",
    description: "Lista obras com filtros opcionais por status e cliente.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ORCAMENTO", "APROVADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"], description: "Filtrar por status" },
        cliente_id: { type: "string", description: "Filtrar por cliente" },
      },
    },
    execute: function(params) {
      var results = DB.obras;
      if (params.status) results = results.filter(function(o) { return o.status === params.status; });
      if (params.cliente_id) results = results.filter(function(o) { return o.cliente_id === params.cliente_id; });
      return results;
    },
  },
  {
    name: "criar_os",
    description: "Cria uma nova Ordem de Servico no sistema.",
    inputSchema: {
      type: "object",
      properties: {
        descricao: { type: "string", description: "Descricao do servico" },
        prioridade: { type: "string", enum: ["baixa", "media", "alta"], description: "Nivel de prioridade" },
        cliente_id: { type: "string", description: "ID do cliente" },
      },
      required: ["descricao", "prioridade"],
    },
    execute: function(params) {
      var newId = "os_" + (103 + Math.floor(Math.random() * 900));
      var newCode = "OS-2026-" + String(103 + Math.floor(Math.random() * 900)).padStart(6, "0");
      return { id: newId, codigo: newCode, status: "PENDENTE", descricao: params.descricao, prioridade: params.prioridade, cliente_id: params.cliente_id || null, criado_em: "2026-03-10T15:30:00" };
    },
  },
  {
    name: "buscar_estoque",
    description: "Busca produtos no catalogo/estoque.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome ou codigo do produto" },
      },
    },
    execute: function(params) {
      if (!params.query) return DB.estoque;
      var q = params.query.toLowerCase();
      return DB.estoque.filter(function(e) {
        return e.nome.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q);
      });
    },
  },
  {
    name: "consultar_agenda",
    description: "Consulta agenda/programacao de servicos.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data no formato YYYY-MM-DD" },
      },
    },
    execute: function(params) {
      if (params.data) return DB.agenda.filter(function(a) { return a.data === params.data; });
      return DB.agenda;
    },
  },
  {
    name: "agendar_visita",
    description: "Agenda uma visita tecnica ou servico.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data (YYYY-MM-DD)" },
        hora: { type: "string", description: "Hora (HH:MM)" },
        descricao: { type: "string", description: "Descricao da visita" },
        equipe: { type: "string", description: "Equipe designada" },
      },
      required: ["data", "hora", "descricao"],
    },
    execute: function(params) {
      return { status: "agendado", data: params.data, hora: params.hora, descricao: params.descricao, equipe: params.equipe || "A definir", id: "ag_" + Math.floor(Math.random() * 9999) };
    },
  },
];

var MCP_RESOURCES = [
  { uri: "costalima://catalogo/produtos", name: "Catalogo de Produtos", description: "Lista completa do catalogo com precos e estoque", data: DB.estoque },
  { uri: "costalima://agenda/semana", name: "Agenda da Semana", description: "Programacao de servicos da semana", data: DB.agenda },
  { uri: "costalima://dashboard/resumo", name: "Resumo do Dashboard", description: "Metricas gerais do sistema", data: { obras_ativas: 2, os_pendentes: 1, estoque_baixo: 2, faturamento_mes: 121500 } },
];

// ============================================================
// CONVERSATION SIMULATOR
// ============================================================
var DEMO_CONVERSATIONS = [
  {
    id: 1,
    title: "Consultar situacao de obra",
    messages: [
      { role: "user", text: "Qual a situacao da obra do Carlos Mendes?" },
      { role: "tool_call", tool: "buscar_cliente", params: { query: "Carlos Mendes" }, reasoning: "Preciso encontrar o cliente para depois buscar suas obras." },
      { role: "tool_call", tool: "listar_obras", params: { cliente_id: "cli_001" }, reasoning: "Agora busco as obras vinculadas ao cliente encontrado." },
      { role: "assistant", text: "A obra do Carlos Mendes (OBR-2026-000034) esta em andamento com 35% de progresso. E uma construcao de piscina 8x4, valor de R$85.000. O status atual e EM_ANDAMENTO." },
    ],
  },
  {
    id: 2,
    title: "Criar OS urgente",
    messages: [
      { role: "user", text: "Preciso criar uma OS urgente para o condominio da Juliana Ferreira. A bomba da piscina parou de funcionar e esta vazando." },
      { role: "tool_call", tool: "buscar_cliente", params: { query: "Juliana Ferreira" }, reasoning: "Busco a cliente para vincular a OS." },
      { role: "tool_call", tool: "criar_os", params: { descricao: "Bomba da piscina parou e esta vazando. Atendimento emergencial.", prioridade: "alta", cliente_id: "cli_004" }, reasoning: "Crio a OS com prioridade alta para atendimento emergencial." },
      { role: "tool_call", tool: "buscar_estoque", params: { query: "bomba" }, reasoning: "Verifico se temos bomba em estoque para eventual troca." },
      { role: "assistant", text: "OS criada com sucesso! Codigo: OS-2026-000XXX, prioridade ALTA, vinculada a Juliana Ferreira. Boa noticia: temos 8 bombas centrifugas 1/2cv em estoque (R$1.250 cada). Quer que eu agende um tecnico para hoje?" },
    ],
  },
  {
    id: 3,
    title: "Verificar estoque e agendar",
    messages: [
      { role: "user", text: "Tem kit de iluminacao LED em estoque? Se tiver, agenda uma instalacao pro dia 13 de manha." },
      { role: "tool_call", tool: "buscar_estoque", params: { query: "iluminacao LED" }, reasoning: "Verifico disponibilidade do produto no estoque." },
      { role: "tool_call", tool: "agendar_visita", params: { data: "2026-03-13", hora: "09:00", descricao: "Instalacao kit iluminacao LED", equipe: "Andre" }, reasoning: "Produto disponivel (1 unidade), agendo a instalacao." },
      { role: "assistant", text: "Temos 1 kit de iluminacao LED em estoque (R$480), porem o estoque esta abaixo do minimo (1/3). Agendei a instalacao para 13/03 as 09:00 com o Andre. Recomendo reabastecer o estoque de LED - estamos no limite." },
    ],
  },
  {
    id: 4,
    title: "Visao geral do dia",
    messages: [
      { role: "user", text: "Me da um resumo do que temos pra hoje e amanha." },
      { role: "tool_call", tool: "consultar_agenda", params: { data: "2026-03-11" }, reasoning: "Busco a agenda de hoje." },
      { role: "tool_call", tool: "consultar_agenda", params: { data: "2026-03-12" }, reasoning: "Busco a agenda de amanha." },
      { role: "assistant", text: "Hoje (11/03): 2 compromissos - Concretagem da obra 000034 as 8h (Joao, Pedro, Lucas) e avaliacao de terreno do Marcos Oliveira as 14h (Carlos). Amanha (12/03): Troca de bomba no Cond. Solar as 9h (Andre, Paulo) e vistoria pos-obra da Ana Paula as 15h (Lucas). Dia cheio!" },
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function ToolCard(props) {
  var tool = props.tool;
  var expanded = props.expanded;
  var onToggle = props.onToggle;
  var properties = tool.inputSchema.properties || {};
  var required = tool.inputSchema.required || [];

  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "10px", overflow: "hidden", marginBottom: "8px",
    }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 14px", cursor: "pointer",
      }}>
        <span style={{ fontSize: "14px" }}>{"🔧"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.cyan }}>{tool.name}</div>
          <div style={{ fontSize: "10px", color: C.textDim }}>{tool.description}</div>
        </div>
        <span style={{ color: C.textDim, fontSize: "12px", transform: expanded ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>{"▾"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid " + C.border, background: C.surfaceAlt }}>
          <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>INPUT SCHEMA</div>
          {Object.keys(properties).map(function(key) {
            var prop = properties[key];
            var isReq = required.indexOf(key) >= 0;
            return (
              <div key={key} style={{ fontSize: "11px", marginBottom: "4px", paddingLeft: "8px" }}>
                <span style={{ color: C.cyan, fontWeight: 600 }}>{key}</span>
                <span style={{ color: C.textDim }}>{": " + (prop.type || "string")}</span>
                {isReq && <span style={{ color: C.red, fontSize: "9px", marginLeft: "4px" }}>*required</span>}
                {prop.enum && <span style={{ color: C.amber, fontSize: "9px", marginLeft: "4px" }}>{"[" + prop.enum.join(", ") + "]"}</span>}
                {prop.description && <div style={{ color: C.textDim, fontSize: "9px", paddingLeft: "4px" }}>{prop.description}</div>}
              </div>
            );
          })}
          <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginTop: "10px", marginBottom: "4px" }}>TESTE RAPIDO</div>
          <button onClick={function() {
            var testParams = {};
            if (tool.name === "buscar_cliente") testParams = { query: "Carlos" };
            else if (tool.name === "listar_obras") testParams = { status: "EM_ANDAMENTO" };
            else if (tool.name === "buscar_estoque") testParams = { query: "bomba" };
            else if (tool.name === "consultar_agenda") testParams = { data: "2026-03-11" };
            else testParams = {};
            var result = tool.execute(testParams);
            alert(JSON.stringify(result, null, 2));
          }} style={{
            padding: "6px 14px", borderRadius: "6px", border: "1px solid " + C.cyan + "33",
            background: C.cyan + "10", color: C.cyan, fontSize: "10px",
            fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
          }}>
            Executar com dados de exemplo
          </button>
        </div>
      )}
    </div>
  );
}

function ConversationSim(props) {
  var conv = props.conv;
  var expanded = props.expanded;
  var onToggle = props.onToggle;
  var visibleMsgs = props.visibleMsgs;

  return (
    <div style={{
      background: C.surface, border: "1px solid " + (expanded ? C.blue + "44" : C.border),
      borderRadius: "10px", overflow: "hidden", marginBottom: "10px",
    }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 14px", cursor: "pointer",
      }}>
        <span style={{ fontSize: "14px" }}>{"💬"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{conv.title}</div>
          <div style={{ fontSize: "10px", color: C.textDim }}>
            {conv.messages.filter(function(m) { return m.role === "tool_call"; }).length + " tool calls"}
          </div>
        </div>
        <span style={{ color: C.textDim, fontSize: "12px", transform: expanded ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>{"▾"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid " + C.border }}>
          {conv.messages.map(function(msg, i) {
            if (i >= visibleMsgs) return null;
            if (msg.role === "user") {
              return (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
                  background: C.blue + "10", border: "1px solid " + C.blue + "22",
                  fontSize: "12px", color: C.text, lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: "9px", color: C.blue, fontWeight: 700, marginBottom: "4px" }}>USUARIO</div>
                  {msg.text}
                </div>
              );
            }
            if (msg.role === "tool_call") {
              var result = null;
              var tool = MCP_TOOLS.find(function(t) { return t.name === msg.tool; });
              if (tool) result = tool.execute(msg.params);
              return (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
                  background: C.surfaceAlt, border: "1px solid " + C.border,
                  fontSize: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ color: C.amber, fontWeight: 700, fontSize: "9px" }}>TOOL CALL</span>
                    <span style={{ color: C.cyan, fontWeight: 700 }}>{msg.tool}</span>
                  </div>
                  <div style={{ color: C.textDim, marginBottom: "4px", fontStyle: "italic" }}>
                    {"Raciocinio: " + msg.reasoning}
                  </div>
                  <div style={{ color: C.textMuted, marginBottom: "4px" }}>
                    {"Params: " + JSON.stringify(msg.params)}
                  </div>
                  {result && (
                    <pre style={{
                      margin: 0, padding: "8px", borderRadius: "6px",
                      background: C.bg, color: C.green, fontSize: "9px",
                      lineHeight: 1.4, whiteSpace: "pre-wrap", fontFamily: "inherit",
                      maxHeight: "120px", overflowY: "auto",
                    }}>
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              );
            }
            if (msg.role === "assistant") {
              return (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: "8px", marginBottom: "8px",
                  background: C.green + "08", border: "1px solid " + C.green + "22",
                  fontSize: "12px", color: C.text, lineHeight: 1.6,
                }}>
                  <div style={{ fontSize: "9px", color: C.green, fontWeight: 700, marginBottom: "4px" }}>ASSISTENTE (resposta final)</div>
                  {msg.text}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MCPLab() {
  var [activeTab, setActiveTab] = useState("demo");
  var [expandedTool, setExpandedTool] = useState(null);
  var [expandedConv, setExpandedConv] = useState(null);
  var [visibleMsgs, setVisibleMsgs] = useState(99);

  var playConversation = useCallback(function(convId) {
    setExpandedConv(convId);
    setVisibleMsgs(0);
    var conv = DEMO_CONVERSATIONS.find(function(c) { return c.id === convId; });
    if (!conv) return;
    conv.messages.forEach(function(_, i) {
      setTimeout(function() { setVisibleMsgs(i + 1); }, (i + 1) * 800);
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
          }}>Cap 3 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            MCP - Model Context Protocol
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Fundamentos: tools, resources, e como o LLM interage com o Costa Lima
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "demo", label: "Conversas Demo" },
            { id: "tools", label: "Tools (" + MCP_TOOLS.length + ")" },
            { id: "resources", label: "Resources (" + MCP_RESOURCES.length + ")" },
            { id: "compare", label: "MCP vs Tools" },
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

        {/* DEMO TAB */}
        {activeTab === "demo" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Veja como o LLM usa MCP tools para responder perguntas sobre o Costa Lima. Clique para reproduzir cada conversa passo a passo.
            </p>
            {DEMO_CONVERSATIONS.map(function(conv) {
              var isExpanded = expandedConv === conv.id;
              return (
                <div key={conv.id}>
                  {!isExpanded && (
                    <button onClick={function() { playConversation(conv.id); }} style={{
                      width: "100%", textAlign: "left", padding: "14px", borderRadius: "10px",
                      border: "1px solid " + C.border, background: C.surface,
                      color: C.text, cursor: "pointer", fontFamily: "inherit", marginBottom: "8px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px" }}>{"▶"}</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700 }}>{conv.title}</div>
                          <div style={{ fontSize: "10px", color: C.textDim }}>
                            {conv.messages.filter(function(m) { return m.role === "tool_call"; }).length + " tool calls | Clique para reproduzir"}
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                  {isExpanded && (
                    <ConversationSim
                      conv={conv}
                      expanded={true}
                      onToggle={function() { setExpandedConv(null); }}
                      visibleMsgs={visibleMsgs}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Tools que o MCP Server do Costa Lima expoe. O LLM descobre estas tools automaticamente e decide quando usa-las.
            </p>
            {MCP_TOOLS.map(function(tool) {
              return (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  expanded={expandedTool === tool.name}
                  onToggle={function() { setExpandedTool(expandedTool === tool.name ? null : tool.name); }}
                />
              );
            })}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === "resources" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Resources sao dados somente-leitura que o LLM pode consultar. Diferentes de tools: nao executam acoes, apenas fornecem contexto.
            </p>
            {MCP_RESOURCES.map(function(res) {
              return (
                <div key={res.uri} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "14px", marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px" }}>{"📄"}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.orange }}>{res.name}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px" }}>
                    URI: <span style={{ color: C.cyan }}>{res.uri}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "8px" }}>{res.description}</div>
                  <pre style={{
                    margin: 0, padding: "10px", borderRadius: "6px",
                    background: C.surfaceAlt, color: C.green, fontSize: "9px",
                    lineHeight: 1.4, whiteSpace: "pre-wrap", fontFamily: "inherit",
                    maxHeight: "150px", overflowY: "auto",
                  }}>
                    {JSON.stringify(res.data, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <div>
            {[
              {
                title: "Function Calling (Cap 2)",
                color: C.amber,
                text: "Formato proprietario por provedor (Anthropic, OpenAI, Google cada um tem o seu). Voce declara funcoes no codigo do seu app e as registra na chamada de API. Cada novo provedor exige adaptacao. Cada nova tool exige mudanca no codigo do app. Sem descoberta automatica.",
              },
              {
                title: "MCP (Cap 3)",
                color: C.purple,
                text: "Protocolo padronizado e aberto. O MCP Server declara tools e resources uma vez. Qualquer client compativel descobre automaticamente. Adicionar nova capacidade = adicionar no server. Mudar de provedor = zero mudanca. Analogia: function calling e como driver especifico por impressora. MCP e como USB.",
              },
              {
                title: "Quando usar Function Calling",
                color: C.cyan,
                text: "Integracao simples com poucas tools (2-5). Um unico provedor de LLM. Prototipo rapido. Nao precisa de interoperabilidade. Exemplo: o pipeline do Cap 2 com classificar_lead e gerar_resposta funciona bem com function calling puro.",
              },
              {
                title: "Quando usar MCP",
                color: C.green,
                text: "Muitas tools (10+). Multiplos sistemas para integrar. Quer que diferentes LLMs/clients acessem as mesmas capacidades. Empresa com varias equipes usando IA. Exemplo: o Costa Lima com 6+ tools (clientes, obras, estoque, agenda, OS, financeiro) se beneficia muito de um MCP Server centralizado.",
              },
              {
                title: "Na pratica para o Costa Lima",
                color: C.orange,
                text: "Crie um MCP Server TypeScript que conecta ao Prisma/PostgreSQL e expoe as operacoes do ERP como tools. Os vendedores usam o Claude.ai com esse MCP conectado. O coordenador usa o Claude Code para consultas mais complexas. O admin usa via API. Todos acessam os mesmos dados, mesmas tools, sem duplicacao de codigo.",
              },
            ].map(function(section) {
              return (
                <div key={section.title} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "20px", marginBottom: "12px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>{section.title}</h3>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.8, color: C.textMuted }}>{section.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
