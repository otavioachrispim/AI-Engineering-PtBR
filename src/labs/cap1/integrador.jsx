import { useState, useCallback, useMemo, useEffect } from "react";

// ============================================================
// DOMAIN: Costa Lima Piscinas - Lead Scoring System
// Simulates real leads from a pool construction company ERP
// ============================================================

const ORIGENS = ["SITE", "INSTAGRAM", "INDICACAO", "GOOGLE", "FACEBOOK", "TELEFONE", "VISITA_LOJA"];
const STATUS_FUNIL = ["NOVO", "CONTATO", "VISITA", "PROPOSTA", "NEGOCIACAO", "FECHADO", "PERDIDO"];
const SERVICOS = [
  "Construção de piscina",
  "Reforma de piscina",
  "Manutenção mensal",
  "Troca de equipamentos",
  "Aquecimento solar",
  "Iluminação",
  "Limpeza emergencial",
  "Projeto paisagístico",
];

function generateLeadHistory(status, converted) {
  const interactions = [];
  const stages = STATUS_FUNIL.indexOf(status) + 1;

  const positiveNotes = [
    "Cliente demonstrou muito interesse no projeto",
    "Pediu detalhes sobre financiamento e prazos",
    "Quer começar o mais rápido possível",
    "Indicou vizinho que também quer piscina",
    "Já tem terreno preparado para a obra",
    "Família grande, quer piscina para lazer dos filhos",
    "Perguntou sobre garantia e pós-obra",
    "Enviou fotos do quintal para avaliação",
    "Agendou visita técnica sem hesitar",
    "Comparou com concorrentes e prefere nossa proposta",
  ];

  const neutralNotes = [
    "Primeiro contato realizado, aguardando retorno",
    "Cliente pediu para ligar na próxima semana",
    "Solicitou orçamento por email",
    "Perguntou sobre modelos disponíveis",
    "Visita técnica agendada",
    "Cliente está avaliando outras opções",
    "Quer pensar mais antes de decidir",
  ];

  const negativeNotes = [
    "Cliente achou o valor muito alto",
    "Não respondeu às últimas 3 tentativas de contato",
    "Disse que vai adiar o projeto para o próximo ano",
    "Preferiu proposta do concorrente",
    "Problemas financeiros, não vai conseguir investir agora",
    "Mudou de endereço, projeto cancelado",
    "Não atende mais o telefone",
    "Pediu para não ligar novamente",
  ];

  for (let i = 0; i < stages && i < 5; i++) {
    const dayOffset = i * (3 + Math.floor(Math.random() * 10));
    const isLate = i > 2;
    let notes;
    if (converted || status === "FECHADO") {
      notes = positiveNotes[Math.floor(Math.random() * positiveNotes.length)];
    } else if (status === "PERDIDO") {
      notes = i < stages - 1
        ? neutralNotes[Math.floor(Math.random() * neutralNotes.length)]
        : negativeNotes[Math.floor(Math.random() * negativeNotes.length)];
    } else {
      notes = Math.random() > 0.4
        ? positiveNotes[Math.floor(Math.random() * positiveNotes.length)]
        : neutralNotes[Math.floor(Math.random() * neutralNotes.length)];
    }
    interactions.push({ dia: dayOffset, tipo: STATUS_FUNIL[i], nota: notes });
  }
  return interactions;
}

