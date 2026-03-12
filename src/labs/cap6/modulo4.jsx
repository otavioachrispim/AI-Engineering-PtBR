import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// COST CALCULATOR DATA
// ============================================================
var FEATURES = [
  { id: "classify", name: "Classificar leads", model: "Haiku", tokensIn: 280, tokensOut: 95, costPer: 0.0005, defaultVolume: 30, unit: "leads/dia", category: "Comercial" },
  { id: "whatsapp", name: "Resposta WhatsApp", model: "Haiku", tokensIn: 350, tokensOut: 150, costPer: 0.001, defaultVolume: 25, unit: "msgs/dia", category: "Comercial" },
  { id: "vision", name: "Analisar foto", model: "Sonnet", tokensIn: 1500, tokensOut: 500, costPer: 0.015, defaultVolume: 5, unit: "fotos/dia", category: "Operacional" },
  { id: "chat", name: "Chat copiloto", model: "Haiku", tokensIn: 400, tokensOut: 200, costPer: 0.001, defaultVolume: 50, unit: "turnos/dia", category: "Geral" },
  { id: "agent", name: "Agent pipeline", model: "Mixed", tokensIn: 2000, tokensOut: 800, costPer: 0.02, defaultVolume: 10, unit: "runs/dia", category: "Automacao" },
  { id: "report", name: "Relatorios IA", model: "Sonnet", tokensIn: 1200, tokensOut: 600, costPer: 0.012, defaultVolume: 3, unit: "por dia", category: "Gestao" },
  { id: "smartfill", name: "Smart fill orcamento", model: "Haiku", tokensIn: 300, tokensOut: 100, costPer: 0.0006, defaultVolume: 8, unit: "orcamentos/dia", category: "Comercial" },
  { id: "cicd", name: "Testes CI/CD", model: "Haiku", tokensIn: 200, tokensOut: 80, costPer: 0.0004, defaultVolume: 5, unit: "deploys/dia", category: "DevOps" },
];

var OPTIMIZATIONS = [
  { id: "cache_exact", name: "Cache exato", saving: 0.38, effort: "baixo", desc: "Mesma query = mesmo resultado. TTL 1-24h." },
  { id: "cache_semantic", name: "Cache semantico", saving: 0.12, effort: "medio", desc: "Queries similares (embedding > 0.95) reusam cache." },
  { id: "cache_image", name: "Cache de imagem", saving: 0.08, effort: "baixo", desc: "SHA256(foto) -> resultado anterior. TTL 7 dias." },
  { id: "model_routing", name: "Model routing", saving: 0.15, effort: "baixo", desc: "Haiku onde Sonnet nao e necessario." },
  { id: "prompt_opt", name: "Prompt optimization", saving: 0.10, effort: "medio", desc: "System prompts enxutos, structured output, contexto comprimido." },
  { id: "batch", name: "Batch API (50% off)", saving: 0.05, effort: "baixo", desc: "Processamento noturno com desconto." },
  { id: "fallback_rules", name: "Fallback para regras", saving: 0.08, effort: "medio", desc: "Regex/keywords para casos obvios, LLM so para ambiguidade." },
];

var INFRA_COSTS = [
  { name: "Railway (backend)", cost: 20 },
  { name: "Vercel (frontends)", cost: 0 },
  { name: "Neon PostgreSQL", cost: 19 },
  { name: "Redis (Upstash)", cost: 0 },
  { name: "Dominio + SSL", cost: 4 },
];

var ECONOMY_ITEMS = [
  { name: "Vendedor: 2h/dia economizadas", hoursSaved: 44, hourRate: 50, monthly: 2200 },
  { name: "Coordenador: 1h/dia economizada", hoursSaved: 22, hourRate: 60, monthly: 1320 },
  { name: "Conversao +15% (resposta rapida)", hoursSaved: 0, hourRate: 0, monthly: 10000 },
  { name: "Reducao retrabalho (erros OS)", hoursSaved: 0, hourRate: 0, monthly: 500 },
];

