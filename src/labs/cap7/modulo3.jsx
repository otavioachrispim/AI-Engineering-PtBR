import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// ROADMAP DATA
// ============================================================
var HORIZONS = [
  {
    id: "h1", name: "Horizonte 1: Agora", period: "Semanas 1-4", pct: 80, color: C.green,
    focus: "Otimizar o que ja esta em producao",
    items: [
      { task: "Analisar correcoes da semana (classify_lead)", status: "done", impact: "Acuracia 91% -> 93%", type: "improve" },
      { task: "Adicionar 2 few-shot examples para REFORMA", status: "done", impact: "Erro REFORMA/MANUTENCAO -60%", type: "improve" },
      { task: "Implementar cache semantico (pgvector)", status: "doing", impact: "Estimativa: cache +12%", type: "optimize" },
      { task: "Redimensionar fotos antes de Vision (768x768)", status: "doing", impact: "Custo Vision -40%", type: "optimize" },
      { task: "Resolver edge case: leads em ingles", status: "todo", impact: "3 leads/semana classificados errado", type: "fix" },
      { task: "Atualizar golden tests (8 -> 14 casos)", status: "done", impact: "CI mais robusto", type: "quality" },
    ],
  },
  {
    id: "h2", name: "Horizonte 2: Proximo", period: "Meses 2-3", pct: 15, color: C.cyan,
    focus: "Expandir para proxima feature do RICE",
    items: [
      { task: "Prototipar analise de foto (Vision)", status: "doing", impact: "Hipotese: economiza 15min/vistoria", type: "build" },
      { task: "Pilotar smart fill com Felipe", status: "todo", impact: "Hipotese: orcamento 60% mais rapido", type: "validate" },
      { task: "Testar agente multi-step com Sandra", status: "todo", impact: "Hipotese: relatorio em 30s vs 2h", type: "validate" },
      { task: "Avaliar busca semantica (pgvector)", status: "todo", impact: "Hipotese: busca 5x mais eficiente", type: "explore" },
    ],
  },
  {
    id: "h3", name: "Horizonte 3: Futuro", period: "Meses 4-6", pct: 5, color: C.purple,
    focus: "Visao estrategica, nao compromisso",
    items: [
      { task: "Multi-MCP (Calendar, Gmail, Slack)", status: "idea", impact: "Depende do sucesso do MCP basico", type: "explore" },
      { task: "Chat no PWA para colaboradores em campo", status: "idea", impact: "Depende da adocao do copiloto", type: "explore" },
      { task: "Fine-tune modelo menor para classificacao", status: "idea", impact: "So se volume > 1000 leads/dia", type: "explore" },
      { task: "Agente autonomo para atendimento noturno", status: "idea", impact: "Depende da confianca do agente", type: "explore" },
    ],
  },
];

var STATUS_STYLES = {
  done: { color: C.green, label: "DONE", icon: "\u2713" },
  doing: { color: C.amber, label: "DOING", icon: "\u25CF" },
  todo: { color: C.cyan, label: "TODO", icon: "\u25CB" },
  idea: { color: C.purple, label: "IDEA", icon: "\u2606" },
};

var TYPE_STYLES = {
  improve: { color: C.green, label: "MELHORIA" },
  optimize: { color: C.cyan, label: "OTIMIZAR" },
  fix: { color: C.red, label: "CORRECAO" },
  quality: { color: C.purple, label: "QUALIDADE" },
  build: { color: C.amber, label: "CONSTRUIR" },
  validate: { color: C.orange, label: "VALIDAR" },
  explore: { color: C.blue, label: "EXPLORAR" },
};

