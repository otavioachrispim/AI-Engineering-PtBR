import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED DATABASE (Costa Lima)
// ============================================================
var DB = {
  clientes: [
    { id: "cli_001", nome: "Carlos Mendes", telefone: "24 99999-1234", cidade: "Volta Redonda", ativo: true },
    { id: "cli_002", nome: "Ana Paula Costa", telefone: "24 99888-5678", cidade: "Barra Mansa", ativo: true },
    { id: "cli_003", nome: "Roberto Almeida", telefone: "24 99777-9012", cidade: "Resende", ativo: true },
    { id: "cli_004", nome: "Juliana Ferreira", telefone: "24 99666-3456", cidade: "Volta Redonda", ativo: true },
  ],
  obras: [
    { id: "obr_001", codigo: "OBR-2026-000034", clienteId: "cli_001", status: "EM_ANDAMENTO", tipo: "Piscina 8x4", progresso: 35, valor: 85000 },
    { id: "obr_002", codigo: "OBR-2026-000029", clienteId: "cli_002", status: "CONCLUIDA", tipo: "Manutencao geral", progresso: 100, valor: 4500 },
    { id: "obr_003", codigo: "OBR-2026-000041", clienteId: "cli_004", status: "APROVADA", tipo: "Reforma condominio", progresso: 0, valor: 32000 },
  ],
  estoque: [
    { codigo: "EQ-001", nome: "Bomba centrifuga 1/2cv", preco: 1250, estoque: 8, minimo: 3 },
    { codigo: "EQ-002", nome: "Filtro quartzo 19L", preco: 890, estoque: 5, minimo: 2 },
    { codigo: "EQ-003", nome: "Clorador automatico", preco: 650, estoque: 12, minimo: 5 },
    { codigo: "EQ-004", nome: "Kit iluminacao LED", preco: 480, estoque: 1, minimo: 3 },
  ],
  agenda: [
    { data: "2026-03-11", hora: "08:00", tipo: "Obra", desc: "Concretagem OBR-000034", equipe: "Joao, Pedro, Lucas" },
    { data: "2026-03-11", hora: "14:00", tipo: "Visita", desc: "Avaliacao terreno", equipe: "Carlos" },
    { data: "2026-03-12", hora: "09:00", tipo: "Manutencao", desc: "Troca bomba", equipe: "Andre, Paulo" },
  ],
};

