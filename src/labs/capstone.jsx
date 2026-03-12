import { useState, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

function ri(a, b) { return a + Math.floor(Math.random() * (b - a)); }

// ============================================================
// COURSE MAP — ALL 11 CHAPTERS
// ============================================================
var CHAPTERS = [
  { num: 1, title: "Fundamentos de IA", modules: 4, labs: 4, integrator: 1, color: C.blue, keyDeliverable: "Lead Scoring (Naive Bayes + regras)", techStack: "Tokenizacao, embeddings, redes neurais, TF.js" },
  { num: 2, title: "APIs e Prompt Engineering", modules: 4, labs: 4, integrator: 1, color: C.cyan, keyDeliverable: "Pipeline de intake de leads (~$0.006/lead)", techStack: "Claude Haiku/Sonnet, few-shot, CoT, Vision" },
  { num: 3, title: "MCP: Model Context Protocol", modules: 4, labs: 4, integrator: 1, color: C.green, keyDeliverable: "MCP Server com 6 tools + RBAC", techStack: "JSON-RPC, Prisma, SSE, auth, rate limiting" },
  { num: 4, title: "Agentes Autonomos", modules: 4, labs: 4, integrator: 1, color: C.amber, keyDeliverable: "Central de agentes (4 especializados)", techStack: "ReAct, Plan-Execute, multi-agent, HITL" },
  { num: 5, title: "UX/UI com IA", modules: 4, labs: 4, integrator: 1, color: C.purple, keyDeliverable: "Painel inteligente (busca, smart fill, chat)", techStack: "Design-to-code, CLI agents, testes E2E" },
  { num: 6, title: "DevOps e Infraestrutura", modules: 4, labs: 4, integrator: 1, color: C.green, keyDeliverable: "DevOps Command Center", techStack: "CI/CD, observabilidade, LGPD, custos" },
  { num: 7, title: "Gestao de Produtos de IA", modules: 3, labs: 3, integrator: 1, color: C.orange, keyDeliverable: "Product HQ (RICE, metricas, retro)", techStack: "Discovery, RICE, feedback loop, etica" },
  { num: 8, title: "RAG e Embeddings", modules: 3, labs: 3, integrator: 1, color: C.cyan, keyDeliverable: "Base de conhecimento inteligente", techStack: "pgvector, hybrid search, re-ranking, multi-step" },
  { num: 9, title: "Fine-Tuning", modules: 2, labs: 2, integrator: 1, color: C.purple, keyDeliverable: "ML Studio (destilacao + MLOps)", techStack: "LoRA, destilacao, confusion matrix, shadow deploy" },
  { num: 10, title: "Seguranca Avancada", modules: 2, labs: 2, integrator: 1, color: C.red, keyDeliverable: "Security Operations Center", techStack: "OWASP LLM, red teaming, incident response" },
  { num: 11, title: "Capstone", modules: 1, labs: 1, integrator: 0, color: C.text, keyDeliverable: "AI Command Center (este projeto)", techStack: "Integracao completa de todos os capitulos" },
];

var TOTAL_MODULES = CHAPTERS.reduce(function(s, c) { return s + c.modules; }, 0);
var TOTAL_LABS = CHAPTERS.reduce(function(s, c) { return s + c.labs; }, 0);
var TOTAL_INTEGRATORS = CHAPTERS.reduce(function(s, c) { return s + c.integrator; }, 0);

// ============================================================
// SYSTEM HEALTH (live)
// ============================================================
function genHealth() {
  return {
    uptime: "99." + ri(5, 9) + "%",
    aiCalls: ri(15, 40),
    aiLatency: ri(250, 500),
    cacheHit: ri(42, 62),
    costToday: (Math.random() * 2 + 1).toFixed(2),
    accuracy: (92 + Math.random() * 2).toFixed(1),
    adoption: ri(70, 82),
    secScore: ri(82, 88),
    leadsToday: ri(25, 40),
    responseMin: ri(3, 8),
    fallback: Math.random() > 0.92,
  };
}

// ============================================================
// ARCHITECTURE LAYERS
// ============================================================
var ARCH_LAYERS = [
  {
    name: "Frontend (Next.js)",
    color: C.purple,
    items: ["Admin dashboard com busca semantica (Cap 5,8)", "Smart fill em orcamentos (Cap 5)", "Chat copiloto embutido (Cap 5)", "Sugestoes contextuais (Cap 5)", "PWA mobile para equipe (Cap 5)"],
  },
  {
    name: "Backend (Express + Prisma)",
    color: C.blue,
    items: ["API REST (autenticacao, CRUD) (Cap 2)", "MCP Server /mcp/sse com 6+ tools (Cap 3)", "Agent Runner (ReAct, multi-agent) (Cap 4)", "RAG pipeline (hybrid search, re-rank) (Cap 8)", "AI Service (classify, generate, vision) (Cap 2)"],
  },
  {
    name: "IA e ML",
    color: C.cyan,
    items: ["Claude Haiku (classificacao, chat) (Cap 2)", "Claude Sonnet (vision, agentes) (Cap 2,4)", "Modelo destilado LoRA (classificacao) (Cap 9)", "Embeddings pgvector (busca semantica) (Cap 8)", "Prompt templates versionados (v1-v4) (Cap 2,7)"],
  },
  {
    name: "Dados",
    color: C.green,
    items: ["Neon PostgreSQL + Prisma ORM", "pgvector (embeddings, RAG) (Cap 8)", "AICallLog, AgentTrace, AuditLog (Cap 2,4,10)", "MemoriaAgente (longo prazo) (Cap 4)", "AWS S3 (fotos, documentos)"],
  },
  {
    name: "DevOps e Seguranca",
    color: C.red,
    items: ["GitHub Actions CI/CD com AI tests (Cap 6)", "Railway (backend) + Vercel (frontend) (Cap 6)", "5 camadas de defesa (Cap 10)", "Audit trail completo (Cap 10)", "Monitoring + alertas + rollback (Cap 6)"],
  },
  {
    name: "Gestao",
    color: C.orange,
    items: ["RICE prioritization (Cap 7)", "Product Health Score (Cap 7)", "Feedback loop (correcoes -> melhoria) (Cap 7)", "Retrospectiva de IA (Cap 7)", "ROI tracking (R$720 custo vs R$14k economia) (Cap 6,7)"],
  },
];

// ============================================================
// THE JOURNEY — KEY MILESTONES
// ============================================================
var JOURNEY = [
  { week: "Sem 1-2", milestone: "Classificacao de leads com Haiku", metric: "78% acuracia (zero-shot)", chapter: 1 },
  { week: "Sem 3-4", milestone: "API pipeline completo + few-shot", metric: "91% acuracia, $0.006/lead", chapter: 2 },
  { week: "Sem 5-6", milestone: "MCP Server com 6 tools + RBAC", metric: "6 tools, 5 niveis de acesso", chapter: 3 },
  { week: "Sem 7-8", milestone: "Agentes autonomos com HITL", metric: "4 agentes, 10 guardrails", chapter: 4 },
  { week: "Sem 9-10", milestone: "Frontend inteligente + busca", metric: "5 features invisiveis de IA", chapter: 5 },
  { week: "Sem 11-12", milestone: "DevOps com AI tests + monitoring", metric: "11 stages, 84% security", chapter: 6 },
  { week: "Sem 13-14", milestone: "Gestao de produto + feedback loop", metric: "ROI 1.847%, flywheel girando", chapter: 7 },
  { week: "Sem 15-16", milestone: "RAG com hybrid search", metric: "14 docs, faithfulness 98%", chapter: 8 },
  { week: "Sem 17-18", milestone: "Destilacao + MLOps", metric: "94.5% (gap 1.7% do professor)", chapter: 9 },
  { week: "Sem 19-20", milestone: "SOC + red teaming", metric: "9 ataques, 0 false positives", chapter: 10 },
  { week: "Sem 21", milestone: "CAPSTONE: sistema completo", metric: "Tudo integrado e funcionando", chapter: 11 },
];

// ============================================================
// ROI SUMMARY
// ============================================================
var ROI = {
  costMonthly: { ai: 70, infra: 250, dev: 500, total: 820 },
  economyMonthly: { vendedor: 2200, coordenador: 1320, conversao: 10000, retrabalho: 500, total: 14020 },
  roi: 1610,
  paybackDays: 2,
};

// ============================================================
// MAIN APP
// ============================================================
export default function Capstone() {
  var [activeTab, setActiveTab] = useState("command");
  var [health, setHealth] = useState(genHealth);
  var [tick, setTick] = useState(0);

  useEffect(function() {
    var iv = setInterval(function() {
      setHealth(genHealth());
      setTick(function(t) { return t + 1; });
    }, 4000);
    return function() { clearInterval(iv); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "940px", margin: "0 auto", padding: "24px 16px" }}>

        {/* HEADER */}
        <div style={{
          textAlign: "center", marginBottom: "24px",
          padding: "28px 20px", borderRadius: "14px",
          background: "linear-gradient(135deg, " + C.blue + "12, " + C.purple + "12, " + C.cyan + "12)",
          border: "1px solid " + C.border,
        }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "3px",
            color: C.amber, padding: "4px 12px", borderRadius: "4px",
            background: C.amber + "12", border: "1px solid " + C.amber + "33",
          }}>CAPITULO 11 — CAPSTONE</span>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "12px 0 6px", color: C.text }}>
            AI Engineering Command Center
          </h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
            Costa Lima Piscinas — O sistema completo em um unico painel
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "14px", fontSize: "12px" }}>
            <span style={{ color: C.cyan }}><span style={{ fontWeight: 800 }}>{CHAPTERS.length}</span> capitulos</span>
            <span style={{ color: C.green }}><span style={{ fontWeight: 800 }}>{TOTAL_MODULES}</span> modulos</span>
            <span style={{ color: C.purple }}><span style={{ fontWeight: 800 }}>{TOTAL_LABS}</span> laboratorios</span>
            <span style={{ color: C.amber }}><span style={{ fontWeight: 800 }}>{TOTAL_INTEGRATORS}</span> projetos</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "16px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "command", label: "Command Center" },
            { id: "journey", label: "A Jornada" },
            { id: "arch", label: "Arquitetura" },
            { id: "roi", label: "ROI Final" },
            { id: "cert", label: "Certificado" },
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

        {/* =================== COMMAND CENTER =================== */}
        {activeTab === "command" && (
          <div>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green, boxShadow: "0 0 6px " + C.green }} />
              <span style={{ fontSize: "10px", color: C.green, fontWeight: 700 }}>SISTEMA OPERACIONAL</span>
              <span style={{ fontSize: "9px", color: C.textDim }}>tick #{tick}</span>
            </div>

            {/* Top metrics */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Uptime", value: health.uptime, color: C.green },
                { label: "AI calls/min", value: health.aiCalls, color: C.cyan },
                { label: "Latencia", value: health.aiLatency + "ms", color: health.aiLatency > 400 ? C.amber : C.green },
                { label: "Cache", value: health.cacheHit + "%", color: health.cacheHit > 45 ? C.green : C.amber },
                { label: "$/dia", value: "$" + health.costToday, color: C.amber },
                { label: "Acuracia", value: health.accuracy + "%", color: C.green },
                { label: "Adocao", value: health.adoption + "%", color: C.green },
                { label: "Security", value: health.secScore + "%", color: health.secScore > 85 ? C.green : C.amber },
                { label: "Leads hoje", value: health.leadsToday, color: C.cyan },
                { label: "Resp. media", value: health.responseMin + "min", color: health.responseMin <= 5 ? C.green : C.amber },
              ].map(function(m) {
                return (
                  <div key={m.label} style={{
                    flex: 1, minWidth: "70px", padding: "8px 4px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "7px", color: C.textDim }}>{m.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Chapter cards grid */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>SISTEMA POR CAPITULO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {CHAPTERS.slice(0, 10).map(function(ch) {
                return (
                  <div key={ch.num} style={{
                    padding: "10px 12px", borderRadius: "8px",
                    background: C.surface, border: "1px solid " + ch.color + "18",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: ch.color + "20", border: "1px solid " + ch.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 800, color: ch.color,
                      }}>{ch.num}</div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: ch.color, flex: 1 }}>{ch.title}</span>
                      <span style={{ fontSize: "8px", color: C.textDim }}>{ch.modules}M {ch.labs}L</span>
                    </div>
                    <div style={{ fontSize: "9px", color: C.textMuted, lineHeight: 1.4 }}>{ch.keyDeliverable}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== JOURNEY =================== */}
        {activeTab === "journey" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              21 semanas de aprendizado progressivo. Cada marco construiu sobre o anterior.
            </p>

            {JOURNEY.map(function(j, i) {
              var ch = CHAPTERS.find(function(c) { return c.num === j.chapter; });
              var color = ch ? ch.color : C.text;
              var isLast = i === JOURNEY.length - 1;
              return (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: isLast ? 0 : "4px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                    <div style={{
                      width: isLast ? "28px" : "22px", height: isLast ? "28px" : "22px", borderRadius: "50%",
                      background: color + (isLast ? "40" : "20"), border: "2px solid " + color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isLast ? "11px" : "9px", fontWeight: 800, color: color,
                    }}>{j.chapter}</div>
                    {!isLast && <div style={{ width: "2px", flex: 1, background: C.border, minHeight: "6px" }} />}
                  </div>
                  <div style={{
                    flex: 1, padding: isLast ? "14px" : "10px 12px", borderRadius: "8px",
                    background: isLast ? color + "08" : C.surface,
                    border: "1px solid " + (isLast ? color + "33" : C.border),
                    marginBottom: "2px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "9px", color: C.textDim }}>{j.week}</span>
                      <span style={{ fontSize: isLast ? "13px" : "11px", fontWeight: 700, color: isLast ? color : C.text }}>{j.milestone}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: color }}>{j.metric}</div>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: "14px", padding: "14px", borderRadius: "10px",
              background: C.green + "08", border: "1px solid " + C.green + "22",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: C.green, marginBottom: "4px" }}>
                De zero-shot 78% ate sistema completo com 94.5% de acuracia
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>
                {TOTAL_MODULES} modulos | {TOTAL_LABS} laboratorios | {TOTAL_INTEGRATORS} projetos integradores | 1 sistema real
              </div>
            </div>
          </div>
        )}

        {/* =================== ARCHITECTURE =================== */}
        {activeTab === "arch" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              A arquitetura completa do Costa Lima com IA. Cada item referencia o capitulo onde foi construido.
            </p>

            {ARCH_LAYERS.map(function(layer) {
              return (
                <div key={layer.name} style={{
                  background: C.surface, border: "1px solid " + layer.color + "22",
                  borderRadius: "10px", marginBottom: "8px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "10px 14px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: layer.color }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: layer.color }}>{layer.name}</span>
                  </div>
                  <div style={{ padding: "8px 14px" }}>
                    {layer.items.map(function(item, i) {
                      return (
                        <div key={i} style={{
                          padding: "4px 0", fontSize: "10px", color: C.textMuted,
                          borderBottom: i < layer.items.length - 1 ? "1px solid " + C.border : "none",
                        }}>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================== ROI =================== */}
        {activeTab === "roi" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              O resultado financeiro de tudo que foi construido. O numero que o CEO quer ver.
            </p>

            {/* Big ROI number */}
            <div style={{
              textAlign: "center", padding: "24px", borderRadius: "14px", marginBottom: "16px",
              background: "linear-gradient(135deg, " + C.green + "10, " + C.cyan + "08)",
              border: "1px solid " + C.green + "33",
            }}>
              <div style={{ fontSize: "48px", fontWeight: 800, color: C.green }}>{ROI.roi}%</div>
              <div style={{ fontSize: "14px", color: C.textMuted }}>Retorno sobre Investimento mensal</div>
              <div style={{ fontSize: "11px", color: C.textDim, marginTop: "4px" }}>Payback: {ROI.paybackDays} dias</div>
            </div>

            {/* Cost vs Economy */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              {/* Costs */}
              <div style={{ flex: 1, minWidth: "260px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.red, marginBottom: "10px" }}>CUSTO MENSAL</div>
                {[
                  { name: "API de IA (Anthropic)", value: ROI.costMonthly.ai },
                  { name: "Infraestrutura (Railway+Neon+Vercel)", value: ROI.costMonthly.infra },
                  { name: "Manutencao dev (5h/mes)", value: ROI.costMonthly.dev },
                ].map(function(item) {
                  return (
                    <div key={item.name} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0", fontSize: "10px", borderBottom: "1px solid " + C.border,
                    }}>
                      <span style={{ color: C.textMuted }}>{item.name}</span>
                      <span style={{ color: C.red, fontWeight: 700 }}>R${item.value}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", fontSize: "12px", fontWeight: 800 }}>
                  <span style={{ color: C.text }}>TOTAL</span>
                  <span style={{ color: C.red }}>R${ROI.costMonthly.total}/mes</span>
                </div>
              </div>

              {/* Economy */}
              <div style={{ flex: 1, minWidth: "260px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.green, marginBottom: "10px" }}>ECONOMIA GERADA</div>
                {[
                  { name: "Vendedor: 2h/dia economizadas", value: ROI.economyMonthly.vendedor },
                  { name: "Coordenador: 1h/dia economizada", value: ROI.economyMonthly.coordenador },
                  { name: "Conversao +15% (resposta rapida)", value: ROI.economyMonthly.conversao },
                  { name: "Reducao de retrabalho (erros)", value: ROI.economyMonthly.retrabalho },
                ].map(function(item) {
                  return (
                    <div key={item.name} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0", fontSize: "10px", borderBottom: "1px solid " + C.border,
                    }}>
                      <span style={{ color: C.textMuted }}>{item.name}</span>
                      <span style={{ color: C.green, fontWeight: 700 }}>R${item.value.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", fontSize: "12px", fontWeight: 800 }}>
                  <span style={{ color: C.text }}>TOTAL</span>
                  <span style={{ color: C.green }}>R${ROI.economyMonthly.total.toLocaleString()}/mes</span>
                </div>
              </div>
            </div>

            {/* Key numbers */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { label: "Custo por lead (antes)", value: "R$25", color: C.red },
                { label: "Custo por lead (agora)", value: "R$0,03", color: C.green },
                { label: "Tempo resposta (antes)", value: "2 horas", color: C.red },
                { label: "Tempo resposta (agora)", value: "5 min", color: C.green },
                { label: "Acuracia classificacao", value: "94.5%", color: C.cyan },
                { label: "Reducao custo", value: "99.9%", color: C.green },
              ].map(function(m) {
                return (
                  <div key={m.label} style={{
                    flex: 1, minWidth: "90px", padding: "10px 6px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "7px", color: C.textDim }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== CERTIFICATE =================== */}
        {activeTab === "cert" && (
          <div>
            <div style={{
              padding: "32px 24px", borderRadius: "14px", textAlign: "center",
              background: "linear-gradient(135deg, " + C.bg + ", " + C.surface + ")",
              border: "2px solid " + C.amber + "44",
              boxShadow: "0 0 40px " + C.amber + "08",
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: C.amber, fontWeight: 700, marginBottom: "20px" }}>CERTIFICADO DE CONCLUSAO</div>

              <div style={{ width: "60px", height: "2px", background: C.amber + "44", margin: "0 auto 20px" }} />

              <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginBottom: "8px" }}>
                AI Engineering
              </div>
              <div style={{ fontSize: "13px", color: C.textMuted, marginBottom: "24px" }}>
                Curso Completo de Engenharia de IA Aplicada
              </div>

              <div style={{ fontSize: "11px", color: C.textDim, lineHeight: 2, marginBottom: "24px" }}>
                <div>{CHAPTERS.length} capitulos | {TOTAL_MODULES} modulos | {TOTAL_LABS} laboratorios | {TOTAL_INTEGRATORS} projetos integradores</div>
                <div>Projeto real: Costa Lima Piscinas — ERP com IA integrada</div>
                <div>De fundamentos de IA ate Security Operations Center</div>
              </div>

              <div style={{ width: "60px", height: "2px", background: C.amber + "44", margin: "0 auto 20px" }} />

              {/* Skills acquired */}
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>COMPETENCIAS ADQUIRIDAS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center", marginBottom: "24px" }}>
                {[
                  "Prompt Engineering", "APIs de IA", "MCP Protocol", "Agentes Autonomos",
                  "UX com IA", "CI/CD com AI Tests", "Observabilidade", "LGPD + Compliance",
                  "Custos e ROI", "Gestao de Produto", "RAG + Embeddings", "Hybrid Search",
                  "Fine-Tuning (LoRA)", "Destilacao", "MLOps", "Red Teaming",
                  "Incident Response", "Seguranca LLM",
                ].map(function(skill) {
                  return (
                    <span key={skill} style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "9px",
                      background: C.surfaceAlt, border: "1px solid " + C.border,
                      color: C.textMuted,
                    }}>{skill}</span>
                  );
                })}
              </div>

              <div style={{ width: "60px", height: "2px", background: C.amber + "44", margin: "0 auto 20px" }} />

              <div style={{ fontSize: "12px", color: C.amber, fontWeight: 700 }}>
                Marco 2026
              </div>
              <div style={{ fontSize: "10px", color: C.textDim, marginTop: "8px" }}>
                "AI Engineering nao e saber usar uma API.<br />E saber construir, deployar, monitorar, proteger, medir e melhorar<br />um sistema completo que gera valor real para o negocio."
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
