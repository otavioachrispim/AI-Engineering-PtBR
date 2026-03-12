import { useState, useCallback, useRef, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// FEATURE 1: SEMANTIC SEARCH
// ============================================================
var SEARCH_INDEX = [
  { type: "cliente", text: "Carlos Mendes - Volta Redonda - VIP - piscina 8x4 com prainha", tags: ["carlos", "mendes", "vip", "prainha", "8x4", "volta redonda", "construcao"] },
  { type: "cliente", text: "Ana Paula Costa - Barra Mansa - manutencao recorrente", tags: ["ana", "paula", "barra mansa", "manutencao", "recorrente", "limpeza"] },
  { type: "cliente", text: "Juliana Ferreira - condominio - reforma grande", tags: ["juliana", "condominio", "reforma", "bomba", "emergencia"] },
  { type: "obra", text: "OBR-034: Piscina 8x4 vinil Carlos Mendes - 35% - concretagem", tags: ["obr-034", "piscina", "vinil", "8x4", "concretagem", "andamento", "carlos"] },
  { type: "obra", text: "OBR-045: Piscina 6x3 Marcos Oliveira - 70% - revestimento", tags: ["obr-045", "6x3", "revestimento", "marcos", "adiantada"] },
  { type: "obra", text: "OBR-041: Reforma condominio Juliana - aprovada - aguardando", tags: ["obr-041", "reforma", "condominio", "juliana", "aprovada"] },
  { type: "produto", text: "Bomba centrifuga 1/2cv - R$1.250 - 8 em estoque", tags: ["bomba", "centrifuga", "equipamento", "motor", "circulacao"] },
  { type: "produto", text: "Aquecimento solar 3m2 - R$3.200 - 2 em estoque (limite)", tags: ["aquecimento", "solar", "temperatura", "aquecer", "esquentar"] },
  { type: "produto", text: "Kit iluminacao LED - R$480 - 1 em estoque (BAIXO)", tags: ["led", "iluminacao", "luz", "noite", "decoracao"] },
  { type: "produto", text: "Filtro quartzo 19L - R$890 - 5 em estoque", tags: ["filtro", "quartzo", "filtragem", "agua", "limpeza"] },
  { type: "os", text: "OS-101: Troca bomba condominio - EM ANDAMENTO - alta", tags: ["troca", "bomba", "condominio", "urgente", "andamento"] },
  { type: "os", text: "OS-102: Instalacao iluminacao LED - PENDENTE - media", tags: ["instalacao", "led", "iluminacao", "pendente"] },
  { type: "kb", text: "Garantia: estrutural 5 anos, equipamentos 2 anos, vinil 3 anos", tags: ["garantia", "prazo", "cobertura", "anos", "estrutural"] },
  { type: "kb", text: "Procedimento vazamento: desligar bomba, verificar nivel 24h, teste estanqueidade", tags: ["vazamento", "infiltracao", "agua", "perda", "emergencia", "procedimento"] },
];

function semanticSearch(query) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w) { return w.length > 2; });

  var results = SEARCH_INDEX.map(function(item) {
    var score = 0;
    words.forEach(function(w) {
      // Direct tag match
      item.tags.forEach(function(tag) {
        if (tag.includes(w) || w.includes(tag)) score += 3;
      });
      // Text match
      if (item.text.toLowerCase().includes(w)) score += 2;
      // Semantic expansions
      var synonyms = {
        "atrasada": ["andamento", "prazo"], "atrasado": ["andamento", "prazo"],
        "problema": ["emergencia", "urgente", "vazamento", "bomba"],
        "aquecer": ["aquecimento", "solar", "temperatura"],
        "iluminar": ["led", "iluminacao", "luz"],
        "limpar": ["limpeza", "manutencao", "filtro", "tratamento"],
        "barata": ["preco", "custo", "economico"],
        "perto": ["volta redonda", "barra mansa", "regiao"],
      };
      if (synonyms[w]) {
        synonyms[w].forEach(function(syn) {
          item.tags.forEach(function(tag) {
            if (tag.includes(syn)) score += 2;
          });
        });
      }
    });
    return { item: item, score: score };
  }).filter(function(r) { return r.score > 0; }).sort(function(a, b) { return b.score - a.score; }).slice(0, 6);

  return results;
}