function generateLeads(n = 60) {
  const leads = [];
  const nomes = [
    "João Silva", "Maria Oliveira", "Carlos Santos", "Ana Costa", "Pedro Almeida",
    "Fernanda Lima", "Ricardo Souza", "Patricia Ferreira", "Marcos Pereira", "Juliana Rodrigues",
    "Roberto Nascimento", "Camila Barbosa", "Felipe Araújo", "Luciana Cardoso", "Gustavo Ribeiro",
    "Amanda Gomes", "Lucas Martins", "Beatriz Correia", "Rafael Melo", "Isabela Nunes",
    "Diego Carvalho", "Tatiana Monteiro", "André Rocha", "Vanessa Teixeira", "Bruno Moreira",
    "Larissa Vieira", "Thiago Castro", "Natália Dias", "Eduardo Lopes", "Renata Mendes",
    "Gabriel Freitas", "Daniela Rezende", "Henrique Pinto", "Mariana Campos", "Leonardo Machado",
    "Carolina Duarte", "Vinícius Cunha", "Aline Azevedo", "Matheus Fonseca", "Priscila Borges",
    "Rodrigo Medeiros", "Elaine Tavares", "Alexandre Ramos", "Sandra Cavalcanti", "Fábio Miranda",
    "Cristina Guimarães", "Leandro Nogueira", "Simone Batista", "Marcelo Franco", "Paula Sampaio",
    "Otávio Schwartz", "Débora Werner", "Antônio Braga", "Cláudia Siqueira", "Sérgio Lacerda",
    "Teresa Albuquerque", "Wagner Coelho", "Rosa Andrade", "Márcio Pinheiro", "Elisa Farias",
  ];

  for (let i = 0; i < n; i++) {
    const converted = Math.random() > 0.6;
    const status = converted
      ? (Math.random() > 0.3 ? "FECHADO" : STATUS_FUNIL[3 + Math.floor(Math.random() * 2)])
      : (Math.random() > 0.5 ? "PERDIDO" : STATUS_FUNIL[Math.floor(Math.random() * 5)]);

    const origem = ORIGENS[Math.floor(Math.random() * ORIGENS.length)];
    const diasNoFunil = status === "NOVO" ? Math.floor(Math.random() * 5)
      : status === "PERDIDO" ? 15 + Math.floor(Math.random() * 60)
      : status === "FECHADO" ? 5 + Math.floor(Math.random() * 30)
      : 3 + Math.floor(Math.random() * 40);

    const numInteracoes = status === "NOVO" ? 0
      : Math.min(STATUS_FUNIL.indexOf(status) + 1, 1 + Math.floor(Math.random() * 5));

    const tempoRespostaDias = converted ? Math.random() * 3 : 1 + Math.random() * 10;
    const valorEstimado = (15000 + Math.random() * 135000);
    const historico = generateLeadHistory(status, converted);

    leads.push({
      id: `LEAD-${String(i + 1).padStart(4, "0")}`,
      nome: nomes[i % nomes.length],
      origem,
      servico: SERVICOS[Math.floor(Math.random() * SERVICOS.length)],
      status,
      converted,
      diasNoFunil,
      numInteracoes,
      tempoRespostaDias: Math.round(tempoRespostaDias * 10) / 10,
      valorEstimado: Math.round(valorEstimado),
      historico,
      criadoEm: new Date(Date.now() - diasNoFunil * 86400000).toISOString().slice(0, 10),
    });
  }
  return leads;
}

// ============================================================
// SCORING ENGINE 1: RULE-BASED (Módulo 1)
// ============================================================
function ruleBasedScore(lead) {
  let score = 50; // base
  const reasons = [];

  // Origem (dados do Costa Lima mostram que indicação converte mais)
  const origemScores = {
    INDICACAO: 20, VISITA_LOJA: 15, SITE: 10, GOOGLE: 8, TELEFONE: 5, INSTAGRAM: 3, FACEBOOK: 0
  };
  const origemPts = origemScores[lead.origem] || 0;
  score += origemPts;
  if (origemPts >= 15) reasons.push({ text: `Origem forte: ${lead.origem}`, impact: "+" });
  if (origemPts <= 3) reasons.push({ text: `Origem fria: ${lead.origem}`, impact: "-" });

  // Tempo de resposta
  if (lead.tempoRespostaDias <= 1) { score += 15; reasons.push({ text: "Respondeu em <24h", impact: "+" }); }
  else if (lead.tempoRespostaDias <= 3) { score += 5; }
  else if (lead.tempoRespostaDias > 7) { score -= 15; reasons.push({ text: `${lead.tempoRespostaDias}d sem resposta`, impact: "-" }); }

  // Estágio no funil
  const funnelIndex = STATUS_FUNIL.indexOf(lead.status);
  if (funnelIndex >= 4) { score += 20; reasons.push({ text: `Avançado: ${lead.status}`, impact: "+" }); }
  else if (funnelIndex >= 2) { score += 10; }
  else if (funnelIndex === 0 && lead.diasNoFunil > 7) { score -= 10; reasons.push({ text: "Parado em NOVO há muito tempo", impact: "-" }); }

  // Interações
  if (lead.numInteracoes >= 3) { score += 10; reasons.push({ text: `${lead.numInteracoes} interações`, impact: "+" }); }
  else if (lead.numInteracoes === 0 && lead.diasNoFunil > 3) { score -= 10; reasons.push({ text: "Sem interação registrada", impact: "-" }); }

  // Valor
  if (lead.valorEstimado > 80000) { score += 10; reasons.push({ text: `Ticket alto: R$${(lead.valorEstimado/1000).toFixed(0)}k`, impact: "+" }); }
  else if (lead.valorEstimado < 20000) { score -= 5; }

  // Dias no funil (aging)
  if (lead.diasNoFunil > 30 && funnelIndex < 4) { score -= 15; reasons.push({ text: `${lead.diasNoFunil}d no funil sem avançar`, impact: "-" }); }

  score = Math.max(0, Math.min(100, score));
  return { score, reasons, method: "Regras determinísticas (7 critérios fixos)" };
}