var osCounter = 103;

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================
var TOOLS = {
  buscar_cliente: {
    name: "buscar_cliente",
    desc: "Busca cliente por nome ou ID",
    params: [
      { name: "query", type: "string", required: true, desc: "Nome parcial ou ID" },
    ],
    execute: function(p) {
      var q = (p.query || "").toLowerCase();
      var found = DB.clientes.filter(function(c) {
        return c.nome.toLowerCase().includes(q) || c.id === p.query;
      });
      return found.length > 0 ? found : { error: "Nenhum cliente encontrado" };
    },
    prismaCode: 'await prisma.cliente.findMany({\n  where: {\n    OR: [\n      { nome: { contains: query, mode: "insensitive" } },\n      { id: query },\n    ],\n    ativo: true,\n  },\n  include: { obras: { select: { id: true, codigo: true, status: true } } },\n  take: 5,\n})',
  },
  listar_obras: {
    name: "listar_obras",
    desc: "Lista obras com filtros",
    params: [
      { name: "status", type: "enum", required: false, desc: "Filtrar por status", options: ["ORCAMENTO", "APROVADA", "EM_ANDAMENTO", "CONCLUIDA"] },
      { name: "cliente_id", type: "string", required: false, desc: "Filtrar por cliente" },
    ],
    execute: function(p) {
      var results = DB.obras;
      if (p.status) results = results.filter(function(o) { return o.status === p.status; });
      if (p.cliente_id) results = results.filter(function(o) { return o.clienteId === p.cliente_id; });
      return results;
    },
    prismaCode: 'await prisma.obra.findMany({\n  where: {\n    ...(status && { status }),\n    ...(clienteId && { clienteId }),\n    ativo: true,\n  },\n  include: { cliente: { select: { nome: true } } },\n  orderBy: { createdAt: "desc" },\n  take: 10,\n})',
  },
  criar_os: {
    name: "criar_os",
    desc: "Cria Ordem de Servico",
    params: [
      { name: "descricao", type: "string", required: true, desc: "Descricao do servico" },
      { name: "prioridade", type: "enum", required: true, desc: "Prioridade", options: ["baixa", "media", "alta"] },
      { name: "cliente_id", type: "string", required: false, desc: "ID do cliente" },
    ],
    execute: function(p) {
      osCounter++;
      var codigo = "OS-2026-" + String(osCounter).padStart(6, "0");
      return { id: "os_" + osCounter, codigo: codigo, status: "PENDENTE", descricao: p.descricao, prioridade: p.prioridade, cliente_id: p.cliente_id || null, criado_em: new Date().toISOString() };
    },
    prismaCode: 'const count = await prisma.tarefa.count();\nconst codigo = "OS-" + year + "-" + pad(count+1);\nawait prisma.tarefa.create({\n  data: { codigo, descricao, prioridade, status: "PENDENTE", clienteId },\n})',
  },
  buscar_estoque: {
    name: "buscar_estoque",
    desc: "Busca produtos no estoque",
    params: [
      { name: "query", type: "string", required: false, desc: "Nome ou codigo do produto" },
    ],
    execute: function(p) {
      if (!p.query) return DB.estoque;
      var q = (p.query || "").toLowerCase();
      return DB.estoque.filter(function(e) { return e.nome.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q); });
    },
    prismaCode: 'await prisma.equipamentoCatalogo.findMany({\n  where: query ? {\n    OR: [\n      { nome: { contains: query, mode: "insensitive" } },\n      { codigo: { contains: query, mode: "insensitive" } },\n    ],\n  } : undefined,\n  where: { ativo: true },\n  take: 20,\n})',
  },
  consultar_agenda: {
    name: "consultar_agenda",
    desc: "Consulta agenda de servicos",
    params: [
      { name: "data", type: "string", required: false, desc: "Data YYYY-MM-DD" },
    ],
    execute: function(p) {
      if (p.data) return DB.agenda.filter(function(a) { return a.data === p.data; });
      return DB.agenda;
    },
    prismaCode: 'await prisma.agendaProgramacao.findMany({\n  where: data ? { data: new Date(data) } : undefined,\n  include: { obra: true, cliente: true },\n  orderBy: [{ data: "asc" }, { horaInicio: "asc" }],\n})',
  },
  agendar_visita: {
    name: "agendar_visita",
    desc: "Agenda visita tecnica",
    params: [
      { name: "data", type: "string", required: true, desc: "Data YYYY-MM-DD" },
      { name: "hora", type: "string", required: true, desc: "Hora HH:MM" },
      { name: "descricao", type: "string", required: true, desc: "Descricao" },
      { name: "equipe", type: "string", required: false, desc: "Equipe" },
    ],
    execute: function(p) {
      return { status: "agendado", data: p.data, hora: p.hora, descricao: p.descricao, equipe: p.equipe || "A definir" };
    },
    prismaCode: 'await prisma.agendaProgramacao.create({\n  data: {\n    data: new Date(data),\n    horaInicio: hora,\n    servico: descricao,\n    equipeTexto: equipe,\n  },\n})',
  },
};

var TOOL_LIST = Object.keys(TOOLS).map(function(k) { return TOOLS[k]; });

// ============================================================
// JSON-RPC PROTOCOL FORMATTER
// ============================================================
function formatRequest(method, params, id) {
  return { jsonrpc: "2.0", id: id || 1, method: method, params: params };
}

function formatResponse(result, id) {
  return { jsonrpc: "2.0", id: id || 1, result: result };
}

