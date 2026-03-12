import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// PIPELINE STAGES
// ============================================================
var PIPELINE_STAGES = [
  {
    name: "Install",
    icon: "\uD83D\uDCE6",
    duration: "12s",
    status: "pass",
    details: "npm ci (backend + frontend)\n3,247 packages | 0 vulnerabilities",
  },
  {
    name: "Lint",
    icon: "\uD83D\uDD0D",
    duration: "4s",
    status: "pass",
    details: "eslint: 342 files checked\n0 errors | 2 warnings (unused imports)",
  },
  {
    name: "Type Check",
    icon: "\uD83D\uDCDD",
    duration: "8s",
    status: "pass",
    details: "tsc --noEmit\n0 errors | 0 any remaining in services/",
  },
  {
    name: "Unit Tests",
    icon: "\uD83E\uDDEA",
    duration: "6s",
    status: "pass",
    details: "vitest run\n 72 tests | 72 passed | 0 failed\n Coverage: 78% statements",
  },
  {
    name: "AI Tests",
    icon: "\uD83E\uDD16",
    duration: "15s",
    status: "pass",
    details: "Prompt regression (8 golden tests): ALL PASS\nSchema validation (5 templates): ALL PASS\nCost guards (< $0.001/classify): ALL PASS\nFallback test (API down): PASS\n\nTotal AI cost for tests: $0.012",
    isNew: true,
  },
  {
    name: "Integration",
    icon: "\uD83D\uDD17",
    duration: "18s",
    status: "pass",
    details: "API endpoints: 45 tests | 45 passed\nAuth flow: OK\nPrisma queries: OK\nS3 upload: OK (mocked)\nAI service: OK (mocked)",
  },
  {
    name: "E2E Tests",
    icon: "\uD83C\uDFAD",
    duration: "45s",
    status: "pass",
    details: "Playwright: 12 scenarios\n- Login flow: PASS (1.2s)\n- Create orcamento: PASS (3.8s)\n- OS no PWA: PASS (2.9s)\n- Semantic search: PASS (1.5s)\n- Agent chat: PASS (4.2s)\nTotal: 12 passed | 0 failed",
    isNew: true,
  },
  {
    name: "Build",
    icon: "\uD83D\uDCE6",
    duration: "22s",
    status: "pass",
    details: "Backend: tsc compiled (0 errors)\nAdmin: next build (3.2MB)\nPWA: next build (1.8MB)\nAll builds successful",
  },
  {
    name: "Deploy",
    icon: "\uD83D\uDE80",
    duration: "35s",
    status: "pass",
    details: "Backend -> Railway (v1.24.0)\nAdmin -> Vercel (preview: ok, prod: deploying)\nPWA -> Vercel (deploying)\nMigrations: 0 pending\nHealth check: waiting...",
  },
  {
    name: "Health Check",
    icon: "\u2764",
    duration: "5s",
    status: "pass",
    details: 'GET /health -> 200\n{\n  status: "healthy",\n  database: "ok" (12ms),\n  ai: "ok" (Haiku: 340ms),\n  mcp: "ok" (6 tools),\n  fallback: "standby"\n}',
    isNew: true,
  },
  {
    name: "Notify",
    icon: "\uD83D\uDD14",
    duration: "2s",
    status: "pass",
    details: "Slack #deploys: v1.24.0 deployed\nAll checks passed | AI cost: $0.012\nRollback: armed (auto if error > 5% in 10min)",
  },
];

// Failed pipeline variant
var PIPELINE_FAILED = [
  { name: "Install", icon: "\uD83D\uDCE6", duration: "12s", status: "pass", details: "npm ci OK" },
  { name: "Lint", icon: "\uD83D\uDD0D", duration: "4s", status: "pass", details: "0 errors" },
  { name: "Type Check", icon: "\uD83D\uDCDD", duration: "8s", status: "pass", details: "0 errors" },
  { name: "Unit Tests", icon: "\uD83E\uDDEA", duration: "6s", status: "pass", details: "72 passed" },
  {
    name: "AI Tests",
    icon: "\uD83E\uDD16",
    duration: "15s",
    status: "fail",
    details: "Prompt regression: 6/8 PASS, 2 FAIL\n\nFAILED: classificar_lead golden #3\n  Input: 'Quero reforma da piscina'\n  Expected: REFORMA\n  Got: CONSTRUCAO\n  (prompt template changed in this PR)\n\nFAILED: classificar_lead golden #7\n  Input: 'Preciso de manutencao mensal'\n  Expected: MANUTENCAO\n  Got: SERVICO\n  (new category not in golden set)\n\nPIPELINE BLOCKED: Fix golden tests or update expected outputs",
    isNew: true,
  },
];