// ============================================================
// FEATURE 2: SMART FILL
// ============================================================
var SMART_FILL_RULES = {
  "Construcao piscina": {
    items: [
      { nome: "Piscina vinil", prob: 100 },
      { nome: "Bomba centrifuga", prob: 95 },
      { nome: "Filtro quartzo", prob: 95 },
      { nome: "Clorador automatico", prob: 80 },
      { nome: "Prainha", prob: 65 },
      { nome: "Iluminacao LED", prob: 55 },
      { nome: "Aquecimento solar", prob: 40 },
    ],
    prazo: "45-60 dias",
    pagamento: "50% entrada + 3x",
  },
  "Reforma piscina": {
    items: [
      { nome: "Troca de vinil", prob: 85 },
      { nome: "Rejunte impermeavel", prob: 70 },
      { nome: "Iluminacao LED", prob: 50 },
      { nome: "Troca de bomba", prob: 40 },
      { nome: "Tratamento de superficie", prob: 35 },
    ],
    prazo: "15-20 dias",
    pagamento: "40% entrada + 2x",
  },
  "Manutencao": {
    items: [
      { nome: "Tratamento de choque", prob: 90 },
      { nome: "Limpeza geral", prob: 85 },
      { nome: "Troca de filtro", prob: 40 },
      { nome: "Verificacao de bomba", prob: 35 },
    ],
    prazo: "1-3 dias",
    pagamento: "A vista ou 2x",
  },
};

// ============================================================
// FEATURE 3: CONTEXTUAL SUGGESTIONS
// ============================================================
var SUGGESTIONS_DATA = [
  {
    trigger: "Orcamento aprovado",
    page: "/orcamentos/ORC-042",
    suggestion: "Criar obra automaticamente a partir deste orcamento?",
    action: "Criar obra OBR-046",
    priority: "alta",
    icon: "\uD83C\uDFD7",
    color: C.green,
  },
  {
    trigger: "Obra em 90% progresso",
    page: "/obras/OBR-045",
    suggestion: "Obra quase concluida! Agendar vistoria de entrega?",
    action: "Agendar vistoria",
    priority: "media",
    icon: "\u2705",
    color: C.blue,
  },
  {
    trigger: "Lead sem interacao 7 dias",
    page: "/leads",
    suggestion: "3 leads sem contato ha 7+ dias. Fazer follow-up?",
    action: "Ver leads inativos",
    priority: "media",
    icon: "\u23F0",
    color: C.amber,
  },
  {
    trigger: "Estoque abaixo do minimo",
    page: "/estoque",
    suggestion: "Kit LED (1/3) e Aquec. Solar (2/2) abaixo do minimo",
    action: "Gerar pedido de compra",
    priority: "alta",
    icon: "\u26A0",
    color: C.red,
  },
  {
    trigger: "Segunda-feira 8h",
    page: "/dashboard",
    suggestion: "Relatorio semanal disponivel. 2 obras ativas, R$69k a receber.",
    action: "Ver relatorio",
    priority: "baixa",
    icon: "\uD83D\uDCCA",
    color: C.purple,
  },
];

