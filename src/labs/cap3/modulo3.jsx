import { useState, useCallback, useMemo } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// USERS - Costa Lima RBAC levels
// ============================================================
var USERS = [
  { id: "u1", nome: "Marcos (Admin)", nivel: 5, cargo: "ADMINISTRADOR", area: "Geral" },
  { id: "u2", nome: "Sandra (Coord)", nivel: 4, cargo: "COORDENADOR", area: "Obras" },
  { id: "u3", nome: "Felipe (Vendedor)", nivel: 3, cargo: "VENDEDOR", area: "Comercial" },
  { id: "u4", nome: "Camila (Auxiliar)", nivel: 2, cargo: "AUXILIAR", area: "Operacional" },
  { id: "u5", nome: "Lucas (Colaborador)", nivel: 1, cargo: "COLABORADOR", area: "Campo" },
];

// ============================================================
// TOOLS with security metadata
// ============================================================
var TOOLS = [
  { name: "buscar_cliente", category: "read", minLevel: 2, ownerFilter: true, ratePerMin: 20, desc: "Busca clientes", fields: ["id", "nome", "telefone", "email", "cidade"], sensitiveFields: ["cpf", "cnpj", "contaAzulId"] },
  { name: "listar_obras", category: "read", minLevel: 1, ownerFilter: true, ratePerMin: 20, desc: "Lista obras", fields: ["id", "codigo", "status", "tipo", "progresso"], sensitiveFields: ["valor", "custoReal"] },
  { name: "buscar_estoque", category: "read", minLevel: 2, ownerFilter: false, ratePerMin: 20, desc: "Busca estoque", fields: ["codigo", "nome", "preco", "estoque", "minimo"], sensitiveFields: ["precoCusto", "margemLucro"] },
  { name: "consultar_agenda", category: "read", minLevel: 1, ownerFilter: true, ratePerMin: 20, desc: "Consulta agenda", fields: ["data", "hora", "tipo", "desc", "equipe"], sensitiveFields: [] },
  { name: "criar_os", category: "write", minLevel: 3, ownerFilter: false, ratePerMin: 5, desc: "Cria OS", fields: ["codigo", "descricao", "prioridade", "status"], sensitiveFields: [] },
  { name: "agendar_visita", category: "write", minLevel: 3, ownerFilter: false, ratePerMin: 5, desc: "Agenda visita", fields: ["data", "hora", "descricao", "equipe"], sensitiveFields: [] },
  { name: "consultar_financeiro", category: "read", minLevel: 4, ownerFilter: false, ratePerMin: 10, desc: "Dados financeiros", fields: ["tipo", "valor", "vencimento", "status"], sensitiveFields: ["contaBancaria", "chavesPix"] },
  { name: "alterar_configuracoes", category: "dangerous", minLevel: 5, ownerFilter: false, ratePerMin: 2, desc: "Altera configs do sistema", fields: [], sensitiveFields: [] },
];

var CATEGORY_COLORS = { read: C.green, write: C.amber, dangerous: C.red };
var CATEGORY_LABELS = { read: "READ", write: "WRITE", dangerous: "DANGEROUS" };

// ============================================================
// SECURITY ENGINE
// ============================================================
var rateCounts = {};
var auditLog = [];
var auditIdCounter = 1;

function checkAccess(user, toolName) {
  var tool = TOOLS.find(function(t) { return t.name === toolName; });
  if (!tool) return { allowed: false, reason: "Tool nao encontrada", code: "NOT_FOUND" };

  // Auth check
  if (!user) return { allowed: false, reason: "Usuario nao autenticado", code: "AUTH_REQUIRED" };

  // RBAC check
  if (user.nivel < tool.minLevel) {
    return {
      allowed: false,
      reason: "Nivel insuficiente: " + user.cargo + " (nivel " + user.nivel + ") precisa de nivel " + tool.minLevel,
      code: "FORBIDDEN",
      requiredLevel: tool.minLevel,
    };
  }

  // Rate limit check
  var key = user.id + ":" + toolName;
  var now = Date.now();
  if (!rateCounts[key] || now - rateCounts[key].start > 60000) {
    rateCounts[key] = { count: 0, start: now };
  }
  rateCounts[key].count++;

  if (rateCounts[key].count > tool.ratePerMin) {
    return {
      allowed: false,
      reason: "Rate limit excedido: " + rateCounts[key].count + "/" + tool.ratePerMin + " por minuto",
      code: "RATE_LIMITED",
      retryAfter: Math.ceil(60 - (now - rateCounts[key].start) / 1000),
    };
  }

  // Owner filter
  var filter = null;
  if (tool.ownerFilter && user.nivel < 4) {
    filter = { responsavelId: user.id };
  }

  // Field filtering
  var visibleFields = tool.fields.slice();
  var blockedFields = tool.sensitiveFields.slice();
  if (user.nivel < 4) {
    // Remove financial fields for non-coordinators
    blockedFields = blockedFields.concat(["valor", "custoReal"]);
  }

  return {
    allowed: true,
    filter: filter,
    visibleFields: visibleFields,
    blockedFields: blockedFields,
    rateRemaining: tool.ratePerMin - rateCounts[key].count,
    code: "OK",
  };
}

