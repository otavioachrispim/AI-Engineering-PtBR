import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// RICE DATA (editable)
// ============================================================
var FEATURES_DATA = [
  { id: "classify", name: "Classificar leads", reach: 900, impact: 2, confidence: 90, effort: 1, category: "Comercial", status: "production", phase: 1 },
  { id: "whatsapp", name: "Resposta WhatsApp", reach: 750, impact: 2, confidence: 85, effort: 1.5, category: "Comercial", status: "production", phase: 1 },
  { id: "copilot", name: "Copiloto MCP", reach: 660, impact: 1.5, confidence: 70, effort: 2, category: "Geral", status: "production", phase: 1 },
  { id: "smartfill", name: "Smart fill orcamento", reach: 240, impact: 1, confidence: 80, effort: 1, category: "Comercial", status: "development", phase: 2 },
  { id: "agent", name: "Agente completo", reach: 500, impact: 3, confidence: 50, effort: 4, category: "Automacao", status: "development", phase: 2 },
  { id: "vision", name: "Analise de foto", reach: 150, impact: 2, confidence: 60, effort: 2, category: "Operacional", status: "planned", phase: 2 },
  { id: "search", name: "Busca semantica", reach: 1000, impact: 0.5, confidence: 70, effort: 2, category: "UX", status: "planned", phase: 3 },
  { id: "suggestions", name: "Sugestoes contextuais", reach: 800, impact: 0.5, confidence: 60, effort: 1.5, category: "UX", status: "planned", phase: 3 },
  { id: "reports", name: "Relatorios auto", reach: 30, impact: 2, confidence: 80, effort: 1.5, category: "Gestao", status: "idea", phase: 3 },
  { id: "ocr", name: "OCR notas fiscais", reach: 120, impact: 1.5, confidence: 65, effort: 2, category: "Financeiro", status: "idea", phase: 3 },
  { id: "pwa_chat", name: "Chat no PWA", reach: 200, impact: 1, confidence: 55, effort: 3, category: "Operacional", status: "idea", phase: 4 },
  { id: "contracts", name: "Geracao contratos", reach: 50, impact: 1, confidence: 40, effort: 3, category: "Juridico", status: "backlog", phase: 4 },
];

function calcRICE(f) {
  return Math.round((f.reach * f.impact * (f.confidence / 100)) / f.effort);
}

// ============================================================
// PRODUCT METRICS
// ============================================================
var PRODUCT_METRICS = {
  leadResponseTime: { before: 120, after: 5, unit: "min", goal: 15, label: "Tempo resposta lead" },
  conversionRate: { before: 12, after: 17.5, unit: "%", goal: 18, label: "Taxa conversao" },
  classifyAccuracy: { before: 0, after: 92, unit: "%", goal: 90, label: "Acuracia classificacao" },
  adoptionRate: { before: 0, after: 74, unit: "%", goal: 70, label: "Adocao pelo vendedor" },
  osErrors: { before: 15, after: 4, unit: "%", goal: 5, label: "Erros em OS" },
  costPerLead: { before: 25, after: 0.03, unit: "R$", goal: 0.05, label: "Custo por lead" },
};

var WEEKLY_TRENDS = [
  { week: "S1", accuracy: 85, adoption: 45, leads: 180 },
  { week: "S2", accuracy: 88, adoption: 58, leads: 195 },
  { week: "S3", accuracy: 90, adoption: 65, leads: 210 },
  { week: "S4", accuracy: 92, adoption: 74, leads: 225 },
  { week: "S5", accuracy: 91, adoption: 72, leads: 215 },
  { week: "S6", accuracy: 93, adoption: 78, leads: 230 },
];

// ============================================================
// LIFECYCLE STAGES
// ============================================================
var LIFECYCLE = [
  { name: "Discovery", icon: "\uD83D\uDD0D", color: C.cyan, desc: "Identificar problema, validar com usuarios, avaliar viabilidade com IA", duration: "1-2 semanas", costaLima: "Entrevistamos vendedores: 'responder lead demora demais'. Testamos com 10 leads: Haiku classifica com 85% de acerto." },
  { name: "Priorizacao", icon: "\uD83C\uDFAF", color: C.amber, desc: "RICE score, decidir o que construir primeiro, definir metricas de sucesso", duration: "2-3 dias", costaLima: "RICE: classificar leads = 1.620 (maior score). Meta: <15min resposta, >90% acuracia, >70% adocao." },
  { name: "Prototipo", icon: "\u26A1", color: C.green, desc: "MVP minimo, testar com 1-2 usuarios reais, iterar prompt", duration: "1 semana", costaLima: "Prompt v1 classifica leads. Felipe (vendedor) testa 1 semana. Feedback: 'confunde reforma com manutencao'. Ajustar few-shot." },
  { name: "Validacao", icon: "\u2705", color: C.purple, desc: "Metricas reais, A/B test se possivel, decidir go/no-go", duration: "2 semanas", costaLima: "2 semanas em paralelo: 50% leads com IA, 50% manual. Resultado: IA 88% acuracia, resposta 10x mais rapida. GO." },
  { name: "Producao", icon: "\uD83D\uDE80", color: C.blue, desc: "Deploy, monitoramento, fallback, documentacao", duration: "1 semana", costaLima: "Deploy no Railway, golden tests no CI, fallback para regras, AICallLog ativo. 100% dos leads passam pela IA." },
  { name: "Monitoramento", icon: "\uD83D\uDCCA", color: C.orange, desc: "Metricas continuas, drift detection, feedback loop", duration: "Continuo", costaLima: "Dashboard com acuracia/semana. Vendedor pode corrigir classificacao (feedback → melhora prompt). Custo monitorado." },
];

