import { useState } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// DESIGN-TO-CODE EXAMPLES
// ============================================================
var EXAMPLES = [
  {
    id: "login",
    title: "Tela de Login",
    category: "Pagina",
    desc: "Tela de login do Costa Lima admin",
    prompt: 'Login para Costa Lima Piscinas: logo centralizado, form com email/senha, botao azul #1e3a5f, link "esqueci senha", mobile-first, shadcn Input/Button.',
    review: {
      responsividade: { score: 90, notes: "Funciona de 320px a 1920px. Form centralizado com max-width." },
      estados: { score: 70, notes: "Falta loading state no botao. Falta error state para credenciais invalidas." },
      acessibilidade: { score: 60, notes: "Labels visiveis OK. Falta focus ring customizado. Falta aria-live para erros." },
      designSystem: { score: 85, notes: "Cores corretas. Usa shadcn Input. Poderia usar CSS variables em vez de hex." },
    },
  },
  {
    id: "kanban",
    title: "Kanban de Leads",
    category: "Feature",
    desc: "Board kanban com drag-and-drop para gestao de leads",
    prompt: "Kanban de leads com 5 colunas (Novo, Contato, Visita, Proposta, Fechado). Cada card mostra nome, origem, valor estimado e score. Drag and drop entre colunas. Cores por score (verde=quente, amarelo=morno, azul=frio). Mobile: scroll horizontal.",
    review: {
      responsividade: { score: 75, notes: "Desktop OK. Mobile precisa de snap scroll horizontal. Cards podem ficar apertados em 320px." },
      estados: { score: 55, notes: "Falta empty state por coluna. Falta skeleton durante drag. Falta confirmacao ao mover para Fechado." },
      acessibilidade: { score: 40, notes: "Drag-and-drop nao e acessivel por teclado. Falta aria-labels nas colunas. Screen reader nao anuncia mudancas." },
      designSystem: { score: 80, notes: "Cores do score consistentes. Spacing OK. Cards poderiam usar shadcn Card." },
    },
  },
  {
    id: "dashboard_card",
    title: "Card de Metricas",
    category: "Componente",
    desc: "Card de metrica para dashboard com variacao positiva/negativa",
    prompt: "Card de metrica: titulo, valor grande, variacao percentual (verde se positivo, vermelho se negativo), icone, sparkline mini-grafico. Compacto, max 200px largura. Sombra sutil.",
    review: {
      responsividade: { score: 95, notes: "Componente compacto, funciona em qualquer container. Texto escala bem." },
      estados: { score: 80, notes: "Loading com skeleton OK. Falta estado para dado indisponivel." },
      acessibilidade: { score: 70, notes: "Valores legiveis. Sparkline precisa de aria-label com tendencia. Cores de variacao precisam de icone alem de cor." },
      designSystem: { score: 90, notes: "Segue paleta. Sombra consistente. Tipografia na escala." },
    },
  },
  {
    id: "os_mobile",
    title: "Formulario OS Mobile",
    category: "PWA",
    desc: "Formulario de Ordem de Servico otimizado para campo",
    prompt: "Formulario mobile-first para criar OS em campo: botao camera grande no topo, campo descricao, 3 botoes de prioridade (touch-friendly 48px+), botao enviar verde. Dark mode, contraste alto para uso ao sol.",
    review: {
      responsividade: { score: 95, notes: "Mobile-first perfeito. Touch targets 48px+. Funciona em landscape tambem." },
      estados: { score: 85, notes: "Loading no envio OK. Camera fallback OK. Falta indicador de upload da foto." },
      acessibilidade: { score: 75, notes: "Botoes grandes e claros. Labels visiveis. Falta haptic feedback. Contraste excelente." },
      designSystem: { score: 70, notes: "Dark mode diverge do admin (light). Precisa alinhar com tema do PWA." },
    },
  },
  {
    id: "timeline",
    title: "Timeline de Obra",
    category: "Feature",
    desc: "Timeline vertical mostrando etapas da obra com progresso",
    prompt: "Timeline vertical de etapas de obra: cada no tem nome, data, status (concluido/em andamento/pendente), progresso %. Linha conectora entre nos. No atual destacado. Cores: verde concluido, azul em andamento, cinza pendente.",
    review: {
      responsividade: { score: 85, notes: "Vertical funciona em todas as telas. Em desktop muito largo, poderia ser horizontal." },
      estados: { score: 90, notes: "Tres estados visuais claros. Animacao no no atual. Empty state quando sem etapas." },
      acessibilidade: { score: 65, notes: "Visual claro. Falta role='list' semantico. Status depende so de cor (precisa icone)." },
      designSystem: { score: 85, notes: "Cores de status consistentes com resto do sistema. Spacing harmonioso." },
    },
  },
];