function formatToolsListResponse() {
  return formatResponse({
    tools: TOOL_LIST.map(function(t) {
      var properties = {};
      var required = [];
      t.params.forEach(function(p) {
        properties[p.name] = { type: p.type === "enum" ? "string" : p.type, description: p.desc };
        if (p.options) properties[p.name].enum = p.options;
        if (p.required) required.push(p.name);
      });
      return {
        name: t.name,
        description: t.desc,
        inputSchema: { type: "object", properties: properties, required: required },
      };
    }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

function ProtocolMessage(props) {
  var msg = props.msg;
  var direction = props.direction;
  var dirColor = direction === "request" ? C.blue : C.green;
  var dirLabel = direction === "request" ? "CLIENT -> SERVER" : "SERVER -> CLIENT";

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "9px", fontWeight: 700, color: dirColor, marginBottom: "4px", letterSpacing: "0.5px" }}>
        {dirLabel}
      </div>
      <pre style={{
        margin: 0, padding: "10px 12px", borderRadius: "8px",
        background: C.bg, border: "1px solid " + dirColor + "22",
        fontSize: "10px", color: dirColor === C.blue ? C.cyan : C.green,
        lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit",
        maxHeight: "200px", overflowY: "auto",
      }}>
        {JSON.stringify(msg, null, 2)}
      </pre>
    </div>
  );
}

function ToolTester(props) {
  var tool = props.tool;
  var paramValues = props.paramValues;
  var setParamValues = props.setParamValues;
  var onExecute = props.onExecute;

  return (
    <div style={{ padding: "14px", background: C.surfaceAlt, borderRadius: "8px" }}>
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>PARAMETROS</div>
      {tool.params.map(function(p) {
        var val = (paramValues[p.name] !== undefined) ? paramValues[p.name] : "";
        return (
          <div key={p.name} style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "3px" }}>
              {p.name}
              {p.required && <span style={{ color: C.red, marginLeft: "4px" }}>*</span>}
              <span style={{ color: C.textDim, marginLeft: "8px", fontSize: "9px" }}>{p.desc}</span>
            </label>
            {p.options ? (
              <select value={val} onChange={function(e) {
                var nv = Object.assign({}, paramValues);
                nv[p.name] = e.target.value;
                setParamValues(nv);
              }} style={{
                width: "100%", padding: "6px 8px", borderRadius: "6px",
                border: "1px solid " + C.border, background: C.bg,
                color: C.text, fontSize: "11px", fontFamily: "inherit",
              }}>
                <option value="">-- selecione --</option>
                {p.options.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
              </select>
            ) : (
              <input type="text" value={val} onChange={function(e) {
                var nv = Object.assign({}, paramValues);
                nv[p.name] = e.target.value;
                setParamValues(nv);
              }} placeholder={p.desc} style={{
                width: "100%", padding: "6px 8px", borderRadius: "6px",
                border: "1px solid " + C.border, background: C.bg,
                color: C.text, fontSize: "11px", fontFamily: "inherit",
                boxSizing: "border-box",
              }} />
            )}
          </div>
        );
      })}
      <button onClick={onExecute} style={{
        padding: "8px 20px", borderRadius: "6px", border: "none",
        background: C.green, color: "#fff", fontSize: "11px",
        fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: "4px",
      }}>
        Executar Tool
      </button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MCPServerLab() {
  var [activeTab, setActiveTab] = useState("tester");
  var [selectedTool, setSelectedTool] = useState("buscar_cliente");
  var [paramValues, setParamValues] = useState({ query: "Carlos" });
  var [protocolLog, setProtocolLog] = useState([]);
  var [lastResult, setLastResult] = useState(null);

  var executeTool = useCallback(function() {
    var tool = TOOLS[selectedTool];
    if (!tool) return;

    // Clean empty params
    var cleanParams = {};
    Object.keys(paramValues).forEach(function(k) {
      if (paramValues[k] !== "" && paramValues[k] !== undefined) cleanParams[k] = paramValues[k];
    });

    // Protocol messages
    var reqId = protocolLog.length + 1;
    var request = formatRequest("tools/call", { name: selectedTool, arguments: cleanParams }, reqId);
    var result = tool.execute(cleanParams);
    var response = formatResponse({ content: [{ type: "text", text: JSON.stringify(result) }] }, reqId);

    setProtocolLog(function(prev) {
      return [{ direction: "request", msg: request }, { direction: "response", msg: response }].concat(prev).slice(0, 20);
    });
    setLastResult(result);
  }, [selectedTool, paramValues, protocolLog]);

  var initHandshake = useCallback(function() {
    var msgs = [
      { direction: "request", msg: formatRequest("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "Claude Desktop", version: "1.0" } }, 0) },
      { direction: "response", msg: formatResponse({ protocolVersion: "2024-11-05", capabilities: { tools: {}, resources: {} }, serverInfo: { name: "Costa Lima Piscinas MCP", version: "1.0.0" } }, 0) },
      { direction: "request", msg: formatRequest("tools/list", {}, 1) },
      { direction: "response", msg: formatToolsListResponse() },
    ];
    setProtocolLog(msgs.concat(protocolLog).slice(0, 30));
  }, [protocolLog]);

  var tool = TOOLS[selectedTool];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.cyan, padding: "4px 10px", borderRadius: "4px",
            background: C.cyan + "12", border: "1px solid " + C.cyan + "33",
          }}>Cap 3 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            MCP Server em TypeScript
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Construa, teste e inspecione o protocolo JSON-RPC
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "tester", label: "Testar Tools" },
            { id: "protocol", label: "Protocolo JSON-RPC" },
            { id: "code", label: "Codigo Prisma" },
            { id: "deploy", label: "Deploy" },
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

        {/* TESTER TAB */}
        {activeTab === "tester" && (
          <div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {/* Tool selector */}
              <div style={{ width: "200px", flexShrink: 0 }}>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>TOOLS</div>
                {TOOL_LIST.map(function(t) {
                  var isSelected = selectedTool === t.name;
                  return (
                    <button key={t.name} onClick={function() {
                      setSelectedTool(t.name);
                      setParamValues({});
                      setLastResult(null);
                    }} style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
                      border: "1px solid " + (isSelected ? C.cyan : C.border),
                      background: isSelected ? C.cyan + "10" : C.surface,
                      color: isSelected ? C.cyan : C.textMuted,
                      fontSize: "11px", fontFamily: "inherit", cursor: "pointer",
                    }}>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{t.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Params + Execute */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                {tool && (
                  <div>
                    <div style={{
                      background: C.surface, border: "1px solid " + C.border,
                      borderRadius: "10px", overflow: "hidden", marginBottom: "12px",
                    }}>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: C.cyan }}>{tool.name}</span>
                        <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "10px" }}>{tool.desc}</span>
                      </div>
                      <ToolTester
                        tool={tool}
                        paramValues={paramValues}
                        setParamValues={setParamValues}
                        onExecute={executeTool}
                      />
                    </div>

                    {/* Result */}
                    {lastResult && (
                      <div style={{
                        background: C.surface, border: "1px solid " + C.green + "33",
                        borderRadius: "10px", padding: "14px",
                      }}>
                        <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>RESULTADO</div>
                        <pre style={{
                          margin: 0, padding: "12px", borderRadius: "8px",
                          background: C.bg, color: C.green, fontSize: "10px",
                          lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit",
                          maxHeight: "300px", overflowY: "auto",
                        }}>
                          {JSON.stringify(lastResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROTOCOL TAB */}
        {activeTab === "protocol" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.6 }}>
              Cada interacao MCP usa JSON-RPC 2.0. Aqui voce ve os payloads reais trocados entre client e server.
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={initHandshake} style={{
                padding: "8px 16px", borderRadius: "6px", border: "none",
                background: C.purple, color: "#fff", fontSize: "11px",
                fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              }}>
                Simular Handshake (initialize + tools/list)
              </button>
              <button onClick={executeTool} style={{
                padding: "8px 16px", borderRadius: "6px", border: "1px solid " + C.cyan + "33",
                background: C.cyan + "10", color: C.cyan, fontSize: "11px",
                fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
              }}>
                Executar tool atual (tools/call)
              </button>
              <button onClick={function() { setProtocolLog([]); }} style={{
                padding: "8px 16px", borderRadius: "6px", border: "1px solid " + C.border,
                background: "transparent", color: C.textDim, fontSize: "11px",
                fontFamily: "inherit", cursor: "pointer",
              }}>
                Limpar log
              </button>
            </div>

            {protocolLog.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "12px", background: C.surface, borderRadius: "10px", border: "1px solid " + C.border }}>
                Clique "Simular Handshake" para ver o protocolo MCP em acao
              </div>
            ) : (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                {protocolLog.map(function(entry, i) {
                  return <ProtocolMessage key={i} msg={entry.msg} direction={entry.direction} />;
                })}
              </div>
            )}
          </div>
        )}

        {/* CODE TAB */}
        {activeTab === "code" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Codigo Prisma real que cada tool executaria no backend do Costa Lima. Mesmo ORM, mesmo schema, mesmas queries.
            </p>
            {TOOL_LIST.map(function(t) {
              return (
                <div key={t.name} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", overflow: "hidden", marginBottom: "10px",
                }}>
                  <div style={{
                    padding: "10px 14px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.cyan }}>{t.name}</span>
                    <span style={{ fontSize: "10px", color: C.textDim }}>{t.desc}</span>
                  </div>
                  <pre style={{
                    margin: 0, padding: "14px", fontSize: "11px",
                    color: C.amber, lineHeight: 1.6,
                    whiteSpace: "pre-wrap", fontFamily: "inherit",
                    background: C.bg,
                  }}>
                    {t.prismaCode}
                  </pre>
                </div>
              );
            })}
          </div>
        )}

        {/* DEPLOY TAB */}
        {activeTab === "deploy" && (
          <div>
            {[
              {
                title: "Estrutura do projeto",
                color: C.cyan,
                text: "mcp-server-costalima/\n  package.json\n  tsconfig.json\n  src/\n    index.ts         <- server principal\n    tools/\n      clientes.ts    <- buscar_cliente\n      obras.ts       <- listar_obras, detalhe_obra\n      tarefas.ts     <- criar_os\n      estoque.ts     <- buscar_estoque\n      agenda.ts      <- consultar_agenda, agendar_visita\n    resources/\n      catalogo.ts\n      dashboard.ts\n    db/\n      prisma.ts      <- mesma instancia do backend\n  prisma/\n    schema.prisma    <- MESMO schema do backend Express",
              },
              {
                title: "Opcao 1: stdio (local, Claude Desktop)",
                color: C.green,
                text: "O server roda como processo filho do Claude Desktop. Configuracao no arquivo claude_desktop_config.json:\n\n{ \"mcpServers\": { \"costalima\": { \"command\": \"node\", \"args\": [\"./dist/index.js\"], \"env\": { \"DATABASE_URL\": \"postgresql://...\" } } } }\n\nVantagem: simples, zero rede. Desvantagem: so funciona local, um client por vez.",
              },
              {
                title: "Opcao 2: HTTP + SSE (producao)",
                color: C.purple,
                text: "O server roda como servico HTTP numa porta separada (ex: 3334). Deploy no Railway junto com o backend Express (porta 3333). Multiplos clients podem conectar. Autenticacao por token Bearer.\n\nVantagem: escalavel, multiplos clients, deploy centralizado.\nDesvantagem: mais complexo, precisa de auth.",
              },
              {
                title: "Integracao com backend existente",
                color: C.amber,
                text: "O MCP Server COMPARTILHA o mesmo banco PostgreSQL (Neon) e schema Prisma do backend Express. Nao duplica dados. E literalmente outra porta de entrada para o mesmo sistema.\n\nBackend Express (3333) -> controllers -> prisma -> PostgreSQL\nMCP Server (3334) -> tools -> prisma -> PostgreSQL (mesmo!)\n\nO frontend admin e PWA continuam usando REST. O MCP e um canal adicional para LLMs.",
              },
              {
                title: "Seguranca",
                color: C.red,
                text: "1. RBAC: identificar o usuario conectando e aplicar mesmas regras do Express\n2. Read-heavy: maioria das tools deve ser leitura. Escrita (criar_os, agendar) com confirmacao\n3. Rate limiting: maximo de tool calls por minuto por usuario\n4. Logging: toda tool call no AICallLog (quem, o que, quando)\n5. Limite de dados: take: 10 em toda query, nunca retornar tabela inteira\n6. DATABASE_URL em variavel de ambiente, nunca no codigo\n7. Nao expor: delete, drop, alter permissoes, dados financeiros senssiveis",
              },
            ].map(function(section) {
              return (
                <div key={section.title} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "20px", marginBottom: "12px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>{section.title}</h3>
                  <pre style={{
                    margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit",
                    fontSize: "12px", lineHeight: 1.7, color: C.textMuted,
                  }}>
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