// ============================================================
// FEATURE 5: E2E TEST SCENARIOS
// ============================================================
var E2E_SCENARIOS = [
  {
    title: "Fluxo de criacao de orcamento",
    steps: [
      { action: "Navegar para /orcamentos", assert: "Lista de orcamentos visivel", status: "pass", ms: 850 },
      { action: "Clicar 'Novo Orcamento'", assert: "Wizard step 1 aberto", status: "pass", ms: 200 },
      { action: "Buscar cliente 'Carlos'", assert: "Carlos Mendes aparece na lista", status: "pass", ms: 450 },
      { action: "Selecionar Carlos Mendes", assert: "Cliente preenchido no form", status: "pass", ms: 150 },
      { action: "Clicar proximo (step 2)", assert: "Lista de itens visivel", status: "pass", ms: 300 },
      { action: "Adicionar Piscina vinil 8x4", assert: "Item adicionado, total atualizado", status: "pass", ms: 200 },
      { action: "Adicionar Prainha", assert: "2 itens, total = R$53.000", status: "pass", ms: 180 },
      { action: "Clicar proximo (step 3)", assert: "Condicoes de pagamento", status: "pass", ms: 250 },
      { action: "Selecionar 50% + 3x", assert: "Parcelas calculadas corretamente", status: "pass", ms: 150 },
      { action: "Clicar 'Enviar'", assert: "Orcamento criado com status ENVIADO", status: "pass", ms: 1200 },
      { action: "Verificar lista", assert: "ORC-XXX aparece no topo com status ENVIADO", status: "pass", ms: 600 },
    ],
    totalMs: 4530,
    result: "PASS",
  },
  {
    title: "OS no PWA mobile",
    steps: [
      { action: "Abrir PWA /tarefas", assert: "Lista de OS do usuario", status: "pass", ms: 1200 },
      { action: "Clicar 'Nova OS'", assert: "Formulario mobile aberto", status: "pass", ms: 300 },
      { action: "Tirar foto (mock camera)", assert: "Preview da foto visivel", status: "pass", ms: 800 },
      { action: "Digitar descricao", assert: "Campo preenchido", status: "pass", ms: 100 },
      { action: "Selecionar prioridade Alta", assert: "Botao Alta destacado", status: "pass", ms: 100 },
      { action: "Clicar 'Criar OS'", assert: "Loading spinner, depois sucesso", status: "pass", ms: 1500 },
      { action: "Verificar lista", assert: "Nova OS no topo com foto", status: "pass", ms: 600 },
    ],
    totalMs: 4600,
    result: "PASS",
  },
  {
    title: "Busca semantica global",
    steps: [
      { action: "Clicar na barra de busca", assert: "Input focado, sugestoes recentes", status: "pass", ms: 200 },
      { action: "Digitar 'problema com bomba'", assert: "Resultados aparecem em <500ms", status: "pass", ms: 450 },
      { action: "Verificar resultados", assert: "OS-101 (troca bomba) no topo", status: "pass", ms: 100 },
      { action: "Verificar resultados", assert: "Bomba centrifuga (produto) listada", status: "pass", ms: 100 },
      { action: "Verificar resultados", assert: "Procedimento vazamento (KB) listado", status: "pass", ms: 100 },
      { action: "Clicar no resultado OS-101", assert: "Navega para detalhe da OS", status: "pass", ms: 400 },
    ],
    totalMs: 1350,
    result: "PASS",
  },
  {
    title: "Fluxo com token expirado",
    steps: [
      { action: "Navegar para /obras", assert: "Lista carregada", status: "pass", ms: 800 },
      { action: "Aguardar token expirar (mock)", assert: "Token JWT expirado", status: "info", ms: 100 },
      { action: "Clicar em OBR-034", assert: "GET /api/obras/obr_001 -> 401", status: "fail", ms: 200 },
      { action: "Interceptor tenta refresh", assert: "POST /api/auth/refresh -> 200", status: "pass", ms: 300 },
      { action: "Request original re-executado", assert: "Detalhe da obra carregado", status: "pass", ms: 400 },
    ],
    totalMs: 1800,
    result: "PASS (com recovery)",
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function SemanticSearchDemo() {
  var [query, setQuery] = useState("");
  var [results, setResults] = useState([]);

  var doSearch = useCallback(function(q) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setResults(semanticSearch(q));
  }, []);

  var typeColors = { cliente: C.blue, obra: C.green, produto: C.amber, os: C.red, kb: C.purple };
  var typeLabels = { cliente: "Cliente", obra: "Obra", produto: "Produto", os: "OS", kb: "Base Conhecimento" };

  var examples = ["problema com bomba", "cliente da prainha", "equipamento para aquecer", "obras atrasadas", "garantia estrutural"];

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <input value={query} onChange={function(e) { doSearch(e.target.value); }}
          placeholder="Busque qualquer coisa..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px",
            border: "1px solid " + C.border, background: C.surfaceAlt,
            color: C.text, fontSize: "12px", fontFamily: "inherit", outline: "none",
          }} />
      </div>
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
        {examples.map(function(ex) {
          return (
            <button key={ex} onClick={function() { doSearch(ex); }} style={{
              padding: "4px 8px", borderRadius: "5px", fontSize: "9px",
              border: "1px solid " + C.border, background: "transparent",
              color: C.textMuted, fontFamily: "inherit", cursor: "pointer",
            }}>{ex}</button>
          );
        })}
      </div>
      {results.length > 0 && (
        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "8px", overflow: "hidden" }}>
          {results.map(function(r, i) {
            var tc = typeColors[r.item.type] || C.textDim;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", fontSize: "11px",
                borderBottom: i < results.length - 1 ? "1px solid " + C.border : "none",
              }}>
                <span style={{
                  fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                  background: tc + "15", color: tc, flexShrink: 0,
                }}>{typeLabels[r.item.type]}</span>
                <span style={{ color: C.text, flex: 1 }}>{r.item.text}</span>
                <span style={{ color: C.textDim, fontSize: "9px" }}>score: {r.score}</span>
              </div>
            );
          })}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <div style={{ padding: "16px", textAlign: "center", color: C.textDim, fontSize: "11px" }}>
          Nenhum resultado para "{query}"
        </div>
      )}
    </div>
  );
}