// ============================================================
// BUILD-MEASURE-LEARN CYCLES
// ============================================================
var BML_CYCLES = [
  {
    feature: "Classificar leads",
    hypothesis: "IA classifica leads com >85% de acuracia e economiza >5min por lead",
    cycles: [
      {
        cycle: 1, label: "MVP Zero-shot",
        build: "Prompt zero-shot com 5 categorias. Testado com 20 leads reais do WhatsApp.",
        measure: "Acuracia: 78% (15/20 corretos). Erros: confunde REFORMA com MANUTENCAO.",
        learn: "Hipotese parcialmente validada. 78% e promissor mas insuficiente. Precisa de few-shot.",
        decision: "PIVOTAR: adicionar few-shot examples",
        metrics: { accuracy: 78, leads: 20 },
      },
      {
        cycle: 2, label: "Few-shot v1",
        build: "Adicionados 3 few-shot examples (1 construcao, 1 reforma, 1 manutencao).",
        measure: "Acuracia: 88% em 50 leads. Erro residual: 'troca de vinil' classificado como MANUTENCAO (era REFORMA).",
        learn: "Melhoria significativa. Few-shot funciona. Edge case especifico identificado.",
        decision: "PERSEVERAR: adicionar mais examples + pilotar",
        metrics: { accuracy: 88, leads: 50 },
      },
      {
        cycle: 3, label: "Piloto com Felipe",
        build: "Deploy em producao. Felipe usa por 2 semanas. 100% dos leads passam pela IA. Vendedor pode corrigir.",
        measure: "Acuracia: 91% em 180 leads. Adocao: 74% (Felipe usa rascunho da IA). Tempo resposta: 5min (antes 2h). 14 correcoes feitas.",
        learn: "Hipotese VALIDADA. Acuracia >85%, economia >5min. Correcoes alimentam melhoria continua.",
        decision: "ESCALAR: producao total + monitoring + golden tests",
        metrics: { accuracy: 91, leads: 180 },
      },
      {
        cycle: 4, label: "Producao + iteracao",
        build: "Golden tests, cache, fallback, dashboard. Prompt v4 com 5 few-shots + edge cases.",
        measure: "Acuracia: 93% em 900 leads/mes. Cache hit: 48%. Custo: $0.0005/lead. Drift: -0.3%/sem (estavel).",
        learn: "Sistema maduro. Flywheel funcionando: correcoes -> melhoria -> menos correcoes.",
        decision: "MANTER + otimizar (cache semantico, batch)",
        metrics: { accuracy: 93, leads: 900 },
      },
    ],
  },
  {
    feature: "Analise de foto (Vision)",
    hypothesis: "IA analisa fotos de vistoria com diagnostico util e economiza 15min por vistoria",
    cycles: [
      {
        cycle: 1, label: "MVP com 5 fotos",
        build: "Prompt Vision com 5 fotos de teste (2 OK, 2 com problemas, 1 obra). Sonnet.",
        measure: "Diagnostico correto em 4/5 fotos. Errou: confundiu mancha de sujeira com infiltracao.",
        learn: "Promissor mas precisa de prompt mais especifico para diferenciar sujeira de infiltracao.",
        decision: "PIVOTAR: refinar prompt + adicionar checklist estruturado",
        metrics: { accuracy: 80, photos: 5 },
      },
      {
        cycle: 2, label: "Prompt estruturado",
        build: "Prompt com checklist: agua (cor, nivel), borda (rejunte, trincas), equipamentos (bomba, filtro). Output JSON.",
        measure: "15 fotos: 87% de acuracia. Custo: $0.015/foto. Latencia: 1.2s.",
        learn: "Checklist estruturado melhora muito. Custo aceitavel. Pronto para piloto.",
        decision: "PERSEVERAR: pilotar com tecnico em campo",
        metrics: { accuracy: 87, photos: 15 },
      },
    ],
  },
];

// ============================================================
// PROMPT VERSIONS
// ============================================================
var PROMPT_VERSIONS = [
  { version: "v1", date: "01/02", accuracy: 78, technique: "Zero-shot", changes: "Prompt inicial: 'Classifique a intencao do lead'", tests: 4, status: "archived" },
  { version: "v2", date: "08/02", accuracy: 85, technique: "Few-shot (3)", changes: "Adicionados 3 examples: construcao, reforma, manutencao", tests: 6, status: "archived" },
  { version: "v3", date: "22/02", accuracy: 91, technique: "Few-shot (5)", changes: "Adicionados edge cases: reforma vs manutencao, urgencia", tests: 8, status: "archived" },
  { version: "v4", date: "08/03", accuracy: 93, technique: "Few-shot (5) + chain", changes: "Chain-of-thought para casos ambiguos. JSON schema output.", tests: 14, status: "current" },
];

