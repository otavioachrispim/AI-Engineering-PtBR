import { useState, useCallback, useRef, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// MOCK DATA
// ============================================================
var OBRAS = [
  { codigo: "OBR-034", cliente: "Carlos Mendes", status: "EM_ANDAMENTO", progresso: 35, valor: 85000, etapa: "Concretagem", prazo: "15/05", vip: true, atraso: false },
  { codigo: "OBR-045", cliente: "Marcos Oliveira", status: "EM_ANDAMENTO", progresso: 70, valor: 52000, etapa: "Revestimento", prazo: "28/03", vip: false, atraso: false },
  { codigo: "OBR-041", cliente: "Juliana Ferreira", status: "APROVADA", progresso: 0, valor: 32000, etapa: "Aguardando", prazo: "01/06", vip: false, atraso: false },
];

var METRICS = [
  { title: "Obras Ativas", value: "2", change: "+1", positive: true, icon: "\uD83C\uDFD7" },
  { title: "A Receber", value: "R$69k", change: "-12%", positive: false, icon: "\uD83D\uDCB0" },
  { title: "Leads Novos", value: "8", change: "+33%", positive: true, icon: "\uD83D\uDCCA" },
  { title: "OS Pendentes", value: "3", change: "0", positive: true, icon: "\uD83D\uDD27" },
];

var SUGGESTIONS = [
  { icon: "\u26A0", color: C.red, text: "Kit LED (1/3) e Aquec. Solar (2/2) abaixo do minimo", action: "Gerar pedido", page: "estoque" },
  { icon: "\u23F0", color: C.amber, text: "3 leads sem contato ha 7+ dias", action: "Ver leads", page: "leads" },
  { icon: "\u2705", color: C.green, text: "OBR-045 em 70%. Agendar vistoria pre-entrega?", action: "Agendar", page: "obras" },
  { icon: "\uD83D\uDCCA", color: C.purple, text: "Relatorio semanal pronto: 2 obras, R$137k em carteira", action: "Ver", page: "dashboard" },
];

// Semantic search index
var SEARCH_INDEX = [
  { type: "cliente", text: "Carlos Mendes - VIP - piscina 8x4 prainha", tags: ["carlos", "mendes", "vip", "prainha", "8x4"] },
  { type: "cliente", text: "Ana Paula Costa - manutencao recorrente", tags: ["ana", "paula", "manutencao", "recorrente"] },
  { type: "cliente", text: "Juliana Ferreira - condominio reforma", tags: ["juliana", "condominio", "reforma", "bomba"] },
  { type: "obra", text: "OBR-034: Piscina 8x4 Carlos - 35% concretagem", tags: ["obr-034", "piscina", "8x4", "concretagem", "carlos"] },
  { type: "obra", text: "OBR-045: Piscina 6x3 Marcos - 70% revestimento", tags: ["obr-045", "6x3", "revestimento", "marcos"] },
  { type: "produto", text: "Bomba centrifuga 1/2cv - R$1.250 - 8 un", tags: ["bomba", "centrifuga", "motor"] },
  { type: "produto", text: "Aquecimento solar 3m2 - R$3.200", tags: ["aquecimento", "solar", "aquecer", "temperatura"] },
  { type: "os", text: "OS-101: Troca bomba condominio - ALTA", tags: ["troca", "bomba", "condominio", "urgente"] },
  { type: "kb", text: "Garantia: estrutural 5 anos, equipamentos 2 anos", tags: ["garantia", "anos", "cobertura", "prazo"] },
  { type: "kb", text: "Procedimento vazamento: desligar bomba, testar 24h", tags: ["vazamento", "problema", "emergencia", "procedimento"] },
];

function searchSemantic(query) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });
  var synonyms = {
    "atrasada": ["prazo", "andamento"], "problema": ["emergencia", "urgente", "vazamento", "bomba"],
    "aquecer": ["aquecimento", "solar", "temperatura"], "limpar": ["manutencao", "filtro", "limpeza"],
  };
  return SEARCH_INDEX.map(function(item) {
    var score = 0;
    words.forEach(function(w) {
      item.tags.forEach(function(tag) { if (tag.includes(w) || w.includes(tag)) score += 3; });
      if (item.text.toLowerCase().includes(w)) score += 2;
      if (synonyms[w]) synonyms[w].forEach(function(syn) {
        item.tags.forEach(function(tag) { if (tag.includes(syn)) score += 2; });
      });
    });
    return { item: item, score: score };
  }).filter(function(r) { return r.score > 0; }).sort(function(a, b) { return b.score - a.score; }).slice(0, 5);
}