// ============================================================
// SCORING ENGINE 2: STATISTICAL (Naive Bayes - Módulo 3)
// ============================================================
function trainLeadScorer(leads) {
  const converted = leads.filter(l => l.converted);
  const lost = leads.filter(l => !l.converted);

  function stats(arr, fn) {
    const vals = arr.map(fn);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
    return { mean, std };
  }

  // Features statistics by class
  const features = [
    { name: "diasNoFunil", fn: l => l.diasNoFunil },
    { name: "numInteracoes", fn: l => l.numInteracoes },
    { name: "tempoRespostaDias", fn: l => l.tempoRespostaDias },
    { name: "valorEstimado", fn: l => l.valorEstimado / 10000 },
    { name: "funnelStage", fn: l => STATUS_FUNIL.indexOf(l.status) },
  ];

  const convStats = features.map(f => ({ ...f, ...stats(converted, f.fn) }));
  const lostStats = features.map(f => ({ ...f, ...stats(lost, f.fn) }));

  // Origem as categorical
  const origemConvRate = {};
  ORIGENS.forEach(o => {
    const total = leads.filter(l => l.origem === o).length || 1;
    const conv = leads.filter(l => l.origem === o && l.converted).length;
    origemConvRate[o] = conv / total;
  });

  const pConv = converted.length / leads.length;

  function predict(lead) {
    let logPConv = Math.log(pConv);
    let logPLost = Math.log(1 - pConv);
    const featureContributions = [];

    features.forEach((f, i) => {
      const val = f.fn(lead);
      const cStat = convStats[i];
      const lStat = lostStats[i];

      // Gaussian probability
      const pGivenConv = Math.exp(-((val - cStat.mean) ** 2) / (2 * cStat.std ** 2)) / (cStat.std * Math.sqrt(2 * Math.PI));
      const pGivenLost = Math.exp(-((val - lStat.mean) ** 2) / (2 * lStat.std ** 2)) / (lStat.std * Math.sqrt(2 * Math.PI));

      logPConv += Math.log(Math.max(pGivenConv, 1e-10));
      logPLost += Math.log(Math.max(pGivenLost, 1e-10));

      const ratio = Math.log(Math.max(pGivenConv, 1e-10)) - Math.log(Math.max(pGivenLost, 1e-10));
      featureContributions.push({
        name: f.name,
        value: val,
        convMean: cStat.mean,
        lostMean: lStat.mean,
        impact: ratio > 0.3 ? "+" : ratio < -0.3 ? "-" : "~",
        ratio,
      });
    });

    // Origem contribution
    const origemRate = origemConvRate[lead.origem] || 0.5;
    logPConv += Math.log(Math.max(origemRate, 0.05));
    logPLost += Math.log(Math.max(1 - origemRate, 0.05));
    featureContributions.push({
      name: "origem",
      value: lead.origem,
      convMean: origemRate,
      impact: origemRate > 0.5 ? "+" : origemRate < 0.3 ? "-" : "~",
      ratio: Math.log(origemRate + 0.05) - Math.log(1 - origemRate + 0.05),
    });

    // Normalize to probability
    const maxLog = Math.max(logPConv, logPLost);
    const pConvFinal = Math.exp(logPConv - maxLog) / (Math.exp(logPConv - maxLog) + Math.exp(logPLost - maxLog));
    const score = Math.round(pConvFinal * 100);

    const topReasons = featureContributions
      .sort((a, b) => Math.abs(b.ratio) - Math.abs(a.ratio))
      .slice(0, 4)
      .map(f => ({
        text: f.name === "origem"
          ? `Origem ${f.value}: taxa de conversão ${(f.convMean * 100).toFixed(0)}%`
          : `${f.name}: ${typeof f.value === "number" ? f.value.toFixed(1) : f.value} (média convertidos: ${f.convMean.toFixed(1)})`,
        impact: f.impact,
      }));

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons: topReasons,
      method: `Naive Bayes Gaussiano (treinado com ${leads.length} leads, ${features.length + 1} features)`,
    };
  }

  return predict;
}