// ============================================================
// COMPONENTS
// ============================================================

var STATUS_STYLES = {
  production: { color: C.green, label: "PROD" },
  development: { color: C.amber, label: "DEV" },
  planned: { color: C.cyan, label: "PLAN" },
  idea: { color: C.purple, label: "IDEA" },
  backlog: { color: C.textDim, label: "BACK" },
};

function RICETable(props) {
  var features = props.features;
  var sorted = features.slice().sort(function(a, b) { return calcRICE(b) - calcRICE(a); });
  var maxScore = calcRICE(sorted[0]) || 1;

  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "180px 55px 45px 45px 45px 1fr 55px 50px",
        padding: "8px 14px", borderBottom: "1px solid " + C.border,
        fontSize: "8px", fontWeight: 700, color: C.textDim, letterSpacing: "0.5px",
      }}>
        <div>FEATURE</div><div>REACH</div><div>IMP</div><div>CONF</div><div>EFF</div><div>SCORE</div><div>FASE</div><div>STATUS</div>
      </div>
      {sorted.map(function(f, i) {
        var score = calcRICE(f);
        var pct = (score / maxScore * 100);
        var st = STATUS_STYLES[f.status] || STATUS_STYLES.backlog;
        return (
          <div key={f.id} style={{
            display: "grid", gridTemplateColumns: "180px 55px 45px 45px 45px 1fr 55px 50px",
            padding: "8px 14px", fontSize: "10px", alignItems: "center",
            borderBottom: i < sorted.length - 1 ? "1px solid " + C.border : "none",
            background: i < 3 ? C.green + "04" : "transparent",
          }}>
            <span style={{ color: C.text, fontWeight: 600 }}>{f.name}</span>
            <span style={{ color: C.textMuted }}>{f.reach}</span>
            <span style={{ color: C.textMuted }}>{f.impact}</span>
            <span style={{ color: f.confidence >= 80 ? C.green : f.confidence >= 60 ? C.amber : C.red }}>{f.confidence}%</span>
            <span style={{ color: C.textMuted }}>{f.effort}w</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ flex: 1, height: "6px", background: C.bg, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  width: pct + "%", height: "100%", borderRadius: "3px",
                  background: pct > 60 ? C.green : pct > 30 ? C.amber : C.textDim,
                }} />
              </div>
              <span style={{ fontWeight: 800, color: pct > 60 ? C.green : pct > 30 ? C.amber : C.textDim, width: "40px", textAlign: "right" }}>
                {score}
              </span>
            </div>
            <span style={{ fontSize: "9px", color: C.textDim }}>Fase {f.phase}</span>
            <span style={{
              fontSize: "7px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
              background: st.color + "15", color: st.color, textAlign: "center",
            }}>{st.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard(props) {
  var m = props.metric;
  var key = props.metricKey;
  var improved = key === "leadResponseTime" || key === "osErrors" || key === "costPerLead"
    ? m.after < m.before : m.after > m.before;
  var metGoal = key === "leadResponseTime" ? m.after <= m.goal :
    key === "osErrors" ? m.after <= m.goal :
    key === "costPerLead" ? m.after <= m.goal :
    m.after >= m.goal;

  return (
    <div style={{
      padding: "12px", borderRadius: "8px",
      background: C.surface, border: "1px solid " + C.border,
    }}>
      <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "6px" }}>{m.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: metGoal ? C.green : C.amber }}>{m.after}{m.unit}</span>
        <span style={{ fontSize: "10px", color: C.textDim, textDecoration: "line-through" }}>{m.before}{m.unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px" }}>
        <span style={{ color: improved ? C.green : C.red }}>{improved ? "\u2191" : "\u2193"}</span>
        <span style={{ color: C.textDim }}>Meta: {m.goal}{m.unit}</span>
        <span style={{
          marginLeft: "auto", fontSize: "7px", fontWeight: 700, padding: "2px 5px", borderRadius: "3px",
          background: metGoal ? C.green + "15" : C.amber + "15",
          color: metGoal ? C.green : C.amber,
        }}>{metGoal ? "ATINGIDA" : "EM PROGRESSO"}</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function ProductManagementLab() {
  var [activeTab, setActiveTab] = useState("rice");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Cap 7 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Produto de IA: Discovery e Metricas
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Mapa de oportunidades | RICE | Metricas de produto | Ciclo de vida
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "rice", label: "Priorizacao RICE" },
            { id: "metrics", label: "Metricas" },
            { id: "lifecycle", label: "Ciclo de Vida" },
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

        {/* RICE */}
        {activeTab === "rice" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              12 features de IA do Costa Lima priorizadas por RICE (Reach x Impact x Confidence / Effort). As 3 com maior score (fundo verde) sao as primeiras a implementar.
            </p>

            <RICETable features={FEATURES_DATA} />

            {/* Opportunity map */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>MAPA DE OPORTUNIDADES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { title: "Alto impacto + Alta viabilidade", color: C.green, subtitle: "FAZER PRIMEIRO", items: FEATURES_DATA.filter(function(f) { return calcRICE(f) > 300; }) },
                  { title: "Alto impacto + Viabilidade media", color: C.amber, subtitle: "FAZER DEPOIS", items: FEATURES_DATA.filter(function(f) { var s = calcRICE(f); return s > 100 && s <= 300; }) },
                  { title: "Impacto medio", color: C.cyan, subtitle: "AVALIAR ROI", items: FEATURES_DATA.filter(function(f) { var s = calcRICE(f); return s > 30 && s <= 100; }) },
                  { title: "Baixo impacto", color: C.textDim, subtitle: "NAO AGORA", items: FEATURES_DATA.filter(function(f) { return calcRICE(f) <= 30; }) },
                ].map(function(q) {
                  return (
                    <div key={q.title} style={{
                      padding: "12px", borderRadius: "8px",
                      background: q.color + "06", border: "1px solid " + q.color + "18",
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: q.color, marginBottom: "2px" }}>{q.title}</div>
                      <div style={{ fontSize: "8px", color: C.textDim, marginBottom: "6px" }}>{q.subtitle}</div>
                      {q.items.map(function(f) {
                        return (
                          <div key={f.id} style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>
                            {"\u2022"} {f.name} <span style={{ color: q.color, fontWeight: 700 }}>({calcRICE(f)})</span>
                          </div>
                        );
                      })}
                      {q.items.length === 0 && <div style={{ fontSize: "9px", color: C.textDim }}>Nenhuma feature nesta categoria</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* METRICS */}
        {activeTab === "metrics" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Metricas de produto do Costa Lima com IA. Antes vs depois, com meta e status de cada indicador.
            </p>

            {/* Product metrics cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {Object.keys(PRODUCT_METRICS).map(function(key) {
                return <MetricCard key={key} metricKey={key} metric={PRODUCT_METRICS[key]} />;
              })}
            </div>

            {/* Weekly trends */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>TENDENCIA SEMANAL</div>
              <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "80px", marginBottom: "6px" }}>
                {WEEKLY_TRENDS.map(function(w) {
                  var h = (w.accuracy / 100) * 80;
                  return (
                    <div key={w.week} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: "8px", color: C.green, fontWeight: 700, marginBottom: "2px" }}>{w.accuracy}%</div>
                      <div style={{ height: h + "px", background: C.green + "40", borderRadius: "3px 3px 0 0", margin: "0 auto", width: "70%" }}>
                        <div style={{ height: (w.adoption / 100) * h + "px", background: C.cyan, borderRadius: "3px 3px 0 0", width: "100%", marginTop: (h - (w.adoption / 100) * h) + "px" }} />
                      </div>
                      <div style={{ fontSize: "8px", color: C.textDim, marginTop: "4px" }}>{w.week}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "9px" }}>
                <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.green + "40", marginRight: "4px" }} />Acuracia</span>
                <span><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: C.cyan, marginRight: "4px" }} />Adocao</span>
              </div>
            </div>

            {/* Quality metrics */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "14px" }}>
              <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>QUALIDADE DE IA (classificacao de leads)</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  { name: "Precision", value: "94%", desc: "Dos classificados como X, quantos realmente eram X", color: C.green },
                  { name: "Recall", value: "89%", desc: "Dos que eram X, quantos foram classificados como X", color: C.cyan },
                  { name: "F1-Score", value: "91.4%", desc: "Media harmonica de precision e recall", color: C.purple },
                  { name: "Drift", value: "-0.3%/sem", desc: "Variacao de acuracia por semana (estavel)", color: C.green },
                ].map(function(m) {
                  return (
                    <div key={m.name} style={{
                      flex: 1, minWidth: "120px", padding: "10px",
                      borderRadius: "6px", background: C.surfaceAlt,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: C.text, marginTop: "2px" }}>{m.name}</div>
                      <div style={{ fontSize: "8px", color: C.textDim, marginTop: "2px" }}>{m.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LIFECYCLE */}
        {activeTab === "lifecycle" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              O ciclo de vida de uma feature de IA no Costa Lima. Exemplo: "Classificar leads automaticamente".
            </p>

            {LIFECYCLE.map(function(stage, i) {
              return (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: stage.color + "20", border: "2px solid " + stage.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px",
                    }}>{stage.icon}</div>
                    {i < LIFECYCLE.length - 1 && <div style={{ width: "2px", flex: 1, background: C.border, minHeight: "10px" }} />}
                  </div>
                  <div style={{
                    flex: 1, padding: "12px 14px", borderRadius: "10px",
                    background: C.surface, border: "1px solid " + C.border,
                    marginBottom: "2px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: stage.color }}>{stage.name}</span>
                      <span style={{ fontSize: "9px", color: C.textDim }}>{stage.duration}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px" }}>{stage.desc}</div>
                    <div style={{
                      padding: "8px 10px", borderRadius: "6px",
                      background: stage.color + "06", border: "1px solid " + stage.color + "12",
                      fontSize: "10px", color: C.textMuted, lineHeight: 1.5,
                    }}>
                      <span style={{ color: stage.color, fontWeight: 700 }}>Costa Lima: </span>
                      {stage.costaLima}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: "12px", padding: "12px 14px", borderRadius: "8px",
              background: C.amber + "08", border: "1px solid " + C.amber + "22",
              fontSize: "11px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Golden rule:</span>
              {" "}Lance com 80% de qualidade e melhore com dados reais. A fase de Monitoramento nunca termina — e ela que garante que o produto continua gerando valor.
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Discovery: perguntas certas antes de construir",
                color: C.cyan,
                text: "Para CADA feature de IA, responda:\n\n1. FREQUENCIA: quantas vezes/dia o problema acontece?\n   >10x: prioridade alta. <1x: pode esperar.\n\n2. CUSTO: quanto custa NAO resolver?\n   Vendedor perde 2h/dia = R$2.200/mes.\n\n3. VIABILIDADE: o LLM resolve bem?\n   Classificacao de texto: excelente. Calculo exato: ruim.\n\n4. DADOS: tem dados pra alimentar?\n   Mensagens de WhatsApp: sim. Feedback estruturado: nao.\n\nSe alguma resposta e 'nao' ou 'baixo', reconsidere.",
              },
              {
                title: "RICE para IA: adaptacoes importantes",
                color: C.amber,
                text: "CONFIDENCE e o fator mais importante em features de IA.\n\nAlta confianca (80%+): classificacao com few-shot, resposta com template\nMedia confianca (50-80%): analise de foto, agente multi-step\nBaixa confianca (<50%): geracao de contrato, decisao juridica\n\nRegra: NAO construa features com confianca <50% para producao.\nPrototipe, valide, e so entao decida.\n\nEFFORT em IA inclui: desenvolvimento + prompt engineering + testes + monitoramento.\nMultiplique por 1.5x o esforco estimado (prompts sempre precisam de iteracao).",
              },
              {
                title: "Metricas que importam vs metricas de vaidade",
                color: C.green,
                text: "IMPORTAM (outcome):\n- Tempo de resposta ao lead (impacta conversao)\n- Taxa de conversao (impacta receita)\n- Adocao pelo usuario (valida que a feature e util)\n- Acuracia (valida que a IA funciona)\n\nVAIDADE (output):\n- Numero de chamadas de IA por dia (volume != valor)\n- Tokens processados (custo != impacto)\n- Features de IA lancadas (quantidade != qualidade)\n\nSempre pergunte: 'se essa metrica subir, o negocio melhora?'\nSe nao, e metrica de vaidade.",
              },
              {
                title: "Feedback loop: como a IA melhora com uso",
                color: C.purple,
                text: "O ciclo virtuoso:\n\n1. IA classifica lead como CONSTRUCAO\n2. Vendedor VE a classificacao\n3. Se errada, vendedor CORRIGE para REFORMA\n4. Correcao e registrada no LeadHistorico\n5. Periodicamente, analise das correcoes identifica padroes\n6. Prompt e atualizado com novos few-shot exemplos\n7. Acuracia sobe de 88% para 92%\n8. Vendedor corrige menos → confia mais → adocao sobe\n\nIsso e o flywheel de produto de IA: uso gera dados, dados melhoram IA, IA melhor gera mais uso.",
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