// Smart fill data
var SMART_FILL = {
  "Construcao": [
    { nome: "Piscina vinil", prob: 100 }, { nome: "Bomba centrifuga", prob: 95 },
    { nome: "Filtro quartzo", prob: 95 }, { nome: "Clorador", prob: 80 },
    { nome: "Prainha", prob: 65 }, { nome: "LED", prob: 55 }, { nome: "Aquecimento", prob: 40 },
  ],
  "Reforma": [
    { nome: "Troca vinil", prob: 85 }, { nome: "Rejunte", prob: 70 },
    { nome: "LED", prob: 50 }, { nome: "Troca bomba", prob: 40 },
  ],
  "Manutencao": [
    { nome: "Tratamento choque", prob: 90 }, { nome: "Limpeza geral", prob: 85 },
    { nome: "Troca filtro", prob: 40 }, { nome: "Verificacao bomba", prob: 35 },
  ],
};

// Chat responses
function getChatResponse(msg, context) {
  var lower = msg.toLowerCase();
  if (lower.includes("obra") && lower.includes("carlos")) return "OBR-034 (Carlos Mendes): 35% concluida, etapa Concretagem. Prazo: 15/05. Houve atraso de 5 dias em fevereiro (fornecedor cimento) mas ja foi resolvido. Cliente VIP.";
  if (lower.includes("estoque") || lower.includes("baixo")) return "2 itens abaixo do minimo:\n- Kit LED: 1/3 unidades (R$480/un)\n- Aquec. Solar: 2/2 unidades (R$3.200/un)\nRecomendo gerar pedido de compra.";
  if (lower.includes("agenda") || lower.includes("hoje")) return "Hoje (11/03):\n- 08:00 Concretagem OBR-034 (Joao, Pedro)\n- 14:00 Visita terreno Marcos (Felipe)\nAmanha:\n- 09:00 Troca bomba (Andre, Paulo)";
  if (lower.includes("financeiro") || lower.includes("receber")) return "Financeiro:\nA receber: R$69k\nA pagar: R$11k\nSaldo projetado: R$58k\nObras ativas: R$137k em carteira";
  if (lower.includes("garantia")) return "Garantia padrao Costa Lima:\n- Estrutural: 5 anos\n- Equipamentos: 2 anos\n- Vinil: 3 anos\n- Mao de obra: 1 ano\nCondicao: manutencao preventiva semestral.";
  if (context === "obras") return "Voce esta na pagina de obras. Posso ajudar com: status de obra especifica, agenda, materiais pendentes ou gerar relatorio.";
  return "Posso ajudar com: obras, estoque, agenda, financeiro, garantias ou gerar relatorios. O que precisa?";
}

// Dev productivity data
var DEV_METRICS = {
  scaffold: { manual: "2h", agent: "30s", saving: "98%", uses: 4 },
  refactor: { manual: "30min", agent: "1min", saving: "97%", uses: 7 },
  tests: { manual: "1h", agent: "1min", saving: "98%", uses: 12 },
  docs: { manual: "45min", agent: "1min", saving: "98%", uses: 3 },
  review: { manual: "30min", agent: "2min", saving: "93%", uses: 8 },
  total: { manual: "18h40min", agent: "38min", saving: "96.6%", tasks: 34 },
};

// ============================================================
// COMPONENTS
// ============================================================

var TYPE_COLORS = { cliente: C.blue, obra: C.green, produto: C.amber, os: C.red, kb: C.purple };
var TYPE_LABELS = { cliente: "CLI", obra: "OBR", produto: "PRD", os: "OS", kb: "KB" };

function MetricCard(props) {
  var m = props.metric;
  return (
    <div style={{
      flex: 1, minWidth: "100px", padding: "12px 10px",
      background: "#fff", borderRadius: "10px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "10px", color: "#94a3b8" }}>{m.title}</span>
        <span style={{ fontSize: "14px" }}>{m.icon}</span>
      </div>
      <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>{m.value}</div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: m.positive ? "#22c55e" : "#ef4444", marginTop: "2px" }}>
        {m.change} vs anterior
      </div>
    </div>
  );
}