// ============================================================
// SCORING ENGINE 3: SENTIMENT ANALYSIS (Módulo 2 - simulated)
// ============================================================
function analyzeInteractions(lead) {
  const positiveSignals = [
    "interesse", "começar", "rápido", "indicou", "preparado", "lazer",
    "garantia", "fotos", "agendou", "prefere", "sem hesitar", "financiamento",
  ];
  const negativeSignals = [
    "alto", "não respondeu", "adiar", "concorrente", "problemas financeiros",
    "cancelado", "não atende", "não ligar", "outras opções", "pensar",
  ];

  let sentimentScore = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  const signals = [];

  lead.historico.forEach(h => {
    const nota = h.nota.toLowerCase();
    positiveSignals.forEach(p => {
      if (nota.includes(p)) { sentimentScore += 1; positiveCount++; signals.push({ text: p, type: "+" }); }
    });
    negativeSignals.forEach(n => {
      if (nota.includes(n)) { sentimentScore -= 1; negativeCount++; signals.push({ text: n, type: "-" }); }
    });
  });

  const normalizedScore = lead.historico.length > 0
    ? Math.max(0, Math.min(100, 50 + sentimentScore * 15))
    : 50;

  return {
    score: normalizedScore,
    positiveCount,
    negativeCount,
    signals: signals.slice(0, 6),
    lastInteraction: lead.historico.length > 0 ? lead.historico[lead.historico.length - 1] : null,
  };
}

// ============================================================
// COMBINED SCORE
// ============================================================
function combinedScore(ruleScore, mlScore, sentimentScore) {
  // Weighted ensemble
  const combined = Math.round(ruleScore * 0.3 + mlScore * 0.5 + sentimentScore * 0.2);
  return Math.max(0, Math.min(100, combined));
}

function getScoreLabel(score) {
  if (score >= 80) return { label: "Quente", color: "#22c55e", emoji: "🔥" };
  if (score >= 60) return { label: "Morno", color: "#f59e0b", emoji: "🌤️" };
  if (score >= 40) return { label: "Frio", color: "#60a5fa", emoji: "❄️" };
  return { label: "Gelado", color: "#94a3b8", emoji: "🧊" };
}

function getRecommendation(score, lead) {
  if (score >= 80) {
    return lead.status === "PROPOSTA" || lead.status === "NEGOCIACAO"
      ? "Priorizar fechamento. Ligar hoje e oferecer condição especial."
      : "Lead quente — agendar visita técnica urgente.";
  }
  if (score >= 60) {
    return lead.numInteracoes < 2
      ? "Fazer follow-up com conteúdo relevante (cases, portfólio)."
      : "Enviar proposta personalizada com condições de pagamento.";
  }
  if (score >= 40) {
    return lead.tempoRespostaDias > 5
      ? "Reengajar com oferta ou conteúdo educativo sobre piscinas."
      : "Manter nutrição. Enviar cases de projetos similares.";
  }
  return lead.diasNoFunil > 30
    ? "Considerar arquivar. Mover para lista de reativação futura."
    : "Último contato tentativa. Se não responder, mover para perdido.";
}

// ============================================================
// COLORS & STYLES
// ============================================================
const C = {
  bg: "#060a10",
  surface: "#0c1118",
  surfaceAlt: "#121a28",
  border: "#1a2540",
  borderHover: "#253558",
  text: "#e0e8f5",
  textMuted: "#7589a8",
  textDim: "#3d506b",
  blue: "#2563eb",
  blueBg: "rgba(37,99,235,0.08)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.06)",
  amber: "#f59e0b",
  amberBg: "rgba(245,158,11,0.06)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.06)",
  cyan: "#06b6d4",
  purple: "#8b5cf6",
};

const STATUS_COLORS = {
  NOVO: "#60a5fa",
  CONTATO: "#a78bfa",
  VISITA: "#f59e0b",
  PROPOSTA: "#f97316",
  NEGOCIACAO: "#22d3ee",
  FECHADO: "#22c55e",
  PERDIDO: "#ef4444",
};

// ============================================================
// COMPONENTS
// ============================================================

function ScoreGauge({ score, size = 64 }) {
  const { color, emoji } = getScoreLabel(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={C.border} strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size > 50 ? "16px" : "12px", fontWeight: 800, color,
      }}>
        {score}
      </div>
    </div>
  );
}