function logCall(user, toolName, result) {
  var entry = {
    id: "audit_" + String(auditIdCounter++).padStart(4, "0"),
    timestamp: new Date().toISOString().slice(11, 19),
    userId: user ? user.id : "anonymous",
    userName: user ? user.nome : "Anonimo",
    userLevel: user ? user.nivel : 0,
    tool: toolName,
    allowed: result.allowed,
    code: result.code,
    reason: result.reason || null,
  };
  auditLog.unshift(entry);
  if (auditLog.length > 30) auditLog.pop();
  return entry;
}

// ============================================================
// COMPONENTS
// ============================================================

function AccessMatrix() {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "160px repeat(5, 1fr)",
        gap: "1px", fontSize: "10px", minWidth: "600px",
      }}>
        {/* Header */}
        <div style={{ padding: "8px", background: C.surfaceAlt, fontWeight: 700, color: C.textDim }}>Tool</div>
        {USERS.map(function(u) {
          return (
            <div key={u.id} style={{ padding: "8px", background: C.surfaceAlt, textAlign: "center", fontWeight: 700, color: C.textMuted }}>
              <div>{u.cargo}</div>
              <div style={{ fontSize: "9px", color: C.textDim }}>nivel {u.nivel}</div>
            </div>
          );
        })}

        {/* Rows */}
        {TOOLS.map(function(tool) {
          return [
            <div key={tool.name + "-label"} style={{
              padding: "8px", background: C.surface,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{
                fontSize: "7px", fontWeight: 800, padding: "2px 4px", borderRadius: "3px",
                background: (CATEGORY_COLORS[tool.category] || C.textDim) + "15",
                color: CATEGORY_COLORS[tool.category] || C.textDim,
              }}>{CATEGORY_LABELS[tool.category]}</span>
              <span style={{ color: C.text, fontWeight: 600, fontSize: "10px" }}>{tool.name}</span>
            </div>
          ].concat(USERS.map(function(user) {
            var hasAccess = user.nivel >= tool.minLevel;
            var isFiltered = tool.ownerFilter && user.nivel < 4 && hasAccess;
            return (
              <div key={tool.name + "-" + user.id} style={{
                padding: "8px", background: C.surface, textAlign: "center",
              }}>
                {hasAccess ? (
                  <div>
                    <span style={{ color: C.green, fontWeight: 800 }}>{"\u2713"}</span>
                    {isFiltered && <div style={{ fontSize: "8px", color: C.amber }}>own only</div>}
                  </div>
                ) : (
                  <span style={{ color: C.red, fontWeight: 800 }}>{"\u2717"}</span>
                )}
              </div>
            );
          }));
        })}
      </div>
    </div>
  );
}