// ============================================================
// COST MONITORING DATA
// ============================================================
var COST_DATA = {
  today: { haiku: 0.42, sonnet: 1.85, total: 2.27, budget: 10.00 },
  week: [
    { day: "Seg", cost: 2.10, calls: 312 },
    { day: "Ter", cost: 1.85, calls: 278 },
    { day: "Qua", cost: 3.20, calls: 445 },
    { day: "Qui", cost: 2.50, calls: 356 },
    { day: "Sex", cost: 2.27, calls: 334 },
  ],
  byFeature: [
    { name: "Classificar leads", model: "Haiku", calls: 890, cost: 0.71, pct: 31 },
    { name: "Gerar respostas WhatsApp", model: "Haiku", calls: 620, cost: 0.50, pct: 22 },
    { name: "Analisar fotos (Vision)", model: "Sonnet", calls: 85, cost: 1.28, pct: 56 },
    { name: "Agent pipeline", model: "Mixed", calls: 130, cost: 0.78, pct: 34 },
    { name: "Chat copiloto", model: "Haiku", calls: 340, cost: 0.27, pct: 12 },
    { name: "Testes CI/CD", model: "Haiku", calls: 60, cost: 0.05, pct: 2 },
  ],
  monthTotal: 68.40,
  monthBudget: 150.00,
};

// ============================================================
// ENVIRONMENT CONFIG
// ============================================================
var ENV_CONFIG = [
  { key: "DATABASE_URL", value: "postgresql://...@neon.tech/costalima", sensitive: true, category: "Infra" },
  { key: "ANTHROPIC_API_KEY", value: "sk-ant-api03-...", sensitive: true, category: "IA" },
  { key: "AI_MODEL_DEFAULT", value: "claude-haiku-4-5-20251001", sensitive: false, category: "IA" },
  { key: "AI_MODEL_VISION", value: "claude-sonnet-4-6", sensitive: false, category: "IA" },
  { key: "AI_MAX_COST_PER_REQUEST", value: "0.05", sensitive: false, category: "IA" },
  { key: "AI_MAX_COST_PER_DAY", value: "10.00", sensitive: false, category: "IA" },
  { key: "AI_FALLBACK_ENABLED", value: "true", sensitive: false, category: "IA" },
  { key: "AI_LOG_PROMPTS", value: "false", sensitive: false, category: "IA (LGPD)" },
  { key: "JWT_SECRET", value: "...", sensitive: true, category: "Auth" },
  { key: "S3_ACCESS_KEY", value: "AKIA...", sensitive: true, category: "Storage" },
  { key: "ZAPI_TOKEN", value: "...", sensitive: true, category: "Integracoes" },
  { key: "CONTA_AZUL_CLIENT_ID", value: "...", sensitive: true, category: "Integracoes" },
];

// ============================================================
// COMPONENTS
// ============================================================