function SmartFillDemo() {
  var [tipo, setTipo] = useState("Construcao piscina");
  var data = SMART_FILL_RULES[tipo];

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {Object.keys(SMART_FILL_RULES).map(function(t) {
          return (
            <button key={t} onClick={function() { setTipo(t); }} style={{
              flex: 1, padding: "8px", borderRadius: "8px", fontSize: "10px",
              fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
              border: "1px solid " + (tipo === t ? C.cyan : C.border),
              background: tipo === t ? C.cyan + "12" : "transparent",
              color: tipo === t ? C.cyan : C.textDim,
            }}>{t}</button>
          );
        })}
      </div>
      {data && (
        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>ITENS SUGERIDOS (baseado em orcamentos anteriores)</div>
          {data.items.map(function(item) {
            var barColor = item.prob >= 80 ? C.green : item.prob >= 50 ? C.amber : C.textDim;
            return (
              <div key={item.nome} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 0", fontSize: "11px",
              }}>
                <input type="checkbox" defaultChecked={item.prob >= 70} style={{ accentColor: C.cyan }} />
                <span style={{ color: C.text, flex: 1 }}>{item.nome}</span>
                <div style={{ width: "60px", height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: item.prob + "%", height: "100%", background: barColor, borderRadius: "2px" }} />
                </div>
                <span style={{ color: barColor, fontWeight: 700, fontSize: "10px", width: "30px", textAlign: "right" }}>{item.prob}%</span>
              </div>
            );
          })}
          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid " + C.border, display: "flex", gap: "20px", fontSize: "10px" }}>
            <span style={{ color: C.textDim }}>Prazo sugerido: <span style={{ color: C.amber, fontWeight: 700 }}>{data.prazo}</span></span>
            <span style={{ color: C.textDim }}>Pagamento: <span style={{ color: C.cyan, fontWeight: 700 }}>{data.pagamento}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionsDemo() {
  var [dismissed, setDismissed] = useState({});

  return (
    <div>
      {SUGGESTIONS_DATA.map(function(s, i) {
        if (dismissed[i]) return null;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "8px", marginBottom: "6px",
            background: s.color + "08", border: "1px solid " + s.color + "22",
          }}>
            <span style={{ fontSize: "16px" }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: C.text, fontWeight: 600, marginBottom: "2px" }}>{s.suggestion}</div>
              <div style={{ fontSize: "9px", color: C.textDim }}>
                Trigger: {s.trigger} | Pagina: {s.page}
              </div>
            </div>
            <button style={{
              padding: "5px 12px", borderRadius: "6px", border: "none",
              background: s.color, color: "#fff", fontSize: "10px",
              fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}>{s.action}</button>
            <button onClick={function() {
              var nd = Object.assign({}, dismissed);
              nd[i] = true;
              setDismissed(nd);
            }} style={{
              padding: "5px 8px", borderRadius: "6px",
              border: "1px solid " + C.border, background: "transparent",
              color: C.textDim, fontSize: "10px", fontFamily: "inherit", cursor: "pointer",
            }}>X</button>
          </div>
        );
      })}
    </div>
  );
}