function SecurityTester(props) {
  var selectedUser = props.selectedUser;
  var setSelectedUser = props.setSelectedUser;
  var testResults = props.testResults;
  var onRunTests = props.onRunTests;

  return (
    <div>
      {/* User selector */}
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>USUARIO CONECTADO</div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={function() { setSelectedUser(null); }} style={{
          padding: "8px 14px", borderRadius: "8px", fontSize: "10px",
          fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
          border: "1px solid " + (!selectedUser ? C.red : C.border),
          background: !selectedUser ? C.red + "12" : "transparent",
          color: !selectedUser ? C.red : C.textDim,
        }}>Sem auth</button>
        {USERS.map(function(u) {
          var isSel = selectedUser && selectedUser.id === u.id;
          return (
            <button key={u.id} onClick={function() { setSelectedUser(u); }} style={{
              padding: "8px 14px", borderRadius: "8px", fontSize: "10px",
              fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
              border: "1px solid " + (isSel ? C.cyan : C.border),
              background: isSel ? C.cyan + "12" : "transparent",
              color: isSel ? C.cyan : C.textDim,
            }}>
              <div>{u.nome.split(" (")[0]}</div>
              <div style={{ fontSize: "8px", opacity: 0.7 }}>{u.cargo} (N{u.nivel})</div>
            </button>
          );
        })}
      </div>

      {/* Run all tests */}
      <button onClick={onRunTests} style={{
        padding: "10px 24px", borderRadius: "8px", border: "none",
        background: C.purple, color: "#fff", fontSize: "12px",
        fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
        marginBottom: "16px",
      }}>
        Testar todas as {TOOLS.length} tools
      </button>

      {/* Results */}
      {testResults.length > 0 && (
        <div style={{
          background: C.surface, border: "1px solid " + C.border,
          borderRadius: "10px", overflow: "hidden",
        }}>
          {testResults.map(function(r, i) {
            var statusColor = r.code === "OK" ? C.green : r.code === "RATE_LIMITED" ? C.amber : C.red;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", fontSize: "11px",
                borderBottom: i < testResults.length - 1 ? "1px solid " + C.border : "none",
                background: r.allowed ? "transparent" : C.red + "04",
              }}>
                <span style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: statusColor, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: "7px", fontWeight: 800, padding: "2px 4px", borderRadius: "3px",
                  background: (CATEGORY_COLORS[r.category] || C.textDim) + "15",
                  color: CATEGORY_COLORS[r.category] || C.textDim,
                  flexShrink: 0,
                }}>{CATEGORY_LABELS[r.category]}</span>
                <span style={{ fontWeight: 600, color: r.allowed ? C.text : C.red, minWidth: "140px" }}>{r.tool}</span>
                <span style={{ color: C.textDim, flex: 1, fontSize: "10px" }}>
                  {r.allowed ? (
                    <span>
                      <span style={{ color: C.green }}>PERMITIDO</span>
                      {r.filter && <span style={{ color: C.amber, marginLeft: "6px" }}>+ filtro owner</span>}
                      {r.rateRemaining !== undefined && <span style={{ color: C.textDim, marginLeft: "6px" }}>{r.rateRemaining} restantes/min</span>}
                    </span>
                  ) : (
                    <span style={{ color: C.red }}>{r.reason}</span>
                  )}
                </span>
                <span style={{
                  fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                  background: statusColor + "15", color: statusColor,
                }}>{r.code}</span>
              </div>
            );
          })}

          {/* Summary */}
          <div style={{
            padding: "10px 14px", background: C.surfaceAlt,
            display: "flex", gap: "16px", fontSize: "11px",
          }}>
            <span style={{ color: C.green, fontWeight: 700 }}>
              {testResults.filter(function(r) { return r.allowed; }).length} permitidas
            </span>
            <span style={{ color: C.red, fontWeight: 700 }}>
              {testResults.filter(function(r) { return !r.allowed; }).length} bloqueadas
            </span>
            {selectedUser && (
              <span style={{ color: C.textDim }}>
                {"Usuario: " + selectedUser.nome + " (nivel " + selectedUser.nivel + ")"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MCPSecurityLab() {
  var [activeTab, setActiveTab] = useState("tester");
  var [selectedUser, setSelectedUser] = useState(USERS[2]); // Felipe vendedor
  var [testResults, setTestResults] = useState([]);
  var [, forceUpdate] = useState(0);

  var runAllTests = useCallback(function() {
    var results = TOOLS.map(function(tool) {
      var access = checkAccess(selectedUser, tool.name);
      logCall(selectedUser, tool.name, access);
      return {
        tool: tool.name,
        category: tool.category,
        allowed: access.allowed,
        code: access.code,
        reason: access.reason,
        filter: access.filter,
        rateRemaining: access.rateRemaining,
        visibleFields: access.visibleFields,
        blockedFields: access.blockedFields,
      };
    });
    setTestResults(results);
    forceUpdate(function(n) { return n + 1; });
  }, [selectedUser]);

  var runRateLimitTest = useCallback(function() {
    if (!selectedUser) return;
    var results = [];
    for (var i = 0; i < 25; i++) {
      var access = checkAccess(selectedUser, "buscar_cliente");
      logCall(selectedUser, "buscar_cliente", access);
      results.push({
        call: i + 1,
        allowed: access.allowed,
        code: access.code,
        rateRemaining: access.rateRemaining,
        retryAfter: access.retryAfter,
      });
    }
    setTestResults(results.map(function(r) {
      return {
        tool: "buscar_cliente (#" + r.call + ")",
        category: "read",
        allowed: r.allowed,
        code: r.code,
        reason: r.allowed ? null : "Call " + r.call + "/25 - rate limit excedido",
        rateRemaining: r.rateRemaining,
      };
    }));
    forceUpdate(function(n) { return n + 1; });
  }, [selectedUser]);

  var resetRateLimits = useCallback(function() {
    rateCounts = {};
    setTestResults([]);
    forceUpdate(function(n) { return n + 1; });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.red, padding: "4px 10px", borderRadius: "4px",
            background: C.red + "12", border: "1px solid " + C.red + "33",
          }}>Cap 3 - Modulo 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Seguranca e Governanca MCP
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Auth | RBAC | Rate Limiting | Auditoria | Sanitizacao de dados
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "tester", label: "Testar Acesso" },
            { id: "matrix", label: "Matriz RBAC" },
            { id: "ratelimit", label: "Rate Limiting" },
            { id: "audit", label: "Audit Log (" + auditLog.length + ")" },
            { id: "guide", label: "Guia" },
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

        {/* TESTER TAB */}
        {activeTab === "tester" && (
          <SecurityTester
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            testResults={testResults}
            onRunTests={runAllTests}
          />
        )}

        {/* MATRIX TAB */}
        {activeTab === "matrix" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Matriz de permissoes por nivel de acesso. Os mesmos 5 niveis do Costa Lima Express.
            </p>
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px", overflow: "hidden" }}>
              <AccessMatrix />
            </div>
            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.8,
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>{"\u2713"}</span> = acesso total | 
              <span style={{ color: C.green, fontWeight: 700 }}>{"\u2713"}</span> <span style={{ color: C.amber }}>own only</span> = ve apenas seus registros | 
              <span style={{ color: C.red, fontWeight: 700 }}>{"\u2717"}</span> = bloqueado | 
              <span style={{ color: C.green }}>READ</span> = leitura | 
              <span style={{ color: C.amber }}>WRITE</span> = escrita | 
              <span style={{ color: C.red }}>DANGEROUS</span> = critico
            </div>
          </div>
        )}

        {/* RATE LIMIT TAB */}
        {activeTab === "ratelimit" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Simula 25 chamadas consecutivas a buscar_cliente (limite: 20/min). Observe onde o rate limit bloqueia.
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button onClick={runRateLimitTest} disabled={!selectedUser} style={{
                padding: "10px 24px", borderRadius: "8px", border: "none",
                background: selectedUser ? C.amber : C.surfaceAlt,
                color: selectedUser ? "#fff" : C.textDim, fontSize: "12px",
                fontWeight: 700, fontFamily: "inherit",
                cursor: selectedUser ? "pointer" : "default",
              }}>
                Disparar 25 chamadas
              </button>
              <button onClick={resetRateLimits} style={{
                padding: "10px 16px", borderRadius: "8px",
                border: "1px solid " + C.border, background: "transparent",
                color: C.textMuted, fontSize: "11px", fontFamily: "inherit", cursor: "pointer",
              }}>
                Reset contadores
              </button>
            </div>

            {!selectedUser && (
              <div style={{ padding: "20px", background: C.surface, borderRadius: "10px", border: "1px solid " + C.border, color: C.textDim, fontSize: "12px" }}>
                Selecione um usuario primeiro na aba "Testar Acesso"
              </div>
            )}

            {testResults.length > 0 && testResults[0].tool.includes("#") && (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                {testResults.map(function(r, i) {
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "6px 14px", fontSize: "10px",
                      borderBottom: i < testResults.length - 1 ? "1px solid " + C.border : "none",
                      background: r.allowed ? "transparent" : C.red + "06",
                    }}>
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: r.allowed ? C.green : C.red, flexShrink: 0,
                      }} />
                      <span style={{ color: r.allowed ? C.textMuted : C.red, fontWeight: 600 }}>{r.tool}</span>
                      <span style={{ color: C.textDim, flex: 1 }}>
                        {r.allowed ? "Restam: " + r.rateRemaining + "/min" : r.reason}
                      </span>
                      <span style={{
                        fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                        background: (r.allowed ? C.green : C.red) + "15",
                        color: r.allowed ? C.green : C.red,
                      }}>{r.code}</span>
                    </div>
                  );
                })}
                <div style={{ padding: "10px 14px", background: C.surfaceAlt, fontSize: "11px" }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>
                    {testResults.filter(function(r) { return r.allowed; }).length} permitidas
                  </span>
                  {" | "}
                  <span style={{ color: C.red, fontWeight: 700 }}>
                    {testResults.filter(function(r) { return !r.allowed; }).length} bloqueadas por rate limit
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Registro completo de todas as tool calls. Em producao, isso vai pro banco (MCPCallLog).
            </p>
            {auditLog.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: C.textDim, fontSize: "12px", background: C.surface, borderRadius: "10px", border: "1px solid " + C.border }}>
                Nenhum log ainda. Execute testes nas outras abas.
              </div>
            ) : (
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "70px 50px 130px 140px 70px",
                  padding: "8px 14px", borderBottom: "1px solid " + C.border,
                  fontSize: "9px", fontWeight: 700, color: C.textDim, letterSpacing: "0.5px",
                }}>
                  <div>ID</div>
                  <div>HORA</div>
                  <div>USUARIO</div>
                  <div>TOOL</div>
                  <div>STATUS</div>
                </div>
                {auditLog.slice(0, 20).map(function(entry, i) {
                  var statusColor = entry.code === "OK" ? C.green : entry.code === "RATE_LIMITED" ? C.amber : C.red;
                  return (
                    <div key={entry.id} style={{
                      display: "grid", gridTemplateColumns: "70px 50px 130px 140px 70px",
                      padding: "6px 14px", fontSize: "10px",
                      borderBottom: i < Math.min(auditLog.length, 20) - 1 ? "1px solid " + C.border : "none",
                      background: entry.allowed ? "transparent" : C.red + "04",
                    }}>
                      <div style={{ color: C.textDim }}>{entry.id}</div>
                      <div style={{ color: C.textDim }}>{entry.timestamp}</div>
                      <div style={{ color: C.textMuted }}>{entry.userName.split(" (")[0]} <span style={{ color: C.textDim, fontSize: "8px" }}>N{entry.userLevel}</span></div>
                      <div style={{ color: entry.allowed ? C.cyan : C.red, fontWeight: 600 }}>{entry.tool}</div>
                      <div><span style={{
                        fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                        background: statusColor + "15", color: statusColor,
                      }}>{entry.code}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "As 6 camadas de seguranca",
                color: C.red,
                text: "1. AUTENTICACAO: JWT token (mesmo do Express) identifica quem conectou\n2. AUTORIZACAO (RBAC): 5 niveis do Costa Lima controlam acesso por tool\n3. RATE LIMITING: maximo de calls por minuto por usuario (read: 20, write: 5)\n4. CLASSIFICACAO: tools categorizadas em read/write/dangerous\n5. SANITIZACAO: campos sensiveis (CPF, CNPJ, dados bancarios) nunca retornados\n6. AUDITORIA: toda tool call registrada em MCPCallLog",
              },
              {
                title: "Owner filtering - vendedor ve so seus dados",
                color: C.amber,
                text: "Quando ownerFilter=true e o usuario tem nivel < 4 (COORDENADOR), o MCP Server adiciona automaticamente { responsavelId: user.id } na query Prisma. Mesmo que o LLM peca 'todos os clientes', o vendedor so recebe os seus. Identico ao comportamento do Express: vendedor so ve seus leads.",
              },
              {
                title: "Confirmacao para tools de escrita",
                color: C.purple,
                text: "Tools write (criar_os, agendar_visita) primeiro retornam um PREVIEW do que vao fazer. O LLM mostra ao usuario. So executa se o usuario confirmar. Isso evita que o LLM crie registros errados autonomamente. Padrao: Human-in-the-Loop (HITL).",
              },
              {
                title: "Tools dangerous - nunca sem supervisao",
                color: C.red,
                text: "Tools como alterar_configuracoes, deletar_registro, executar_sql nao devem existir no MCP Server de producao. Se absolutamente necessarias: minLevel=5 (ADMIN), rate limit de 2/min, confirmacao dupla, log detalhado, e notificacao por email/Slack quando usadas.",
              },
              {
                title: "Integracao no Costa Lima",
                color: C.green,
                text: "O MCP Server reutiliza TUDO do Express:\n- Mesmo JWT_SECRET para validar tokens\n- Mesma tabela Usuario para RBAC\n- Mesmo schema Prisma\n- Mesmo banco PostgreSQL\n- Log em MCPCallLog (novo) seguindo padrao do ContaAzulSyncLog (existente)\n\nDiferenca: no Express, o middleware auth roda por rota. No MCP, roda por tool call. Mesma logica, mesmo resultado.",
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