var ROADMAP = [
  {
    phase: 1, name: "Fundacao", months: "Mes 1-2", color: C.green,
    features: ["Classificacao de leads (Haiku)", "Copiloto basico (MCP 6 tools)", "Cache exato", "Pipeline CI/CD com AI tests"],
    cost: 70, roi: "500%",
  },
  {
    phase: 2, name: "Expansao", months: "Mes 3-4", color: C.cyan,
    features: ["Agentes multi-step", "Vision para fotos de vistoria", "Smart fill em orcamentos", "Cache semantico"],
    cost: 200, roi: "1200%",
  },
  {
    phase: 3, name: "Inteligencia", months: "Mes 5-6", color: C.purple,
    features: ["Busca semantica global (pgvector)", "Personalizacao por uso", "Sugestoes contextuais", "Batch processing noturno"],
    cost: 350, roi: "1800%",
  },
  {
    phase: 4, name: "Automacao", months: "Mes 7+", color: C.orange,
    features: ["Agentes autonomos recorrentes", "Multi-MCP (Calendar, Gmail)", "Chat embutido no PWA", "Fine-tune para tarefas especificas"],
    cost: 500, roi: "2000%+",
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function CostCalculator() {
  var [volumes, setVolumes] = useState(function() {
    var v = {};
    FEATURES.forEach(function(f) { v[f.id] = f.defaultVolume; });
    return v;
  });
  var [activeOptimizations, setActiveOptimizations] = useState({ cache_exact: true, model_routing: true });

  var toggleOpt = function(id) {
    var n = Object.assign({}, activeOptimizations);
    if (n[id]) delete n[id]; else n[id] = true;
    setActiveOptimizations(n);
  };

  // Calculate costs
  var dailyCost = 0;
  var featureCosts = FEATURES.map(function(f) {
    var vol = volumes[f.id] || 0;
    var daily = vol * f.costPer;
    dailyCost += daily;
    return { feature: f, daily: daily, monthly: daily * 30 };
  });

  var totalSaving = 0;
  Object.keys(activeOptimizations).forEach(function(id) {
    var opt = OPTIMIZATIONS.find(function(o) { return o.id === id; });
    if (opt) totalSaving += opt.saving;
  });
  totalSaving = Math.min(totalSaving, 0.75); // cap at 75%

  var optimizedDaily = dailyCost * (1 - totalSaving);
  var monthlyCost = optimizedDaily * 30;
  var infraCost = INFRA_COSTS.reduce(function(s, i) { return s + i.cost; }, 0);
  var devCost = 500; // manutenção mensal
  var totalMonthly = monthlyCost + infraCost + devCost;

  var totalEconomy = ECONOMY_ITEMS.reduce(function(s, e) { return s + e.monthly; }, 0);
  var roi = totalMonthly > 0 ? ((totalEconomy - totalMonthly) / totalMonthly * 100).toFixed(0) : 0;

  // BRL conversion
  var brlRate = 5.8;

  return (
    <div>
      {/* Feature volumes */}
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>VOLUME POR FEATURE</div>
      <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
        {FEATURES.map(function(f, i) {
          var vol = volumes[f.id] || 0;
          var daily = vol * f.costPer;
          var modelColor = f.model === "Haiku" ? C.green : f.model === "Sonnet" ? C.purple : C.amber;
          return (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 14px", fontSize: "11px",
              borderBottom: i < FEATURES.length - 1 ? "1px solid " + C.border : "none",
            }}>
              <span style={{ color: C.text, flex: 1, fontWeight: 600 }}>{f.name}</span>
              <span style={{ fontSize: "8px", color: modelColor, fontWeight: 700 }}>{f.model}</span>
              <input type="range" min="0" max={f.defaultVolume * 3} value={vol}
                onChange={function(e) {
                  var nv = Object.assign({}, volumes);
                  nv[f.id] = parseInt(e.target.value);
                  setVolumes(nv);
                }}
                style={{ width: "80px", accentColor: C.cyan }}
              />
              <span style={{ color: C.cyan, fontWeight: 700, width: "35px", textAlign: "right" }}>{vol}</span>
              <span style={{ color: C.textDim, fontSize: "9px", width: "55px" }}>{f.unit}</span>
              <span style={{ color: C.amber, fontWeight: 700, width: "55px", textAlign: "right" }}>${daily.toFixed(3)}/d</span>
            </div>
          );
        })}
      </div>

      {/* Optimizations */}
      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>OTIMIZACOES (clique para ativar/desativar)</div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "14px" }}>
        {OPTIMIZATIONS.map(function(opt) {
          var isActive = activeOptimizations[opt.id];
          return (
            <button key={opt.id} onClick={function() { toggleOpt(opt.id); }} style={{
              padding: "6px 10px", borderRadius: "6px", fontSize: "9px",
              fontFamily: "inherit", cursor: "pointer",
              border: "1px solid " + (isActive ? C.green : C.border),
              background: isActive ? C.green + "12" : "transparent",
              color: isActive ? C.green : C.textDim,
              fontWeight: isActive ? 700 : 400,
            }}>
              {opt.name} (-{(opt.saving * 100).toFixed(0)}%)
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        {[
          { label: "Custo IA bruto/mes", value: "$" + (dailyCost * 30).toFixed(2), sub: "R$" + (dailyCost * 30 * brlRate).toFixed(0), color: C.red },
          { label: "Economia otimizacoes", value: "-" + (totalSaving * 100).toFixed(0) + "%", sub: "-$" + ((dailyCost - optimizedDaily) * 30).toFixed(2) + "/mes", color: C.green },
          { label: "Custo IA otimizado/mes", value: "$" + monthlyCost.toFixed(2), sub: "R$" + (monthlyCost * brlRate).toFixed(0), color: C.cyan },
          { label: "Total mensal (IA+infra+dev)", value: "R$" + (totalMonthly * brlRate).toFixed(0), sub: "$" + totalMonthly.toFixed(0), color: C.amber },
          { label: "Economia gerada/mes", value: "R$" + totalEconomy.toLocaleString(), sub: "tempo + conversao", color: C.green },
          { label: "ROI", value: roi + "%", sub: "retorno sobre investimento", color: parseInt(roi) > 500 ? C.green : C.amber },
        ].map(function(m) {
          return (
            <div key={m.label} style={{
              flex: 1, minWidth: "90px", padding: "12px 8px",
              background: C.surface, border: "1px solid " + C.border,
              borderRadius: "8px", textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{m.label}</div>
              <div style={{ fontSize: "8px", color: C.textDim }}>{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Breakdown */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {/* AI cost by feature */}
        <div style={{ flex: 1, minWidth: "280px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>CUSTO IA POR FEATURE (otimizado)</div>
          {featureCosts.filter(function(fc) { return fc.daily > 0; }).sort(function(a, b) { return b.monthly - a.monthly; }).map(function(fc) {
            var optimized = fc.monthly * (1 - totalSaving);
            var maxMonthly = featureCosts.reduce(function(m, f) { return Math.max(m, f.monthly); }, 0.01);
            return (
              <div key={fc.feature.id} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "4px 0", fontSize: "10px",
              }}>
                <span style={{ color: C.textMuted, width: "140px" }}>{fc.feature.name}</span>
                <div style={{ flex: 1, height: "4px", background: C.bg, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: (fc.monthly / maxMonthly * 100) + "%", height: "100%", background: C.cyan, borderRadius: "2px" }} />
                </div>
                <span style={{ color: C.amber, fontWeight: 700, width: "50px", textAlign: "right" }}>R${(optimized * brlRate).toFixed(0)}</span>
              </div>
            );
          })}
        </div>

        {/* Economy breakdown */}
        <div style={{ flex: 1, minWidth: "280px", background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>ECONOMIA GERADA</div>
          {ECONOMY_ITEMS.map(function(e) {
            return (
              <div key={e.name} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 0", fontSize: "10px",
                borderBottom: "1px solid " + C.border,
              }}>
                <span style={{ color: C.textMuted, flex: 1 }}>{e.name}</span>
                <span style={{ color: C.green, fontWeight: 700 }}>R${e.monthly.toLocaleString()}</span>
              </div>
            );
          })}
          <div style={{
            display: "flex", justifyContent: "space-between",
            paddingTop: "8px", fontSize: "12px", fontWeight: 800,
          }}>
            <span style={{ color: C.text }}>TOTAL</span>
            <span style={{ color: C.green }}>R${totalEconomy.toLocaleString()}/mes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function CostStrategyLab() {
  var [activeTab, setActiveTab] = useState("calculator");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.amber, padding: "4px 10px", borderRadius: "4px",
            background: C.amber + "12", border: "1px solid " + C.amber + "33",
          }}>Cap 6 - Modulo 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Custos, Otimizacao e Estrategia
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Calculadora de custos | Otimizador | ROI | Roadmap estrategico
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "calculator", label: "Calculadora de Custos" },
            { id: "roadmap", label: "Roadmap" },
            { id: "guide", label: "Guia de Otimizacao" },
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

        {/* CALCULATOR */}
        {activeTab === "calculator" && <CostCalculator />}

        {/* ROADMAP */}
        {activeTab === "roadmap" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Estrategia de implementacao progressiva. Cada fase adiciona valor mensuravel antes de avancar.
            </p>

            {ROADMAP.map(function(phase) {
              return (
                <div key={phase.phase} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", marginBottom: "10px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: phase.color + "20", border: "2px solid " + phase.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 800, color: phase.color,
                    }}>{phase.phase}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: phase.color }}>{phase.name}</div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>{phase.months}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: C.amber }}>~R${phase.cost}/mes IA</div>
                      <div style={{ fontSize: "10px", color: C.green }}>ROI: {phase.roi}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {phase.features.map(function(f) {
                        return (
                          <span key={f} style={{
                            padding: "4px 10px", borderRadius: "6px", fontSize: "10px",
                            background: phase.color + "10", border: "1px solid " + phase.color + "22",
                            color: phase.color,
                          }}>{f}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{
              padding: "14px", borderRadius: "10px",
              background: C.green + "08", border: "1px solid " + C.green + "22",
              fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>Principio:</span>
              {" "}Cada fase deve provar ROI antes de avancar para a proxima. Se a Fase 1 nao gera economia mensuravel, nao avance para a Fase 2. Valide com dados reais, nao com estimativas.
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "7 tecnicas de otimizacao (ordenadas por impacto)",
                color: C.cyan,
                text: "1. CACHE EXATO (-38%): mesma query = cache. Implementacao: hash(template+input) como key, Redis/in-memory. Esforco: baixo.\n\n2. MODEL ROUTING (-15%): Haiku para classificacao/chat, Sonnet so para vision/qualidade critica. Esforco: baixo.\n\n3. CACHE SEMANTICO (-12%): queries similares reusam cache via embedding similarity. Esforco: medio (precisa pgvector).\n\n4. PROMPT OPTIMIZATION (-10%): enxugar system prompts, structured output, comprimir contexto. Esforco: medio.\n\n5. CACHE DE IMAGEM (-8%): SHA256(foto) -> resultado anterior. Fotos repetidas (re-analise) nao pagam de novo. Esforco: baixo.\n\n6. FALLBACK PARA REGRAS (-8%): regex/keywords para casos obvios. LLM so para ambiguidade. Esforco: medio.\n\n7. BATCH API (-5%): 50% desconto para processamento noturno. Reclassificacao, relatorios. Esforco: baixo.\n\nTODAS COMBINADAS: ate 75% de reducao de custo.",
              },
              {
                title: "Como apresentar ROI para diretoria",
                color: C.amber,
                text: "NAO DIGA: 'Precisamos de $12/mes para API de IA'\nDIGA: 'Com R$720/mes, economizamos R$14.000/mes em tempo e conversao'\n\nMETRICAS QUE IMPORTAM:\n1. Horas economizadas/mes (vendedor + coordenador)\n2. Tempo de resposta ao lead (antes vs depois)\n3. Conversao de leads (antes vs depois)\n4. Erros evitados (OS errada, classificacao errada)\n5. Custo por lead processado (R$0,03 com IA vs R$25 manual)\n\nGRAFICO KILLER: custo mensal (linha azul, R$720) vs economia (linha verde, R$14.000). A distancia entre as linhas e o ROI.",
              },
              {
                title: "Armadilhas de custo a evitar",
                color: C.red,
                text: "1. AGENT LOOP: agente sem MAX_ITERATIONS entra em loop infinito. Cada iteracao custa. Guardrail: max 10 tool calls.\n\n2. SONNET PRA TUDO: usar Sonnet onde Haiku resolve e 5x mais caro sem ganho de qualidade.\n\n3. SEM CACHE: mesma classificacao executada 100x no dia paga 100x. Cache exato resolve 40%.\n\n4. LOGS EXCESSIVOS: logar prompts completos aumenta custo de storage. Loga metadata, nao conteudo.\n\n5. IMAGENS FULL-RES: mandar foto de 4000x3000 pro Vision custa 4x mais que 768x768. Redimensionar ANTES.\n\n6. OVER-ENGINEERING: Kubernetes + Redis cluster + 5 workers para 50 calls/dia. Comece simples.",
              },
              {
                title: "Metricas de custo para monitorar",
                color: C.green,
                text: "DIARIO:\n  Custo total de IA vs budget ($10/dia default)\n  Custo por feature (qual feature gasta mais?)\n  Cache hit rate (objetivo: >50%)\n\nSEMANAL:\n  Custo por lead processado (deve diminuir com cache)\n  Tokens/hora (tendencia: subindo ou estavel?)\n  Custo de Vision vs resto (normalmente 50-60% do total)\n\nMENSAL:\n  ROI: economia gerada vs custo total\n  Custo per user (divide por usuarios ativos)\n  Projecao: com crescimento atual, quanto custara em 6 meses?",
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