// ============================================================
// RENDERED COMPONENT PREVIEWS
// ============================================================

function LoginPreview() {
  return (
    <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "40px 20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: "24px", fontWeight: 800, color: "#1e3a5f", marginBottom: "4px" }}>Costa Lima</div>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "24px" }}>Piscinas</div>
      <div style={{ maxWidth: "280px", margin: "0 auto" }}>
        <input placeholder="Email" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
        <input type="password" placeholder="Senha" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "12px", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
        <button style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#1e3a5f", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Entrar</button>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px", cursor: "pointer" }}>Esqueci minha senha</div>
      </div>
    </div>
  );
}

function KanbanPreview() {
  var cols = [
    { name: "Novo", color: "#60a5fa", leads: [{ n: "Carlos M.", v: "85k", s: 92 }, { n: "Ana P.", v: "4.5k", s: 45 }] },
    { name: "Contato", color: "#a78bfa", leads: [{ n: "Roberto A.", v: "35k", s: 68 }] },
    { name: "Proposta", color: "#f59e0b", leads: [{ n: "Marcos O.", v: "52k", s: 78 }] },
    { name: "Fechado", color: "#22c55e", leads: [] },
  ];
  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px", fontFamily: "system-ui, sans-serif" }}>
      {cols.map(function(col) {
        return (
          <div key={col.name} style={{ minWidth: "140px", flex: 1, background: "#f1f5f9", borderRadius: "10px", padding: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: col.color, marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
              <span>{col.name}</span>
              <span style={{ background: col.color + "20", borderRadius: "10px", padding: "1px 6px", fontSize: "10px" }}>{col.leads.length}</span>
            </div>
            {col.leads.map(function(l, i) {
              var sc = l.s >= 80 ? "#22c55e" : l.s >= 60 ? "#f59e0b" : "#60a5fa";
              return (
                <div key={i} style={{ background: "#fff", borderRadius: "8px", padding: "8px", marginBottom: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontSize: "11px" }}>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.n}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ color: "#64748b" }}>R${l.v}</span>
                    <span style={{ color: sc, fontWeight: 700, fontSize: "10px" }}>{l.s}</span>
                  </div>
                </div>
              );
            })}
            {col.leads.length === 0 && (
              <div style={{ padding: "16px 8px", textAlign: "center", color: "#cbd5e1", fontSize: "10px" }}>Vazio</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCardPreview() {
  return (
    <div style={{ display: "flex", gap: "10px", fontFamily: "system-ui, sans-serif" }}>
      {[
        { title: "Obras Ativas", value: "3", change: "+1", positive: true, icon: "\uD83C\uDFD7" },
        { title: "A Receber", value: "R$69k", change: "-12%", positive: false, icon: "\uD83D\uDCB0" },
        { title: "Leads", value: "28", change: "+15%", positive: true, icon: "\uD83D\uDCCA" },
      ].map(function(m) {
        return (
          <div key={m.title} style={{
            flex: 1, background: "#fff", borderRadius: "10px", padding: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>{m.title}</span>
              <span style={{ fontSize: "14px" }}>{m.icon}</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>{m.value}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: m.positive ? "#22c55e" : "#ef4444", marginTop: "2px" }}>
              {m.change} vs mes anterior
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelinePreview() {
  var steps = [
    { name: "Escavacao", status: "done", pct: 100 },
    { name: "Ferragem", status: "done", pct: 100 },
    { name: "Concretagem", status: "active", pct: 35 },
    { name: "Revestimento", status: "pending", pct: 0 },
    { name: "Acabamento", status: "pending", pct: 0 },
  ];
  var colors = { done: "#22c55e", active: "#3b82f6", pending: "#94a3b8" };
  var icons = { done: "\u2713", active: "\u25CF", pending: "\u25CB" };
  return (
    <div style={{ padding: "12px", fontFamily: "system-ui, sans-serif" }}>
      {steps.map(function(s, i) {
        var c = colors[s.status];
        return (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < steps.length - 1 ? "0" : "0" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: c + "20", border: "2px solid " + c,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: 800, color: c,
              }}>{icons[s.status]}</div>
              {i < steps.length - 1 && <div style={{ width: "2px", height: "24px", background: i < steps.indexOf(steps.find(function(x) { return x.status !== "done"; })) ? "#22c55e" : "#e2e8f0" }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: s.status === "active" ? 700 : 500, color: s.status === "pending" ? "#94a3b8" : "#1e293b" }}>
                {s.name}
              </div>
              {s.status !== "pending" && (
                <div style={{ marginTop: "4px", height: "4px", background: "#f1f5f9", borderRadius: "2px", overflow: "hidden", width: "120px" }}>
                  <div style={{ width: s.pct + "%", height: "100%", background: c, borderRadius: "2px" }} />
                </div>
              )}
            </div>
            <span style={{ fontSize: "10px", color: c, fontWeight: 700 }}>{s.pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function OSMobilePreview() {
  return (
    <div style={{
      background: "#111827", borderRadius: "16px", padding: "16px",
      maxWidth: "260px", fontFamily: "system-ui, sans-serif", color: "#e5e7eb",
    }}>
      <div style={{ fontSize: "15px", fontWeight: 800, marginBottom: "12px", textAlign: "center" }}>Nova OS</div>
      <button style={{
        width: "100%", padding: "20px", borderRadius: "10px", border: "2px dashed #374151",
        background: "#1f2937", color: "#9ca3af", fontSize: "13px", textAlign: "center",
        cursor: "pointer", marginBottom: "10px", fontFamily: "inherit",
      }}>
        {"\uD83D\uDCF7"} Foto
      </button>
      <input placeholder="Descricao..." style={{
        width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #374151",
        background: "#1f2937", color: "#e5e7eb", fontSize: "13px", marginBottom: "8px",
        fontFamily: "inherit", boxSizing: "border-box",
      }} />
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {["Baixa", "Media", "Alta"].map(function(p, i) {
          var cls = [C.green, C.amber, C.red];
          return (
            <button key={p} style={{
              flex: 1, padding: "10px", borderRadius: "8px",
              border: i === 1 ? "2px solid " + cls[i] : "1px solid #374151",
              background: i === 1 ? cls[i] + "20" : "#1f2937",
              color: i === 1 ? cls[i] : "#9ca3af",
              fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{p}</button>
          );
        })}
      </div>
      <button style={{
        width: "100%", padding: "12px", borderRadius: "10px", border: "none",
        background: C.green, color: "#fff", fontSize: "14px", fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
      }}>Criar OS</button>
    </div>
  );
}

var PREVIEW_MAP = {
  login: LoginPreview,
  kanban: KanbanPreview,
  dashboard_card: MetricCardPreview,
  os_mobile: OSMobilePreview,
  timeline: TimelinePreview,
};

// ============================================================
// REVIEW CHECKLIST COMPONENT
// ============================================================
function ReviewChecklist(props) {
  var review = props.review;
  var categories = [
    { key: "responsividade", label: "Responsividade", icon: "\uD83D\uDCF1" },
    { key: "estados", label: "Estados (loading/error/empty)", icon: "\uD83D\uDD04" },
    { key: "acessibilidade", label: "Acessibilidade (WCAG)", icon: "\u267F" },
    { key: "designSystem", label: "Design System", icon: "\uD83C\uDFA8" },
  ];

  var totalScore = Math.round(categories.reduce(function(s, c) { return s + review[c.key].score; }, 0) / categories.length);
  var scoreColor = totalScore >= 80 ? C.green : totalScore >= 60 ? C.amber : C.red;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        marginBottom: "12px", padding: "10px 14px", borderRadius: "8px",
        background: scoreColor + "08", border: "1px solid " + scoreColor + "22",
      }}>
        <div style={{ fontSize: "24px", fontWeight: 800, color: scoreColor }}>{totalScore}</div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>Score de Producao</div>
          <div style={{ fontSize: "10px", color: C.textMuted }}>
            {totalScore >= 80 ? "Pronto com ajustes menores" : totalScore >= 60 ? "Precisa de revisao em areas especificas" : "Requer trabalho significativo antes de producao"}
          </div>
        </div>
      </div>

      {categories.map(function(cat) {
        var data = review[cat.key];
        var color = data.score >= 80 ? C.green : data.score >= 60 ? C.amber : C.red;
        return (
          <div key={cat.key} style={{
            padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
            background: C.surfaceAlt, border: "1px solid " + C.border,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: C.text }}>
                {cat.icon} {cat.label}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: color }}>{data.score}</span>
            </div>
            <div style={{
              height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden", marginBottom: "6px",
            }}>
              <div style={{ width: data.score + "%", height: "100%", background: color, borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.5 }}>{data.notes}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function DesignToCodeStudio() {
  var [selectedId, setSelectedId] = useState("login");
  var [activeView, setActiveView] = useState("preview");

  var example = EXAMPLES.find(function(e) { return e.id === selectedId; });
  var PreviewComp = PREVIEW_MAP[selectedId];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Cap 5 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Design para Codigo
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Text-to-UI | Prototipo funcional | Checklist de revisao | Score de producao
          </p>
        </div>

        {/* Example selector */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
          {EXAMPLES.map(function(ex) {
            var isSel = selectedId === ex.id;
            return (
              <button key={ex.id} onClick={function() { setSelectedId(ex.id); setActiveView("preview"); }} style={{
                padding: "8px 14px", borderRadius: "8px", fontSize: "10px",
                fontFamily: "inherit", cursor: "pointer",
                border: "1px solid " + (isSel ? C.purple : C.border),
                background: isSel ? C.purple + "12" : "transparent",
                color: isSel ? C.purple : C.textDim, fontWeight: isSel ? 700 : 400,
              }}>
                <div>{ex.title}</div>
                <div style={{ fontSize: "8px", opacity: 0.7 }}>{ex.category}</div>
              </button>
            );
          })}
        </div>

        {example && (
          <div>
            {/* View tabs */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
              {[
                { id: "preview", label: "Preview" },
                { id: "prompt", label: "Prompt" },
                { id: "review", label: "Revisao" },
              ].map(function(tab) {
                return (
                  <button key={tab.id} onClick={function() { setActiveView(tab.id); }} style={{
                    flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                    fontSize: "11px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                    background: activeView === tab.id ? C.surfaceAlt : "transparent",
                    color: activeView === tab.id ? C.text : C.textDim,
                  }}>{tab.label}</button>
                );
              })}
            </div>

            {/* PREVIEW */}
            {activeView === "preview" && (
              <div>
                <div style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "10px 14px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{example.title}</span>
                      <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "10px" }}>{example.category}</span>
                    </div>
                    <span style={{ fontSize: "9px", color: C.green }}>Componente renderizado</span>
                  </div>
                  <div style={{
                    padding: "20px",
                    background: example.id === "os_mobile" ? "#0a0f1a" : "#f8fafc",
                    display: "flex", justifyContent: "center",
                  }}>
                    {PreviewComp && <PreviewComp />}
                  </div>
                </div>

                <div style={{
                  marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
                  background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
                }}>
                  {example.desc}. Gerado por IA a partir de descricao textual. Score de producao: {" "}
                  {(function() {
                    var avg = Math.round((example.review.responsividade.score + example.review.estados.score + example.review.acessibilidade.score + example.review.designSystem.score) / 4);
                    var color = avg >= 80 ? C.green : avg >= 60 ? C.amber : C.red;
                    return (
                      <span style={{ color: color, fontWeight: 700 }}>{avg}/100</span>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* PROMPT */}
            {activeView === "prompt" && (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", overflow: "hidden",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid " + C.border }}>
                  <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>TEMPLATE BASE (reutilizavel)</div>
                  <div style={{
                    padding: "10px 12px", borderRadius: "8px", background: C.surfaceAlt,
                    fontSize: "10px", color: C.textMuted, lineHeight: 1.6,
                  }}>
                    Gere um componente React para o Costa Lima Piscinas: Framework Next.js 14, UI shadcn/ui + Tailwind, Cores primary=#1e3a5f, TypeScript, responsivo mobile-first, WCAG 2.1 AA.
                  </div>
                </div>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid " + C.border }}>
                  <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>PROMPT ESPECIFICO</div>
                  <div style={{
                    padding: "10px 12px", borderRadius: "8px",
                    background: C.blue + "08", border: "1px solid " + C.blue + "18",
                    fontSize: "11px", color: C.cyan, lineHeight: 1.6,
                  }}>
                    {example.prompt}
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>DICAS PARA ITERAR</div>
                  <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.7 }}>
                    <div style={{ marginBottom: "4px" }}>{"\u2192"} "Adicione loading state com skeleton"</div>
                    <div style={{ marginBottom: "4px" }}>{"\u2192"} "Agora com dark mode"</div>
                    <div style={{ marginBottom: "4px" }}>{"\u2192"} "Melhore a acessibilidade: focus ring, aria-labels"</div>
                    <div style={{ marginBottom: "4px" }}>{"\u2192"} "Substitua cores hardcoded por CSS variables"</div>
                    <div>{"\u2192"} "O que acontece quando o texto do nome tem 40 caracteres?"</div>
                  </div>
                </div>
              </div>
            )}

            {/* REVIEW */}
            {activeView === "review" && (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", padding: "16px",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "12px" }}>
                  Checklist de Revisao: {example.title}
                </div>
                <ReviewChecklist review={example.review} />

                <div style={{
                  marginTop: "14px", padding: "12px 14px", borderRadius: "8px",
                  background: C.amber + "08", border: "1px solid " + C.amber + "22",
                  fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
                }}>
                  <span style={{ color: C.amber, fontWeight: 700 }}>Workflow recomendado:</span>
                  {" "}IA gera o codigo base (80%). Engenheiro revisa responsividade em dispositivos reais, adiciona estados faltantes, corrige acessibilidade, e alinha com design system. Resultado: 100% pronto para producao.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