function E2ETestDemo() {
  var [selectedTest, setSelectedTest] = useState(0);
  var [visibleSteps, setVisibleSteps] = useState(99);
  var [playing, setPlaying] = useState(false);

  var test = E2E_SCENARIOS[selectedTest];

  var playTest = useCallback(function(idx) {
    setSelectedTest(idx);
    setVisibleSteps(0);
    setPlaying(true);
    var t = E2E_SCENARIOS[idx];
    t.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
        if (i === t.steps.length - 1) setPlaying(false);
      }, (i + 1) * 400);
    });
  }, []);

  var statusColors = { pass: C.green, fail: C.red, info: C.amber };

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
        {E2E_SCENARIOS.map(function(t, i) {
          var isSel = selectedTest === i;
          return (
            <button key={i} onClick={function() { playTest(i); }} disabled={playing} style={{
              flex: 1, minWidth: "140px", padding: "8px 10px", borderRadius: "8px",
              fontSize: "10px", fontFamily: "inherit", cursor: playing ? "default" : "pointer",
              border: "1px solid " + (isSel ? C.blue : C.border),
              background: isSel ? C.blue + "10" : "transparent",
              color: isSel ? C.blue : C.textDim, fontWeight: isSel ? 700 : 400,
              textAlign: "left",
            }}>
              <div>{t.title}</div>
              <div style={{ fontSize: "8px", opacity: 0.7 }}>{t.steps.length} steps | {t.result}</div>
            </button>
          );
        })}
      </div>

      <div style={{
        background: "#0a0e14", borderRadius: "10px", border: "1px solid " + C.border,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "8px 14px", background: "#111827",
          borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "10px",
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green }} />
          <span style={{ color: C.textDim }}>Playwright</span>
          <span style={{ color: C.textMuted, marginLeft: "auto" }}>{test.title}</span>
        </div>
        <div style={{ padding: "10px 14px", maxHeight: "300px", overflowY: "auto" }}>
          {test.steps.map(function(step, i) {
            if (i >= visibleSteps) return null;
            var sc = statusColors[step.status] || C.textDim;
            var icon = step.status === "pass" ? "\u2713" : step.status === "fail" ? "\u2717" : "\u25CF";
            return (
              <div key={i} style={{
                display: "flex", gap: "8px", marginBottom: "4px", fontSize: "10px",
                opacity: i === visibleSteps - 1 && playing ? 1 : 0.9,
              }}>
                <span style={{ color: sc, fontWeight: 700, width: "12px" }}>{icon}</span>
                <span style={{ color: C.textMuted, flex: 1 }}>{step.action}</span>
                <span style={{ color: C.textDim, fontSize: "9px" }}>{step.ms}ms</span>
              </div>
            );
          })}
          {playing && visibleSteps < test.steps.length && (
            <div style={{ color: C.amber, fontSize: "10px", marginTop: "4px" }}>Executando...</div>
          )}
        </div>
        {!playing && visibleSteps >= test.steps.length && (
          <div style={{
            padding: "8px 14px", background: "#111827",
            borderTop: "1px solid " + C.border,
            display: "flex", gap: "12px", fontSize: "10px",
          }}>
            <span style={{ color: test.result.includes("PASS") ? C.green : C.red, fontWeight: 700 }}>{test.result}</span>
            <span style={{ color: C.textDim }}>{test.steps.length} steps</span>
            <span style={{ color: C.textDim }}>{test.totalMs}ms</span>
            <span style={{ color: C.green }}>{test.steps.filter(function(s) { return s.status === "pass"; }).length} passed</span>
            {test.steps.filter(function(s) { return s.status === "fail"; }).length > 0 && (
              <span style={{ color: C.red }}>{test.steps.filter(function(s) { return s.status === "fail"; }).length} failed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function IntelligentFeaturesLab() {
  var [activeTab, setActiveTab] = useState("search");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.blue, padding: "4px 10px", borderRadius: "4px",
            background: C.blue + "12", border: "1px solid " + C.blue + "33",
          }}>Cap 5 - Modulo 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Logica Inteligente e Testes E2E
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Busca semantica | Smart Fill | Sugestoes | Testes automatizados
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "search", label: "Busca Semantica" },
            { id: "smartfill", label: "Smart Fill" },
            { id: "suggestions", label: "Sugestoes" },
            { id: "e2e", label: "Testes E2E" },
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

        {/* SEARCH */}
        {activeTab === "search" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.cyan, margin: "0 0 6px" }}>Busca Semantica Global</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Busca por significado, nao so por palavras exatas. "problema com bomba" encontra OS, produtos e procedimentos relacionados. Clique nos exemplos.
            </p>
            <SemanticSearchDemo />
          </div>
        )}

        {/* SMART FILL */}
        {activeTab === "smartfill" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.amber, margin: "0 0 6px" }}>Smart Fill - Preenchimento Inteligente</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Ao criar orcamento, o sistema sugere itens baseado no tipo de servico e historico de orcamentos anteriores. Selecione o tipo e veja as sugestoes com probabilidade.
            </p>
            <SmartFillDemo />
          </div>
        )}

        {/* SUGGESTIONS */}
        {activeTab === "suggestions" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 6px" }}>Sugestoes Contextuais</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              O sistema sugere acoes baseado no contexto: orcamento aprovado sugere criar obra, estoque baixo sugere pedido, lead inativo sugere follow-up. Cada sugestao tem botao de acao e pode ser dispensada.
            </p>
            <SuggestionsDemo />
          </div>
        )}

        {/* E2E */}
        {activeTab === "e2e" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.purple, margin: "0 0 6px" }}>Testes E2E Assistidos por IA</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Cenarios de teste gerados por IA e executados com Playwright. Cada cenario testa um fluxo completo do ponto de vista do usuario. Clique para reproduzir.
            </p>
            <E2ETestDemo />
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Features inteligentes que o usuario nem percebe",
                color: C.cyan,
                text: "As melhores features de IA sao invisiveis:\n\n1. BUSCA SEMANTICA: 'problema com bomba' encontra OS, produtos e procedimentos\n2. SMART FILL: ao criar orcamento, itens sugeridos com probabilidade\n3. SUGESTOES: proxima acao baseada no contexto da pagina\n4. PERSONALIZACAO: dashboard se adapta ao perfil de uso\n5. CHAT CONTEXTUAL: widget que entende a pagina atual\n\nO usuario sente que o sistema e 'esperto', sem saber que tem IA.",
              },
              {
                title: "Seguranca no front-end com IA",
                color: C.red,
                text: "1. API key NUNCA no frontend (chame via Express)\n2. Sanitize inputs do usuario (evitar prompt injection)\n3. RBAC no backend antes de enviar dados pro LLM\n4. Nao use output de IA para decisoes de seguranca\n5. Chat contextual recebe so dados que o usuario tem permissao de ver\n\nIA e para sugestoes e automacao. Autorizacao e autenticacao continuam no backend.",
              },
              {
                title: "Testes E2E com IA - 3 camadas",
                color: C.purple,
                text: "CAMADA 1: GERACAO DE CENARIOS\n  Descreva o fluxo em texto -> IA gera codigo Playwright/Cypress\n  Economia: ~70% do tempo de escrita de testes\n\nCAMADA 2: DADOS DE TESTE\n  IA gera dados realistas (nomes BR, telefones validos, enderecos RJ)\n  Encontra bugs que dados genericos nao encontram\n\nCAMADA 3: ANALISE DE FALHAS\n  Teste falhou -> IA analisa screenshot + console + network\n  Diagnostico: 'Token expirou entre step 1 e 5, refresh nao funcionou'",
              },
              {
                title: "Implementacao no Costa Lima",
                color: C.green,
                text: "BUSCA SEMANTICA:\n  Backend: pgvector no Neon PostgreSQL para embeddings\n  Frontend: barra de busca global no admin header\n  Indexar: clientes, obras, OS, produtos, KB\n\nSMART FILL:\n  Backend: analise de orcamentos anteriores por tipo\n  Frontend: checkboxes pre-marcados no wizard de orcamento\n\nSUGESTOES:\n  Backend: cron job analisa estado do sistema\n  Frontend: banner no topo da pagina relevante\n\nTESTES E2E:\n  Playwright + IA para gerar cenarios\n  CI/CD: rodar antes de merge (ja tem Vitest, adicionar E2E)",
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