// ============================================================
// FEEDBACK SIMULATION
// ============================================================
var FEEDBACK_LOG = [
  { date: "10/03", lead: "Quero trocar o vinil da piscina", aiClass: "MANUTENCAO", humanClass: "REFORMA", corrected: true },
  { date: "10/03", lead: "Minha piscina esta verde", aiClass: "MANUTENCAO", humanClass: null, corrected: false },
  { date: "09/03", lead: "Quero fazer uma piscina 6x3", aiClass: "CONSTRUCAO", humanClass: null, corrected: false },
  { date: "09/03", lead: "Preciso de limpeza mensal", aiClass: "MANUTENCAO", humanClass: null, corrected: false },
  { date: "08/03", lead: "A bomba esta fazendo barulho estranho", aiClass: "MANUTENCAO", humanClass: null, corrected: false },
  { date: "08/03", lead: "Gostaria de iluminacao LED na piscina", aiClass: "CONSTRUCAO", humanClass: "REFORMA", corrected: true },
  { date: "07/03", lead: "Reforma completa da area de lazer", aiClass: "REFORMA", humanClass: null, corrected: false },
  { date: "07/03", lead: "Want to build a pool in my backyard", aiClass: "INDEFINIDO", humanClass: "CONSTRUCAO", corrected: true },
];

// ============================================================
// RETROSPECTIVE
// ============================================================
var RETRO = {
  good: [
    "Acuracia subiu de 91% para 93% com few-shot v4",
    "Vendedor Felipe usa copiloto em 74% das interacoes",
    "Cache hit rate subiu de 35% para 48% com cache exato",
    "Tempo de resposta ao lead caiu de 2h para 5min",
    "Golden tests preveniram deploy quebrado (v1.25.0)",
  ],
  bad: [
    "Confusao REFORMA vs MANUTENCAO persiste (3 correcoes/semana)",
    "Leads em ingles classificados como INDEFINIDO (3/semana)",
    "Vision (fotos) e 56% do custo com 4% das chamadas",
    "Sandra nao usa o copiloto (prefere consultar o banco direto)",
    "Fallback ativou 3x por timeout da API (1h35 total)",
  ],
  actions: [
    { action: "Adicionar few-shot em ingles no prompt v5", owner: "Dev", deadline: "15/03", priority: "media" },
    { action: "Implementar cache de imagem (SHA256)", owner: "Dev", deadline: "20/03", priority: "alta" },
    { action: "Entrevistar Sandra sobre copiloto", owner: "PO", deadline: "12/03", priority: "media" },
    { action: "Adicionar few-shot REFORMA vs MANUTENCAO", owner: "Dev", deadline: "14/03", priority: "alta" },
    { action: "Testar timeout mais agressivo + retry", owner: "Dev", deadline: "18/03", priority: "baixa" },
  ],
};