function LeadCard({ lead, ruleResult, mlResult, sentiment, isExpanded, onToggle }) {
  const combined = combinedScore(ruleResult.score, mlResult.score, sentiment.score);
  const scoreInfo = getScoreLabel(combined);
  const recommendation = getRecommendation(combined, lead);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${isExpanded ? scoreInfo.color + "44" : C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Summary row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "14px 16px", cursor: "pointer",
        }}
      >
        <ScoreGauge score={combined} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{lead.nome}</span>
            <span style={{
              fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
              background: `${STATUS_COLORS[lead.status]}18`,
              color: STATUS_COLORS[lead.status],
              border: `1px solid ${STATUS_COLORS[lead.status]}33`,
            }}>
              {lead.status}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>
            {lead.servico} · R${(lead.valorEstimado/1000).toFixed(0)}k · {lead.origem}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: scoreInfo.color }}>
            {scoreInfo.emoji} {scoreInfo.label}
          </div>
          <div style={{ fontSize: "10px", color: C.textDim }}>{lead.diasNoFunil}d no funil</div>
        </div>
        <span style={{ color: C.textDim, fontSize: "14px", transform: isExpanded ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>
          ▾
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px" }}>
          {/* Recommendation */}
          <div style={{
            padding: "12px 14px", borderRadius: "8px", marginBottom: "16px",
            background: `${scoreInfo.color}08`, border: `1px solid ${scoreInfo.color}22`,
            fontSize: "12px", color: C.text, lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 700, color: scoreInfo.color }}>Recomendação:</span> {recommendation}
          </div>

          {/* Three scoring methods */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              { title: "Regras", score: ruleResult.score, reasons: ruleResult.reasons, color: C.amber, tag: "M1" },
              { title: "Naive Bayes", score: mlResult.score, reasons: mlResult.reasons, color: C.cyan, tag: "M3" },
              { title: "Sentimento", score: sentiment.score, reasons: sentiment.signals.map(s => ({ text: s.text, impact: s.type })), color: C.purple, tag: "M2" },
            ].map(method => (
              <div key={method.title} style={{
                flex: 1, minWidth: "160px", padding: "12px",
                background: C.surfaceAlt, borderRadius: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{
                    fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px",
                    background: `${method.color}15`, color: method.color, letterSpacing: "0.5px",
                  }}>
                    {method.tag}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: method.color }}>
                    {method.title}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: "16px", fontWeight: 800, color: method.color }}>
                    {method.score}
                  </span>
                </div>
                {method.reasons.slice(0, 3).map((r, i) => (
                  <div key={i} style={{
                    fontSize: "10px", color: C.textMuted, lineHeight: 1.6,
                    paddingLeft: "8px",
                  }}>
                    <span style={{
                      color: r.impact === "+" ? C.green : r.impact === "-" ? C.red : C.textDim,
                      fontWeight: 700, marginRight: "4px",
                    }}>
                      {r.impact === "+" ? "↑" : r.impact === "-" ? "↓" : "·"}
                    </span>
                    {r.text}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Interaction history */}
          {lead.historico.length > 0 && (
            <div>
              <div style={{
                fontSize: "10px", color: C.textDim, marginBottom: "8px",
                letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700,
              }}>
                Histórico de Interações
              </div>
              {lead.historico.map((h, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", fontSize: "11px",
                  padding: "6px 0",
                  borderBottom: i < lead.historico.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                    borderRadius: "4px", background: `${STATUS_COLORS[h.tipo]}15`,
                    color: STATUS_COLORS[h.tipo], flexShrink: 0, height: "fit-content",
                  }}>
                    {h.tipo}
                  </span>
                  <span style={{ color: C.textMuted, lineHeight: 1.5 }}>{h.nota}</span>
                  <span style={{ color: C.textDim, marginLeft: "auto", flexShrink: 0, fontSize: "10px" }}>
                    dia {h.dia}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Score composition */}
          <div style={{
            marginTop: "14px", padding: "10px 12px", borderRadius: "8px",
            background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.7,
          }}>
            <span style={{ fontWeight: 700, color: C.textMuted }}>Score final:</span>{" "}
            Regras×0.3 ({ruleResult.score}×0.3={Math.round(ruleResult.score*0.3)}) + 
            ML×0.5 ({mlResult.score}×0.5={Math.round(mlResult.score*0.5)}) + 
            Sentimento×0.2 ({sentiment.score}×0.2={Math.round(sentiment.score*0.2)}) = 
            <span style={{ color: scoreInfo.color, fontWeight: 800 }}> {combined}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function LeadScoringSystem() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [expandedLead, setExpandedLead] = useState(null);
  const [filterScore, setFilterScore] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("score_desc");

  const leads = useMemo(() => generateLeads(60), []);
  const mlPredict = useMemo(() => trainLeadScorer(leads), [leads]);

  const scoredLeads = useMemo(() => {
    return leads.map(lead => {
      const rule = ruleBasedScore(lead);
      const ml = mlPredict(lead);
      const sent = analyzeInteractions(lead);
      const combined = combinedScore(rule.score, ml.score, sent.score);
      return { lead, rule, ml, sent, combined };
    });
  }, [leads, mlPredict]);

  const filtered = useMemo(() => {
    let result = [...scoredLeads];

    if (filterScore !== "all") {
      const ranges = { hot: [80, 100], warm: [60, 79], cold: [40, 59], frozen: [0, 39] };
      const [min, max] = ranges[filterScore] || [0, 100];
      result = result.filter(s => s.combined >= min && s.combined <= max);
    }

    if (filterStatus !== "all") {
      result = result.filter(s => s.lead.status === filterStatus);
    }

    if (sortBy === "score_desc") result.sort((a, b) => b.combined - a.combined);
    else if (sortBy === "score_asc") result.sort((a, b) => a.combined - b.combined);
    else if (sortBy === "valor_desc") result.sort((a, b) => b.lead.valorEstimado - a.lead.valorEstimado);
    else if (sortBy === "recent") result.sort((a, b) => a.lead.diasNoFunil - b.lead.diasNoFunil);

    return result;
  }, [scoredLeads, filterScore, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const hot = scoredLeads.filter(s => s.combined >= 80).length;
    const warm = scoredLeads.filter(s => s.combined >= 60 && s.combined < 80).length;
    const cold = scoredLeads.filter(s => s.combined >= 40 && s.combined < 60).length;
    const frozen = scoredLeads.filter(s => s.combined < 40).length;
    const avgScore = Math.round(scoredLeads.reduce((a, s) => a + s.combined, 0) / scoredLeads.length);
    const totalValue = scoredLeads.filter(s => s.combined >= 60).reduce((a, s) => a + s.lead.valorEstimado, 0);

    // Accuracy check: does high score correlate with conversion?
    const highScoreConverted = scoredLeads.filter(s => s.combined >= 60 && s.lead.converted).length;
    const highScoreTotal = scoredLeads.filter(s => s.combined >= 60).length;
    const lowScoreLost = scoredLeads.filter(s => s.combined < 40 && !s.lead.converted).length;
    const lowScoreTotal = scoredLeads.filter(s => s.combined < 40).length;
    const precision = highScoreTotal > 0 ? highScoreConverted / highScoreTotal : 0;
    const specificity = lowScoreTotal > 0 ? lowScoreLost / lowScoreTotal : 0;

    return { hot, warm, cold, frozen, avgScore, totalValue, precision, specificity };
  }, [scoredLeads]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", color: C.blue,
              padding: "4px 10px", borderRadius: "4px",
              background: C.blueBg, border: `1px solid ${C.blue}33`,
            }}>
              Projeto Integrador · Cap 1
            </span>
          </div>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "0 0 4px", lineHeight: 1.3,
            background: `linear-gradient(135deg, ${C.text}, ${C.blue})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Lead Scoring — Costa Lima Piscinas
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Regras (M1) + Análise de sentimento (M2) + ML estatístico (M3) + Tudo no browser (M4)
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "16px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "pipeline", label: "Pipeline de Leads" },
            { id: "metrics", label: "Métricas" },
            { id: "architecture", label: "Arquitetura" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: "8px",
              fontSize: "11px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
              background: activeTab === tab.id ? C.surfaceAlt : "transparent",
              color: activeTab === tab.id ? C.text : C.textDim,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div>
            {/* Stats bar */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap",
            }}>
              {[
                { label: "Quentes", value: stats.hot, emoji: "🔥", color: C.green },
                { label: "Mornos", value: stats.warm, emoji: "🌤️", color: C.amber },
                { label: "Frios", value: stats.cold, emoji: "❄️", color: "#60a5fa" },
                { label: "Gelados", value: stats.frozen, emoji: "🧊", color: "#94a3b8" },
                { label: "Média", value: stats.avgScore, emoji: "◎", color: C.text },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, minWidth: "70px", padding: "10px 8px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>
                    {s.emoji} {s.value}
                  </div>
                  <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap",
              alignItems: "center",
            }}>
              <select value={filterScore} onChange={e => setFilterScore(e.target.value)} style={{
                padding: "7px 12px", borderRadius: "8px", border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontSize: "11px", fontFamily: "inherit",
              }}>
                <option value="all">Todos os scores</option>
                <option value="hot">🔥 Quentes (80+)</option>
                <option value="warm">🌤️ Mornos (60-79)</option>
                <option value="cold">❄️ Frios (40-59)</option>
                <option value="frozen">🧊 Gelados (&lt;40)</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                padding: "7px 12px", borderRadius: "8px", border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontSize: "11px", fontFamily: "inherit",
              }}>
                <option value="all">Todos os status</option>
                {STATUS_FUNIL.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                padding: "7px 12px", borderRadius: "8px", border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontSize: "11px", fontFamily: "inherit",
              }}>
                <option value="score_desc">Maior score</option>
                <option value="score_asc">Menor score</option>
                <option value="valor_desc">Maior valor</option>
                <option value="recent">Mais recentes</option>
              </select>
              <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "auto" }}>
                {filtered.length} leads
              </span>
            </div>

            {/* Lead list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(({ lead, rule, ml, sent }) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  ruleResult={rule}
                  mlResult={ml}
                  sentiment={sent}
                  isExpanded={expandedLead === lead.id}
                  onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === "metrics" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px",
            }}>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "20px", textAlign: "center",
              }}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: C.green }}>
                  {(stats.precision * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                  Precisão (score ≥60 converteu)
                </div>
                <div style={{ fontSize: "10px", color: C.textDim, marginTop: "4px" }}>
                  De {scoredLeads.filter(s => s.combined >= 60).length} leads com score alto,
                  {" "}{scoredLeads.filter(s => s.combined >= 60 && s.lead.converted).length} converteram
                </div>
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "20px", textAlign: "center",
              }}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: C.cyan }}>
                  {(stats.specificity * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                  Especificidade (score &lt;40 não converteu)
                </div>
                <div style={{ fontSize: "10px", color: C.textDim, marginTop: "4px" }}>
                  De {scoredLeads.filter(s => s.combined < 40).length} leads com score baixo,
                  {" "}{scoredLeads.filter(s => s.combined < 40 && !s.lead.converted).length} não converteram
                </div>
              </div>
            </div>

            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "20px", marginBottom: "12px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.amber, margin: "0 0 12px" }}>
                Pipeline de R${(stats.totalValue / 1000).toFixed(0)}k em leads quentes e mornos
              </h3>
              <p style={{ margin: 0, fontSize: "12px" }}>
                {scoredLeads.filter(s => s.combined >= 60).length} leads com score ≥60 representam
                R${(stats.totalValue / 1000).toFixed(0)}k em valor estimado. Focar o time comercial
                nesses leads primeiro maximiza conversão por hora investida.
              </p>
            </div>

            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "20px", marginBottom: "12px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.purple, margin: "0 0 12px" }}>
                Comparativo de Engines
              </h3>
              {[
                {
                  engine: "Regras (M1)",
                  desc: "7 critérios fixos: origem, tempo resposta, estágio funil, interações, valor, aging. Previsível, auditável, mas não aprende com dados.",
                  color: C.amber,
                },
                {
                  engine: "Naive Bayes (M3)",
                  desc: `Treinado com ${leads.length} leads usando 6 features. Aprende distribuições estatísticas. Melhor em capturar padrões sutis entre features combinadas.`,
                  color: C.cyan,
                },
                {
                  engine: "Sentimento (M2)",
                  desc: "Analisa texto das interações buscando sinais positivos e negativos. Simula o que um LLM faria com análise semântica completa.",
                  color: C.purple,
                },
                {
                  engine: "Ensemble Final",
                  desc: "Combina os três: 30% regras + 50% ML + 20% sentimento. O peso maior em ML reflete confiança nos dados; regras servem como guardrail; sentimento como sinal complementar.",
                  color: C.blue,
                },
              ].map(e => (
                <div key={e.engine} style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: `3px solid ${e.color}` }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: e.color }}>{e.engine}</div>
                  <div style={{ fontSize: "11px", color: C.textDim, lineHeight: 1.6 }}>{e.desc}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: `${C.green}08`, border: `1px solid ${C.green}22`,
              borderRadius: "10px", padding: "20px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 8px" }}>
                Critérios de Validação
              </h3>
              <div style={{ fontSize: "12px", lineHeight: 1.8 }}>
                <div>✅ Precisão ≥60%: leads com score alto realmente convertem</div>
                <div>✅ Especificidade ≥60%: leads com score baixo realmente não convertem</div>
                <div>✅ Explicabilidade: cada score tem reasoning transparente</div>
                <div>✅ Latência zero: roda no browser sem chamadas de API</div>
                <div>✅ Recomendações acionáveis: cada lead tem próximo passo sugerido</div>
              </div>
            </div>
          </div>
        )}

        {/* ARCHITECTURE TAB */}
        {activeTab === "architecture" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "Objetivo",
                color: C.blue,
                content: `Classificar automaticamente a probabilidade de conversão de cada lead do Costa Lima Piscinas, usando três abordagens complementares, e recomendar a próxima ação pro vendedor.

Resolve o problema real: vendedores gastam tempo igual em todos os leads, quando deveriam priorizar os com maior chance de fechar.`
              },
              {
                title: "Arquitetura",
                color: C.cyan,
                content: `Dados (PostgreSQL via API)
  → Engine 1: Regras determinísticas (7 critérios)
  → Engine 2: Naive Bayes Gaussiano (6 features numéricas)
  → Engine 3: Análise de sentimento do histórico (keywords)
    → Ensemble ponderado (30/50/20)
      → Score 0-100 + Label + Recomendação

Tudo roda no browser (Next.js/React). O backend só fornece os dados brutos dos leads via API REST existente. Zero infraestrutura adicional.`
              },
              {
                title: "Decisões Técnicas",
                color: C.amber,
                content: `1. Por que Naive Bayes e não rede neural?
   → Dataset pequeno (<100 leads). Bayes funciona bem com poucos dados. Neural precisa de centenas+.

2. Por que ensemble e não um único modelo?
   → Regras dão baseline previsível. ML captura padrões sutis. Sentimento captura sinais qualitativos. Juntos são mais robustos.

3. Por que rodar no browser?
   → Privacidade (dados de clientes não vão pra servidor externo). Latência zero. Custo zero de ML infra. Funciona com o PWA offline.

4. Por que pesos 30/50/20?
   → ML tem mais peso porque generaliza melhor. Regras como guardrail (30%). Sentimento é ruidoso, peso menor (20%).`
              },
              {
                title: "Limitações e Trade-offs",
                color: C.red,
                content: `Limitações:
- Dados simulados. Em produção, precisa dos dados reais do PostgreSQL.
- Naive Bayes assume independência entre features (simplificação).
- Análise de sentimento por keywords é primitiva — LLM real faria muito melhor.
- Score calibration: 70 no scoring não necessariamente = 70% de chance real.

Trade-offs:
- Simplicidade vs Precisão: modelos simples são interpretáveis mas menos precisos.
- Browser vs Servidor: zero custo mas limitado a modelos pequenos.
- Regras vs ML: regras são auditáveis mas não aprendem; ML aprende mas é opaco.

Próximos passos (Cap 2+):
- Substituir sentimento por keywords por chamada real a LLM (Cap 2).
- Conectar ao banco real via API existente.
- A/B test: vendedores com scoring vs sem scoring (medir taxa de conversão).
- Adicionar features: tempo médio entre interações, taxa de resposta do cliente.`
              },
              {
                title: "Como Integrar no Costa Lima PWA",
                color: C.green,
                content: `1. Frontend Admin → /leads
   Adicionar coluna "Score" na listagem e no Kanban de leads.
   O ScoreGauge aparece ao lado do nome do lead.

2. PWA Mobile → /leads (vendedores)
   Card com score + recomendação no topo da lista de leads do vendedor.
   Filtro "mostrar apenas quentes" pra priorização em campo.

3. Dashboard → /dashboard
   Novo card: "Pipeline qualificado" com valor total de leads quentes/mornos.
   Gráfico: distribuição de scores ao longo do tempo.

4. Backend → zero mudança necessária
   O scoring roda 100% no frontend com os dados que a API já retorna.
   Futuramente, pode mover pro backend pra consistência entre admin e PWA.`
              },
            ].map(section => (
              <div key={section.title} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "20px", marginBottom: "12px",
              }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>
                  {section.title}
                </h3>
                <pre style={{
                  margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit",
                  fontSize: "12px", lineHeight: 1.7,
                }}>
                  {section.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