function ObraRow(props) {
  var o = props.obra;
  var statusColors = { EM_ANDAMENTO: C.amber, CONCLUIDA: C.green, APROVADA: C.blue, PAUSADA: C.red };
  var sc = statusColors[o.status] || C.textDim;
  var pc = o.progresso < 30 ? "#ef4444" : o.progresso < 70 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 14px", fontSize: "12px",
      borderBottom: "1px solid #f1f5f9",
      fontFamily: "system-ui, sans-serif", color: "#1e293b",
    }}>
      <span style={{ fontWeight: 700, width: "65px", color: "#1e3a5f" }}>{o.codigo}</span>
      <span style={{ flex: 1 }}>
        {o.cliente}
        {o.vip && <span style={{ fontSize: "8px", marginLeft: "6px", color: "#f59e0b", fontWeight: 700 }}>VIP</span>}
      </span>
      <span style={{
        fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
        background: sc + "15", color: sc,
      }}>{o.status.replace("_", " ")}</span>
      <div style={{ width: "60px" }}>
        <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: o.progresso + "%", height: "100%", background: pc, borderRadius: "2px" }} />
        </div>
        <div style={{ fontSize: "9px", color: "#94a3b8", textAlign: "center", marginTop: "2px" }}>{o.progresso}%</div>
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a5f", width: "60px", textAlign: "right" }}>
        R${(o.valor / 1000).toFixed(0)}k
      </span>
    </div>
  );
}

function SearchOverlay(props) {
  var query = props.query;
  var setQuery = props.setQuery;
  var onClose = props.onClose;
  var results = query.length >= 2 ? searchSemantic(query) : [];

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      background: C.bg + "ee", padding: "20px", zIndex: 100,
      borderRadius: "10px", backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input value={query} onChange={function(e) { setQuery(e.target.value); }}
          placeholder="Busca semantica: 'problema com bomba', 'cliente prainha'..."
          autoFocus
          style={{
            flex: 1, padding: "12px 16px", borderRadius: "10px",
            border: "2px solid " + C.cyan, background: C.surface,
            color: C.text, fontSize: "13px", fontFamily: "inherit", outline: "none",
          }} />
        <button onClick={onClose} style={{
          padding: "12px 16px", borderRadius: "10px", border: "1px solid " + C.border,
          background: C.surface, color: C.textDim, fontSize: "12px",
          fontFamily: "inherit", cursor: "pointer",
        }}>ESC</button>
      </div>
      {results.length > 0 && (
        <div style={{ background: C.surface, borderRadius: "8px", border: "1px solid " + C.border, overflow: "hidden" }}>
          {results.map(function(r, i) {
            var tc = TYPE_COLORS[r.item.type] || C.textDim;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 14px", fontSize: "12px",
                borderBottom: i < results.length - 1 ? "1px solid " + C.border : "none",
                cursor: "pointer",
              }}>
                <span style={{
                  fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                  background: tc + "15", color: tc,
                }}>{TYPE_LABELS[r.item.type]}</span>
                <span style={{ color: C.text }}>{r.item.text}</span>
                <span style={{ color: C.textDim, fontSize: "9px", marginLeft: "auto" }}>score {r.score}</span>
              </div>
            );
          })}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: C.textDim, fontSize: "12px" }}>Nenhum resultado</div>
      )}
    </div>
  );
}