// ============================================================
// MAIN APP
// ============================================================
export default function RoadmapIterationLab() {
  var [activeTab, setActiveTab] = useState("roadmap");
  var [selectedBML, setSelectedBML] = useState(0);
  var [bmlCycle, setBmlCycle] = useState(0);
  var [playing, setPlaying] = useState(false);

  var playBML = useCallback(function(idx) {
    setSelectedBML(idx);
    setBmlCycle(0);
    setPlaying(true);
    var cycles = BML_CYCLES[idx].cycles;
    cycles.forEach(function(_, i) {
      setTimeout(function() {
        setBmlCycle(i + 1);
        if (i === cycles.length - 1) setPlaying(false);
      }, (i + 1) * 1200);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.green, padding: "4px 10px", borderRadius: "4px",
            background: C.green + "12", border: "1px solid " + C.green + "33",
          }}>Cap 7 - Modulo 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Roadmap, Iteracao e Melhoria Continua
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Horizontes | Build-Measure-Learn | Prompt versioning | Feedback loop | Retro
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "roadmap", label: "Roadmap" },
            { id: "bml", label: "Build-Measure-Learn" },
            { id: "prompts", label: "Prompt Versions" },
            { id: "feedback", label: "Feedback Loop" },
            { id: "retro", label: "Retrospectiva" },
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

        {/* ROADMAP */}
        {activeTab === "roadmap" && (
          <div>
            {/* Time allocation bar */}
            <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
              {HORIZONS.map(function(h) {
                return <div key={h.id} style={{ width: h.pct + "%", background: h.color }} />;
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "9px" }}>
              {HORIZONS.map(function(h) {
                return <span key={h.id} style={{ color: h.color, fontWeight: 700 }}>{h.name.split(":")[0]} ({h.pct}%)</span>;
              })}
            </div>

            {HORIZONS.map(function(h) {
              var done = h.items.filter(function(i) { return i.status === "done"; }).length;
              var total = h.items.length;
              return (
                <div key={h.id} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", marginBottom: "12px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <div style={{
                      width: "8px", height: "32px", borderRadius: "4px", background: h.color,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: h.color }}>{h.name}</div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>{h.period} | {h.focus}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: h.color, fontWeight: 700 }}>{done}/{total}</span>
                  </div>
                  <div style={{ padding: "10px 16px" }}>
                    {h.items.map(function(item, i) {
                      var ss = STATUS_STYLES[item.status];
                      var ts = TYPE_STYLES[item.type];
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "6px 0", fontSize: "10px",
                          borderBottom: i < h.items.length - 1 ? "1px solid " + C.border : "none",
                        }}>
                          <span style={{ color: ss.color, fontWeight: 800, fontSize: "11px", width: "14px" }}>{ss.icon}</span>
                          <span style={{ color: C.text, flex: 1 }}>{item.task}</span>
                          <span style={{
                            fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                            background: ts.color + "15", color: ts.color,
                          }}>{ts.label}</span>
                          <span style={{ fontSize: "9px", color: C.textDim, width: "160px", textAlign: "right" }}>{item.impact}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BUILD-MEASURE-LEARN */}
        {activeTab === "bml" && (
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {BML_CYCLES.map(function(bml, i) {
                return (
                  <button key={i} onClick={function() { playBML(i); }} disabled={playing} style={{
                    flex: 1, padding: "10px 12px", borderRadius: "8px", fontSize: "10px",
                    fontFamily: "inherit", cursor: playing ? "default" : "pointer", textAlign: "left",
                    border: "1px solid " + (selectedBML === i ? C.amber : C.border),
                    background: selectedBML === i ? C.amber + "10" : C.surface,
                    color: selectedBML === i ? C.amber : C.textMuted,
                    fontWeight: selectedBML === i ? 700 : 400,
                  }}>
                    <div style={{ fontWeight: 700 }}>{bml.feature}</div>
                    <div style={{ fontSize: "9px", opacity: 0.7 }}>{bml.cycles.length} ciclos | Clique para reproduzir</div>
                  </button>
                );
              })}
            </div>

            {(function() {
              var bml = BML_CYCLES[selectedBML];
              return (
                <div>
                  <div style={{
                    padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
                    background: C.amber + "08", border: "1px solid " + C.amber + "22",
                    fontSize: "11px",
                  }}>
                    <span style={{ color: C.amber, fontWeight: 700 }}>Hipotese: </span>
                    <span style={{ color: C.textMuted }}>{bml.hypothesis}</span>
                  </div>

                  {bml.cycles.map(function(cycle, i) {
                    if (i >= bmlCycle) return null;
                    var decColor = cycle.decision.includes("PERSEVERAR") ? C.green : cycle.decision.includes("ESCALAR") || cycle.decision.includes("MANTER") ? C.green : C.amber;
                    return (
                      <div key={i} style={{
                        background: C.surface, border: "1px solid " + C.border,
                        borderRadius: "10px", marginBottom: "10px", padding: "14px 16px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%",
                            background: C.amber + "20", border: "2px solid " + C.amber,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "11px", fontWeight: 800, color: C.amber,
                          }}>{cycle.cycle}</div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{cycle.label}</span>
                          <span style={{
                            marginLeft: "auto", fontSize: "13px", fontWeight: 800,
                            color: cycle.metrics.accuracy >= 90 ? C.green : cycle.metrics.accuracy >= 80 ? C.amber : C.red,
                          }}>{cycle.metrics.accuracy}%</span>
                          <span style={{ fontSize: "9px", color: C.textDim }}>({cycle.metrics.leads || cycle.metrics.photos} amostras)</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "10px" }}>
                          <div style={{ padding: "8px", borderRadius: "6px", background: C.green + "06", border: "1px solid " + C.green + "12" }}>
                            <div style={{ color: C.green, fontWeight: 700, fontSize: "9px", marginBottom: "3px" }}>BUILD</div>
                            <div style={{ color: C.textMuted, lineHeight: 1.4 }}>{cycle.build}</div>
                          </div>
                          <div style={{ padding: "8px", borderRadius: "6px", background: C.cyan + "06", border: "1px solid " + C.cyan + "12" }}>
                            <div style={{ color: C.cyan, fontWeight: 700, fontSize: "9px", marginBottom: "3px" }}>MEASURE</div>
                            <div style={{ color: C.textMuted, lineHeight: 1.4 }}>{cycle.measure}</div>
                          </div>
                          <div style={{ padding: "8px", borderRadius: "6px", background: C.amber + "06", border: "1px solid " + C.amber + "12" }}>
                            <div style={{ color: C.amber, fontWeight: 700, fontSize: "9px", marginBottom: "3px" }}>LEARN</div>
                            <div style={{ color: C.textMuted, lineHeight: 1.4 }}>{cycle.learn}</div>
                          </div>
                        </div>
                        <div style={{
                          marginTop: "8px", padding: "6px 10px", borderRadius: "6px",
                          background: decColor + "08", border: "1px solid " + decColor + "18",
                          fontSize: "10px", color: decColor, fontWeight: 700,
                        }}>
                          Decisao: {cycle.decision}
                        </div>
                      </div>
                    );
                  })}
                  {playing && <div style={{ textAlign: "center", color: C.amber, fontSize: "11px", padding: "8px" }}>Ciclo {bmlCycle + 1}...</div>}
                </div>
              );
            })()}
          </div>
        )}

        {/* PROMPTS */}
        {activeTab === "prompts" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Historico de versoes do prompt classify_lead. Cada versao com data, acuracia medida, tecnica e golden tests.
            </p>

            {/* Accuracy timeline */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>EVOLUCAO DA ACURACIA</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                {PROMPT_VERSIONS.map(function(v) {
                  var h = ((v.accuracy - 70) / 30) * 80;
                  var color = v.status === "current" ? C.green : C.cyan;
                  return (
                    <div key={v.version} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: color, marginBottom: "4px" }}>{v.accuracy}%</div>
                      <div style={{
                        height: Math.max(h, 4) + "px", background: color,
                        borderRadius: "4px 4px 0 0", margin: "0 auto", width: "70%",
                        opacity: v.status === "current" ? 1 : 0.5,
                      }} />
                      <div style={{ fontSize: "9px", color: C.textDim, marginTop: "4px" }}>{v.version}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Version list */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {PROMPT_VERSIONS.map(function(v, i) {
                var isCurrent = v.status === "current";
                return (
                  <div key={v.version} style={{
                    padding: "12px 16px", fontSize: "11px",
                    borderBottom: i < PROMPT_VERSIONS.length - 1 ? "1px solid " + C.border : "none",
                    background: isCurrent ? C.green + "06" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, color: isCurrent ? C.green : C.text }}>{v.version}</span>
                      <span style={{ color: C.textDim, fontSize: "10px" }}>{v.date}</span>
                      <span style={{ color: C.cyan }}>{v.technique}</span>
                      <span style={{ marginLeft: "auto", fontWeight: 700, color: v.accuracy >= 90 ? C.green : C.amber }}>{v.accuracy}%</span>
                      <span style={{ fontSize: "9px", color: C.textDim }}>{v.tests} golden tests</span>
                      {isCurrent && <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px", background: C.green + "15", color: C.green }}>CURRENT</span>}
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{v.changes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Log de feedback: classificacoes aceitas (implicito) e corrigidas (explicito). Correcoes alimentam melhorias no prompt.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {[
                { label: "Total leads", value: FEEDBACK_LOG.length, color: C.text },
                { label: "Corretos", value: FEEDBACK_LOG.filter(function(f) { return !f.corrected; }).length, color: C.green },
                { label: "Corrigidos", value: FEEDBACK_LOG.filter(function(f) { return f.corrected; }).length, color: C.red },
                { label: "Acuracia", value: Math.round(FEEDBACK_LOG.filter(function(f) { return !f.corrected; }).length / FEEDBACK_LOG.length * 100) + "%", color: C.amber },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, padding: "10px 8px", borderRadius: "8px",
                    background: C.surface, border: "1px solid " + C.border, textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Log */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {FEEDBACK_LOG.map(function(f, i) {
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < FEEDBACK_LOG.length - 1 ? "1px solid " + C.border : "none",
                    background: f.corrected ? C.red + "04" : "transparent",
                  }}>
                    <span style={{ color: C.textDim, width: "40px", flexShrink: 0 }}>{f.date}</span>
                    <span style={{ color: C.textMuted, flex: 1 }}>{f.lead.length > 50 ? f.lead.substring(0, 50) + "..." : f.lead}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                      background: (f.corrected ? C.red : C.green) + "15",
                      color: f.corrected ? C.red : C.green,
                    }}>{f.aiClass}</span>
                    {f.corrected && (
                      <span style={{ color: C.textDim }}>{"\u2192"}</span>
                    )}
                    {f.corrected && (
                      <span style={{
                        fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                        background: C.amber + "15", color: C.amber,
                      }}>{f.humanClass}</span>
                    )}
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: f.corrected ? C.red : C.green, flexShrink: 0,
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Patterns detected */}
            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.amber + "08", border: "1px solid " + C.amber + "22",
              fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Padroes detectados nas correcoes: </span>
              1) "troca de vinil" classificado como MANUTENCAO (deveria ser REFORMA) — adicionar few-shot.
              2) Leads em ingles classificados como INDEFINIDO — adicionar example em ingles.
              3) "iluminacao LED" classificado como CONSTRUCAO (deveria ser REFORMA quando piscina ja existe).
            </div>
          </div>
        )}

        {/* RETRO */}
        {activeTab === "retro" && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>
              Retrospectiva de IA — Sprint 6 (Marco 2026)
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              {/* Good */}
              <div style={{ flex: 1, minWidth: "260px", background: C.green + "06", border: "1px solid " + C.green + "18", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.green, marginBottom: "8px" }}>{"\uD83D\uDE00"} O que funcionou</div>
                {RETRO.good.map(function(g, i) {
                  return <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", paddingLeft: "8px" }}>{"\u2713"} {g}</div>;
                })}
              </div>

              {/* Bad */}
              <div style={{ flex: 1, minWidth: "260px", background: C.red + "06", border: "1px solid " + C.red + "18", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.red, marginBottom: "8px" }}>{"\uD83D\uDE15"} O que nao funcionou</div>
                {RETRO.bad.map(function(b, i) {
                  return <div key={i} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", paddingLeft: "8px" }}>{"\u2717"} {b}</div>;
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, fontSize: "11px", fontWeight: 700, color: C.amber }}>
                {"\uD83D\uDCCB"} Acoes da retrospectiva
              </div>
              {RETRO.actions.map(function(a, i) {
                var pc = a.priority === "alta" ? C.red : a.priority === "media" ? C.amber : C.textDim;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 14px", fontSize: "10px",
                    borderBottom: i < RETRO.actions.length - 1 ? "1px solid " + C.border : "none",
                  }}>
                    <span style={{ color: C.text, flex: 1 }}>{a.action}</span>
                    <span style={{ color: C.cyan, fontSize: "9px" }}>{a.owner}</span>
                    <span style={{ color: C.textDim, fontSize: "9px" }}>{a.deadline}</span>
                    <span style={{
                      fontSize: "7px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                      background: pc + "15", color: pc,
                    }}>{a.priority.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