function PipelineStage(props) {
  var stage = props.stage;
  var visible = props.visible;
  var isActive = props.isActive;
  if (!visible) return null;

  var statusColors = { pass: C.green, fail: C.red, running: C.amber, skip: C.textDim };
  var sc = statusColors[stage.status] || C.textDim;

  return (
    <div style={{
      display: "flex", gap: "10px", marginBottom: "6px",
      opacity: isActive ? 1 : 0.85,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: sc + "20", border: "2px solid " + sc,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "10px",
        }}>
          {stage.status === "pass" ? "\u2713" : stage.status === "fail" ? "\u2717" : stage.icon}
        </div>
        <div style={{ width: "2px", flex: 1, background: C.border, minHeight: "6px" }} />
      </div>
      <div style={{
        flex: 1, padding: "10px 12px", borderRadius: "8px",
        background: stage.status === "fail" ? C.red + "08" : C.surfaceAlt,
        border: "1px solid " + (stage.status === "fail" ? C.red + "22" : C.border),
        marginBottom: "2px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: stage.status === "fail" ? C.red : C.text }}>{stage.name}</span>
          {stage.isNew && (
            <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px", background: C.cyan + "15", color: C.cyan }}>NOVO (IA)</span>
          )}
          <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>{stage.duration}</span>
          <span style={{
            fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
            background: sc + "15", color: sc,
          }}>{stage.status.toUpperCase()}</span>
        </div>
        <pre style={{
          margin: 0, fontSize: "9px", color: stage.status === "fail" ? C.red : C.textMuted,
          lineHeight: 1.4, whiteSpace: "pre-wrap", fontFamily: "inherit",
          maxHeight: "120px", overflowY: "auto",
        }}>
          {stage.details}
        </pre>
      </div>
    </div>
  );
}

function CostBar(props) {
  var item = props.item;
  var maxCost = props.maxCost;
  var pct = maxCost > 0 ? (item.cost / maxCost * 100) : 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 0", fontSize: "11px",
    }}>
      <span style={{ color: C.text, width: "180px" }}>{item.name}</span>
      <div style={{ flex: 1, height: "6px", background: C.bg, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: Math.min(pct, 100) + "%", height: "100%", background: C.cyan, borderRadius: "3px" }} />
      </div>
      <span style={{ color: C.amber, fontWeight: 700, width: "55px", textAlign: "right" }}>${item.cost.toFixed(2)}</span>
      <span style={{ color: C.textDim, width: "50px", textAlign: "right" }}>{item.calls} calls</span>
      <span style={{ color: C.textDim, fontSize: "9px", width: "35px", textAlign: "right" }}>{item.model}</span>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function CICDLab() {
  var [activeTab, setActiveTab] = useState("pipeline");
  var [pipelineType, setPipelineType] = useState("success");
  var [visibleStages, setVisibleStages] = useState(0);
  var [playing, setPlaying] = useState(false);

  var pipeline = pipelineType === "success" ? PIPELINE_STAGES : PIPELINE_FAILED;

  var runPipeline = useCallback(function(type) {
    setPipelineType(type);
    setVisibleStages(0);
    setPlaying(true);
    var p = type === "success" ? PIPELINE_STAGES : PIPELINE_FAILED;
    p.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleStages(i + 1);
        if (i === p.length - 1) setPlaying(false);
      }, (i + 1) * 500);
    });
  }, []);

  var totalDuration = pipeline.reduce(function(s, st) { return s + parseInt(st.duration); }, 0);
  var passed = pipeline.filter(function(s) { return s.status === "pass"; }).length;
  var failed = pipeline.filter(function(s) { return s.status === "fail"; }).length;
  var aiStages = pipeline.filter(function(s) { return s.isNew; }).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.green, padding: "4px 10px", borderRadius: "4px",
            background: C.green + "12", border: "1px solid " + C.green + "33",
          }}>Cap 6 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            CI/CD e Deploy com IA
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Pipeline | Testes de IA | Custos | Health checks | Rollback
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "pipeline", label: "Pipeline CI/CD" },
            { id: "costs", label: "Monitoramento de Custos" },
            { id: "env", label: "Env & Secrets" },
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

        {/* PIPELINE */}
        {activeTab === "pipeline" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button onClick={function() { runPipeline("success"); }} disabled={playing} style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: playing ? C.surfaceAlt : C.green,
                color: playing ? C.textDim : "#fff", fontSize: "11px",
                fontWeight: 700, fontFamily: "inherit", cursor: playing ? "default" : "pointer",
              }}>
                {"\u25B6"} Pipeline com sucesso (11 stages)
              </button>
              <button onClick={function() { runPipeline("failed"); }} disabled={playing} style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: playing ? C.surfaceAlt : C.red,
                color: playing ? C.textDim : "#fff", fontSize: "11px",
                fontWeight: 700, fontFamily: "inherit", cursor: playing ? "default" : "pointer",
              }}>
                {"\u25B6"} Pipeline falhando (AI test fail)
              </button>
            </div>

            {visibleStages > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1.5, minWidth: "380px" }}>
                  {pipeline.map(function(stage, i) {
                    return (
                      <PipelineStage
                        key={i}
                        stage={stage}
                        visible={i < visibleStages}
                        isActive={i === visibleStages - 1}
                      />
                    );
                  })}
                  {playing && (
                    <div style={{ textAlign: "center", padding: "8px", color: C.amber, fontSize: "11px" }}>
                      Stage {visibleStages + 1}/{pipeline.length}...
                    </div>
                  )}
                </div>

                <div style={{ flex: 0.7, minWidth: "200px" }}>
                  <div style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "14px",
                  }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>PIPELINE SUMMARY</div>
                    {[
                      { label: "Stages", value: Math.min(visibleStages, pipeline.length) + "/" + pipeline.length, color: C.text },
                      { label: "Passed", value: pipeline.slice(0, visibleStages).filter(function(s) { return s.status === "pass"; }).length, color: C.green },
                      { label: "Failed", value: pipeline.slice(0, visibleStages).filter(function(s) { return s.status === "fail"; }).length, color: C.red },
                      { label: "AI-specific", value: pipeline.slice(0, visibleStages).filter(function(s) { return s.isNew; }).length, color: C.cyan },
                      { label: "Duration", value: totalDuration + "s", color: C.amber },
                      { label: "Status", value: failed > 0 ? "FAILED" : visibleStages >= pipeline.length ? "PASSED" : "RUNNING", color: failed > 0 ? C.red : visibleStages >= pipeline.length ? C.green : C.amber },
                    ].map(function(m, i) {
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "4px 0", fontSize: "10px",
                          borderBottom: i < 5 ? "1px solid " + C.border : "none",
                        }}>
                          <span style={{ color: C.textMuted }}>{m.label}</span>
                          <span style={{ color: m.color, fontWeight: 700 }}>{m.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COSTS */}
        {activeTab === "costs" && (
          <div>
            {/* Top metrics */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Hoje", value: "$" + COST_DATA.today.total.toFixed(2), sub: "de $" + COST_DATA.today.budget.toFixed(2) + " budget", color: COST_DATA.today.total > COST_DATA.today.budget * 0.8 ? C.amber : C.green, pct: (COST_DATA.today.total / COST_DATA.today.budget * 100).toFixed(0) + "%" },
                { label: "Haiku", value: "$" + COST_DATA.today.haiku.toFixed(2), sub: "input + output", color: C.cyan },
                { label: "Sonnet", value: "$" + COST_DATA.today.sonnet.toFixed(2), sub: "vision + agents", color: C.purple },
                { label: "Mes", value: "$" + COST_DATA.monthTotal.toFixed(2), sub: "de $" + COST_DATA.monthBudget.toFixed(2), color: C.amber, pct: (COST_DATA.monthTotal / COST_DATA.monthBudget * 100).toFixed(0) + "%" },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "100px", padding: "12px 10px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{s.sub}</div>
                    {s.pct && <div style={{ fontSize: "9px", color: s.color, fontWeight: 700, marginTop: "2px" }}>{s.pct} do budget</div>}
                  </div>
                );
              })}
            </div>

            {/* Weekly bar chart */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>CUSTO SEMANAL</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "60px" }}>
                {COST_DATA.week.map(function(d) {
                  var h = (d.cost / 4) * 60;
                  return (
                    <div key={d.day} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        height: h + "px", background: d.cost > 3 ? C.amber : C.cyan,
                        borderRadius: "3px 3px 0 0", margin: "0 auto", width: "80%",
                      }} />
                      <div style={{ fontSize: "8px", color: C.textDim, marginTop: "4px" }}>{d.day}</div>
                      <div style={{ fontSize: "8px", color: C.textMuted }}>${d.cost.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By feature */}
            <div style={{
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "10px", padding: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>CUSTO POR FEATURE</div>
              {COST_DATA.byFeature.map(function(item) {
                return <CostBar key={item.name} item={item} maxCost={1.5} />;
              })}
              <div style={{
                marginTop: "8px", paddingTop: "8px", borderTop: "1px solid " + C.border,
                display: "flex", justifyContent: "space-between", fontSize: "11px",
              }}>
                <span style={{ color: C.textMuted }}>Insight: Vision (Sonnet) e 56% do custo com 4% das chamadas</span>
                <span style={{ color: C.amber, fontWeight: 700 }}>Otimizar: cache de fotos</span>
              </div>
            </div>
          </div>
        )}

        {/* ENV */}
        {activeTab === "env" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Variaveis de ambiente do Costa Lima em producao. Secrets em vermelho, config de IA em ciano.
            </p>
            <div style={{
              background: "#0a0e14", border: "1px solid " + C.border,
              borderRadius: "10px", overflow: "hidden",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <div style={{
                padding: "8px 14px", background: "#111827",
                borderBottom: "1px solid " + C.border,
                fontSize: "10px", color: C.textDim,
              }}>
                .env.production (Railway)
              </div>
              <div style={{ padding: "12px 14px" }}>
                {ENV_CONFIG.map(function(env, i) {
                  var isIA = env.category.startsWith("IA");
                  return (
                    <div key={i} style={{
                      display: "flex", gap: "8px", marginBottom: "4px",
                      fontSize: "11px", fontFamily: "inherit",
                    }}>
                      <span style={{
                        fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                        background: isIA ? C.cyan + "15" : C.textDim + "15",
                        color: isIA ? C.cyan : C.textDim,
                        width: "60px", textAlign: "center", lineHeight: "16px",
                      }}>{env.category}</span>
                      <span style={{ color: C.amber }}>{env.key}</span>
                      <span style={{ color: C.textDim }}>=</span>
                      <span style={{ color: env.sensitive ? C.red : C.green }}>
                        {env.sensitive ? "***" + env.value.slice(-4) : env.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.red + "08", border: "1px solid " + C.red + "22",
              fontSize: "10px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.red, fontWeight: 700 }}>Regras de secrets:</span>
              {" "}Nunca commitar no Git. Rotacionar API keys trimestralmente. Keys diferentes para staging/prod. AI_LOG_PROMPTS=false em producao (LGPD). Budget limits como env vars.
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "O que muda com IA no pipeline",
                color: C.cyan,
                text: "5 desafios novos:\n\n1. SECRETS DE API: sem ANTHROPIC_API_KEY, o sistema degrada. Fallback obrigatorio.\n2. CUSTOS VARIAVEIS: cada request tem custo. Agente com bug = $100 em minutos. Budget monitoring.\n3. LATENCIA: Haiku 300-800ms, Sonnet 1-3s, Opus 3-10s. Timeouts diferentes.\n4. PROMPTS COMO CODIGO: template mudou = comportamento mudou. Versionamento + golden tests.\n5. LGPD: dados pessoais no contexto do LLM. Nao logar prompts em producao.",
              },
              {
                title: "Testes especificos para IA",
                color: C.purple,
                text: "PROMPT REGRESSION (golden tests):\n  Inputs com outputs conhecidos. Se o prompt muda e golden falha, PR bloqueado.\n\nSCHEMA VALIDATION:\n  Toda resposta do LLM validada com Zod. Se schema falha = bug.\n\nCOST GUARDS:\n  Classificacao < $0.001. Pipeline < $0.01. Agente < $0.05.\n  Se custos sobem, investigar.\n\nFALLBACK TEST:\n  Mock API de IA como indisponivel. Sistema deve funcionar com regras.\n\nE2E COM IA:\n  Playwright testa fluxos que incluem LLM (chat, busca semantica, classificacao).",
              },
              {
                title: "Health check com IA",
                color: C.green,
                text: 'GET /health retorna:\n{\n  status: "healthy" | "degraded",\n  database: "ok" | "down",\n  ai: "ok" | "down",\n  mcp: "ok" | "down" (N tools),\n  fallback: "active" | "standby"\n}\n\nSe ai="down" mas fallback="active": sistema DEGRADADO mas funcionando.\nSe database="down": sistema FORA. Rollback imediato.\n\nRollback automatico: se erro > 5% nos primeiros 10min pos-deploy.',
              },
              {
                title: "Pipeline do Costa Lima real",
                color: C.amber,
                text: "Push -> GitHub Actions:\n  1. Install (12s)\n  2. Lint (4s)\n  3. Type check (8s)\n  4. Unit tests - Vitest 72+ testes (6s)\n  5. AI tests - golden + schema + cost + fallback (15s)  <-- NOVO\n  6. Integration (18s)\n  7. E2E - Playwright 12 cenarios (45s)  <-- NOVO\n  8. Build (22s)\n  9. Deploy: Railway (backend) + Vercel (frontends)\n  10. Health check com IA\n  11. Notify Slack\n\nTotal: ~3min. Se AI tests falham, deploy bloqueado.",
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