function ChatWidget(props) {
  var context = props.context;
  var messages = props.messages;
  var setMessages = props.setMessages;
  var chatInput = props.chatInput;
  var setChatInput = props.setChatInput;
  var chatRef = props.chatRef;

  var send = function() {
    if (!chatInput.trim()) return;
    var userMsg = { role: "user", text: chatInput };
    var response = getChatResponse(chatInput, context);
    var botMsg = { role: "bot", text: response };
    setMessages(messages.concat([userMsg, botMsg]));
    setChatInput("");
  };

  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "10px", overflow: "hidden", height: "100%",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid " + C.border,
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "10px", fontWeight: 700, color: C.cyan,
      }}>
        <span>{"\uD83E\uDD16"}</span> Copiloto
        <span style={{ fontSize: "8px", color: C.textDim, fontWeight: 400 }}>contexto: /{context}</span>
      </div>
      <div style={{ flex: 1, padding: "8px", overflowY: "auto", minHeight: "120px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px 8px", color: C.textDim, fontSize: "10px" }}>
            Pergunte sobre obras, estoque, agenda, financeiro...
          </div>
        )}
        {messages.map(function(msg, i) {
          return (
            <div key={i} style={{
              marginBottom: "6px", fontSize: "10px",
              textAlign: msg.role === "user" ? "right" : "left",
            }}>
              <div style={{
                display: "inline-block", maxWidth: "85%",
                padding: "6px 10px", borderRadius: "8px",
                background: msg.role === "user" ? C.blue + "18" : C.surfaceAlt,
                border: "1px solid " + (msg.role === "user" ? C.blue + "28" : C.border),
                color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap", textAlign: "left",
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatRef} />
      </div>
      <div style={{ padding: "6px", borderTop: "1px solid " + C.border, display: "flex", gap: "4px" }}>
        <input value={chatInput} onChange={function(e) { setChatInput(e.target.value); }}
          onKeyDown={function(e) { if (e.key === "Enter") send(); }}
          placeholder="Pergunte..."
          style={{
            flex: 1, padding: "8px 10px", borderRadius: "6px",
            border: "1px solid " + C.border, background: C.bg,
            color: C.text, fontSize: "10px", fontFamily: "inherit", outline: "none",
          }} />
        <button onClick={send} style={{
          padding: "8px 14px", borderRadius: "6px", border: "none",
          background: C.cyan, color: "#fff", fontSize: "10px",
          fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
        }}>Enviar</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function IntelligentDashboard() {
  var [activeTab, setActiveTab] = useState("dashboard");
  var [searchOpen, setSearchOpen] = useState(false);
  var [searchQuery, setSearchQuery] = useState("");
  var [chatMessages, setChatMessages] = useState([]);
  var [chatInput, setChatInput] = useState("");
  var [dismissedSuggestions, setDismissedSuggestions] = useState({});
  var [smartFillType, setSmartFillType] = useState("Construcao");
  var chatRef = useRef(null);

  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: "20px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Projeto Integrador - Cap 5</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Painel Inteligente Costa Lima
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Busca semantica | Smart Fill | Sugestoes | Chat contextual | Metricas dev
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "dashboard", label: "Dashboard Inteligente" },
            { id: "smartfill", label: "Smart Fill" },
            { id: "devmetrics", label: "Produtividade Dev" },
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

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div style={{ position: "relative" }}>
            {searchOpen && (
              <SearchOverlay query={searchQuery} setQuery={setSearchQuery} onClose={function() { setSearchOpen(false); setSearchQuery(""); }} />
            )}

            {/* Search bar */}
            <div onClick={function() { setSearchOpen(true); }} style={{
              padding: "10px 14px", borderRadius: "10px", marginBottom: "14px",
              background: C.surface, border: "1px solid " + C.border,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ color: C.textDim }}>{"\uD83D\uDD0D"}</span>
              <span style={{ color: C.textDim, fontSize: "12px" }}>Busca semantica: clientes, obras, produtos, OS, base de conhecimento...</span>
              <span style={{ marginLeft: "auto", fontSize: "9px", color: C.textDim, padding: "2px 6px", borderRadius: "4px", background: C.surfaceAlt }}>Ctrl+K</span>
            </div>

            {/* Suggestions banner */}
            {SUGGESTIONS.filter(function(_, i) { return !dismissedSuggestions[i]; }).length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                {SUGGESTIONS.map(function(s, i) {
                  if (dismissedSuggestions[i]) return null;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 12px", borderRadius: "8px", marginBottom: "4px",
                      background: s.color + "06", border: "1px solid " + s.color + "18",
                      fontSize: "11px",
                    }}>
                      <span>{s.icon}</span>
                      <span style={{ color: C.textMuted, flex: 1 }}>{s.text}</span>
                      <button style={{
                        padding: "3px 10px", borderRadius: "5px", border: "none",
                        background: s.color, color: "#fff", fontSize: "9px",
                        fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                      }}>{s.action}</button>
                      <button onClick={function() {
                        var nd = Object.assign({}, dismissedSuggestions); nd[i] = true; setDismissedSuggestions(nd);
                      }} style={{
                        background: "none", border: "none", color: C.textDim,
                        fontSize: "10px", cursor: "pointer", padding: "2px 4px",
                      }}>x</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main layout: dashboard + chat */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {/* Dashboard content */}
              <div style={{ flex: 1.5, minWidth: "400px" }}>
                {/* Metrics */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  {METRICS.map(function(m) { return <MetricCard key={m.title} metric={m} />; })}
                </div>

                {/* Obras table */}
                <div style={{
                  background: "#fff", borderRadius: "10px", overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9",
                }}>
                  <div style={{
                    padding: "10px 14px", borderBottom: "1px solid #f1f5f9",
                    fontSize: "12px", fontWeight: 700, color: "#1e3a5f",
                    fontFamily: "system-ui, sans-serif",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span>Obras</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 400 }}>{OBRAS.length} registros</span>
                  </div>
                  {OBRAS.map(function(o) { return <ObraRow key={o.codigo} obra={o} />; })}
                </div>
              </div>

              {/* Chat widget */}
              <div style={{ flex: 0.8, minWidth: "260px" }}>
                <ChatWidget
                  context="obras"
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatRef={chatRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* SMART FILL */}
        {activeTab === "smartfill" && (
          <div style={{
            background: C.surface, border: "1px solid " + C.border,
            borderRadius: "12px", padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.amber, margin: "0 0 6px" }}>
              Smart Fill — Orcamento Inteligente
            </h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Ao criar orcamento, itens sao pre-sugeridos com base no tipo de servico e historico. Selecione o tipo:
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {Object.keys(SMART_FILL).map(function(t) {
                return (
                  <button key={t} onClick={function() { setSmartFillType(t); }} style={{
                    flex: 1, padding: "10px", borderRadius: "8px", fontSize: "11px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                    border: "1px solid " + (smartFillType === t ? C.amber : C.border),
                    background: smartFillType === t ? C.amber + "12" : "transparent",
                    color: smartFillType === t ? C.amber : C.textDim,
                  }}>{t}</button>
                );
              })}
            </div>

            {/* Simulated form */}
            <div style={{ background: C.bg, borderRadius: "10px", padding: "16px", border: "1px solid " + C.border }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "10px", color: C.textDim, display: "block", marginBottom: "4px" }}>Cliente</label>
                <div style={{
                  padding: "8px 12px", borderRadius: "6px", border: "1px solid " + C.border,
                  background: C.surfaceAlt, color: C.text, fontSize: "12px",
                }}>Carlos Mendes - Volta Redonda</div>
              </div>

              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                ITENS SUGERIDOS (probabilidade baseada em {smartFillType === "Construcao" ? "47" : smartFillType === "Reforma" ? "23" : "65"} orcamentos anteriores)
              </div>
              {SMART_FILL[smartFillType].map(function(item) {
                var barColor = item.prob >= 80 ? C.green : item.prob >= 50 ? C.amber : C.textDim;
                return (
                  <div key={item.nome} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 0", borderBottom: "1px solid " + C.border,
                    fontSize: "12px",
                  }}>
                    <input type="checkbox" defaultChecked={item.prob >= 70} style={{ accentColor: C.cyan }} />
                    <span style={{ color: C.text, flex: 1 }}>{item.nome}</span>
                    <div style={{ width: "80px", height: "6px", background: C.surface, borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: item.prob + "%", height: "100%", background: barColor, borderRadius: "3px" }} />
                    </div>
                    <span style={{ color: barColor, fontWeight: 700, fontSize: "11px", width: "35px", textAlign: "right" }}>{item.prob}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEV METRICS */}
        {activeTab === "devmetrics" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Metricas de produtividade do desenvolvimento com agentes CLI (Cap 5, M3). Dados simulados para 1 mes de uso no Costa Lima.
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { label: "Tarefas automatizadas", value: DEV_METRICS.total.tasks, color: C.text },
                { label: "Tempo manual estimado", value: DEV_METRICS.total.manual, color: C.red },
                { label: "Tempo com agente", value: DEV_METRICS.total.agent, color: C.green },
                { label: "Economia", value: DEV_METRICS.total.saving, color: C.amber },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "100px", padding: "14px 10px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", overflow: "hidden",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "140px 1fr 70px 70px 50px 40px",
                padding: "8px 14px", borderBottom: "1px solid " + C.border,
                fontSize: "9px", fontWeight: 700, color: C.textDim,
              }}>
                <div>Tarefa</div><div>Barra</div><div>Manual</div><div>Agente</div><div>Econ.</div><div>Usos</div>
              </div>
              {[
                { name: "Scaffolding", key: "scaffold", color: C.green },
                { name: "Refatoracao", key: "refactor", color: C.amber },
                { name: "Testes", key: "tests", color: C.purple },
                { name: "Documentacao", key: "docs", color: C.orange },
                { name: "Code Review", key: "review", color: C.red },
              ].map(function(task) {
                var d = DEV_METRICS[task.key];
                return (
                  <div key={task.key} style={{
                    display: "grid", gridTemplateColumns: "140px 1fr 70px 70px 50px 40px",
                    padding: "10px 14px", fontSize: "11px", alignItems: "center",
                    borderBottom: "1px solid " + C.border,
                  }}>
                    <span style={{ color: task.color, fontWeight: 600 }}>{task.name}</span>
                    <div style={{ paddingRight: "10px" }}>
                      <div style={{ height: "6px", background: C.bg, borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: d.saving, height: "100%", background: task.color, borderRadius: "3px" }} />
                      </div>
                    </div>
                    <span style={{ color: C.red }}>{d.manual}</span>
                    <span style={{ color: C.green }}>{d.agent}</span>
                    <span style={{ color: C.amber, fontWeight: 700 }}>{d.saving}</span>
                    <span style={{ color: C.textDim }}>{d.uses}x</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ARCHITECTURE */}
        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.orange,
                text: "Cap 5 completo:\n\nM1 (AI UX): Cards de metricas e tabela de obras gerados com IA. Layout baseado em analise de uso (priorizar metricas + obras ativas no topo).\n\nM2 (Design-to-Code): Componentes funcionais (MetricCard, ObraRow) com design system consistente. Checklist aplicado: responsividade OK, estados OK.\n\nM3 (CLI Agents): Tab 'Produtividade Dev' mostra o impacto de agentes CLI no desenvolvimento. 34 tarefas automatizadas, economia de 96.6%.\n\nM4 (Features Inteligentes): Busca semantica global, Smart Fill no orcamento, sugestoes contextuais, chat embutido com contexto de pagina.",
              },
              {
                title: "5 features inteligentes em acao",
                color: C.cyan,
                text: "1. BUSCA SEMANTICA: Ctrl+K abre overlay. 'problema com bomba' encontra OS, produtos e procedimentos. Score de relevancia visivel.\n\n2. SUGESTOES CONTEXTUAIS: banner no topo com acoes baseadas no estado do sistema. Dispensavel com X. Cada sugestao tem trigger e pagina de origem.\n\n3. SMART FILL: wizard de orcamento pre-preenche itens por tipo de servico. Probabilidade baseada em orcamentos historicos.\n\n4. CHAT CONTEXTUAL: widget lateral que sabe em qual pagina voce esta. Pergunte sobre obras, estoque, agenda, financeiro.\n\n5. METRICAS INTELIGENTES: cards com variacao vs periodo anterior. Positivo (verde) ou negativo (vermelho).",
              },
              {
                title: "Experimentos recomendados",
                color: C.amber,
                text: 'DASHBOARD:\n1. Clique na barra de busca -> digite "problema com bomba" -> veja resultados semanticos\n2. Olhe as sugestoes no topo -> clique acao ou dispense com X\n3. No chat lateral: "obra do Carlos" -> resposta com dados reais\n4. No chat: "estoque baixo" -> alerta com itens e precos\n5. No chat: "garantia" -> consulta base de conhecimento\n\nSMART FILL:\n6. Alterne entre Construcao/Reforma/Manutencao -> observe itens e probabilidades mudarem\n\nPRODUTIVIDADE:\n7. Veja o impacto: 18h40 manual vs 38min com agente (34 tarefas)',
              },
              {
                title: "Implementacao no Costa Lima real",
                color: C.green,
                text: "BUSCA SEMANTICA:\n  Backend: pgvector (Neon PostgreSQL) para embeddings\n  Indexar: clientes, obras, OS, produtos, KB docs\n  Frontend: overlay Ctrl+K com debounce 300ms\n\nSUGESTOES:\n  Backend: cron job analisa estado (estoque, leads, prazos)\n  Frontend: array de sugestoes no context do dashboard\n  Persistencia: dispensados salvos em localStorage\n\nSMART FILL:\n  Backend: query orcamentos por tipo, calcular frequencia de itens\n  Frontend: checkboxes pre-marcados no wizard\n\nCHAT CONTEXTUAL:\n  Backend: MCP Server (Cap 3) + agent pipeline (Cap 4)\n  Frontend: widget fixo no canto, injeta URL/dados no context\n\nCLI AGENTS:\n  Claude Code para scaffold, refactor, testes\n  CI/CD: pre-commit hook com review automatico",
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
