import { useState, useMemo } from "react";

// ============================================================
// MODEL DATABASE
// ============================================================
const MODELS = [
  {
    id: "haiku",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    tier: "economy",
    inputCost: 0.80, // per 1M tokens
    outputCost: 4.00,
    contextWindow: 200000,
    latencyMs: 400,
    quality: 72,
    strengths: ["Ultra rápido", "Muito barato", "Bom em classificação"],
    weaknesses: ["Menos nuance", "Pode simplificar demais"],
    color: "#f59e0b",
  },
  {
    id: "sonnet",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    tier: "balanced",
    inputCost: 3.00,
    outputCost: 15.00,
    contextWindow: 200000,
    latencyMs: 800,
    quality: 88,
    strengths: ["Boa inteligência", "Custo razoável", "Versátil", "Forte em PT-BR"],
    weaknesses: ["Não é o mais rápido", "Nem o mais barato"],
    color: "#8b5cf6",
  },
  {
    id: "opus",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    tier: "premium",
    inputCost: 15.00,
    outputCost: 75.00,
    contextWindow: 200000,
    latencyMs: 1500,
    quality: 96,
    strengths: ["Mais inteligente", "Raciocínio complexo", "Análise profunda"],
    weaknesses: ["Caro", "Mais lento", "Overkill para tarefas simples"],
    color: "#ec4899",
  },
  {
    id: "gpt4o",
    name: "GPT-4o",
    provider: "OpenAI",
    tier: "balanced",
    inputCost: 2.50,
    outputCost: 10.00,
    contextWindow: 128000,
    latencyMs: 700,
    quality: 87,
    strengths: ["Multimodal nativo", "Ecossistema amplo", "Bom em código"],
    weaknesses: ["Contexto menor que Claude", "Pode ser verboso"],
    color: "#10b981",
  },
  {
    id: "gpt4omini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "economy",
    inputCost: 0.15,
    outputCost: 0.60,
    contextWindow: 128000,
    latencyMs: 350,
    quality: 70,
    strengths: ["Extremamente barato", "Rápido", "Bom para tarefas simples"],
    weaknesses: ["Menos inteligente", "Limitado em raciocínio complexo"],
    color: "#22d3ee",
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    tier: "economy",
    inputCost: 0.15,
    outputCost: 0.60,
    contextWindow: 1000000,
    latencyMs: 300,
    quality: 73,
    strengths: ["Contexto 1M tokens", "Muito barato", "Ultra rápido"],
    weaknesses: ["Qualidade inferior em PT-BR", "Menos consistente"],
    color: "#3b82f6",
  },
  {
    id: "gemini-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    tier: "premium",
    inputCost: 1.25,
    outputCost: 10.00,
    contextWindow: 1000000,
    latencyMs: 900,
    quality: 90,
    strengths: ["Contexto 1M tokens", "Muito bom em raciocínio", "Multimodal forte"],
    weaknesses: ["Disponibilidade variável", "API menos madura"],
    color: "#6366f1",
  },
];

// ============================================================
// USE CASES - Costa Lima Piscinas
// ============================================================
const USE_CASES = [
  {
    id: "lead-classification",
    name: "Classificar intenção de leads",
    icon: "📋",
    description: "Analisar mensagens do WhatsApp/formulário e classificar intenção: construção, reforma, manutenção, orçamento, reclamação.",
    inputTokens: 280,
    outputTokens: 120,
    callsPerDay: 30,
    latencyReq: "moderate",
    qualityReq: "medium",
    dataRisk: "low",
    example: {
      input: 'System: Classifique a intenção do lead em: CONSTRUCAO, REFORMA, MANUTENCAO, ORCAMENTO, RECLAMACAO, OUTRO.\n\nMensagem: "Boa tarde, gostaria de saber quanto custa mais ou menos uma piscina de 8x4 com prainha e aquecimento solar. Tenho um terreno de 15x30 em Volta Redonda."',
      output: '{"intencao": "CONSTRUCAO", "servicos": ["piscina_nova", "prainha", "aquecimento_solar"], "dimensoes": "8x4m", "localizacao": "Volta Redonda", "urgencia": "media", "score_qualificacao": 85}'
    },
    recommendation: "haiku",
    reasoning: "Tarefa de classificação simples. Haiku ou GPT-4o Mini resolvem com ~95% de acurácia. Volume baixo, então custo é irrelevante, mas não há razão para usar modelo premium.",
  },
  {
    id: "orcamento-generator",
    name: "Gerar rascunho de orçamento",
    icon: "📄",
    description: "Com dados do cliente, catálogo e template, gerar proposta comercial formatada com itens, valores e condições.",
    inputTokens: 2200,
    outputTokens: 1800,
    callsPerDay: 5,
    latencyReq: "relaxed",
    qualityReq: "high",
    dataRisk: "medium",
    example: {
      input: 'Gere um orçamento para:\nCliente: João Silva\nServiço: Piscina 8x4 vinil, prainha, aquecimento solar\nCatálogo: [Piscina vinil 8x4: R$45.000, Prainha: R$8.000, Aquecimento Solar: R$12.000, Mão de obra: R$15.000]\nCondições: 50% entrada + 3x',
      output: "ORÇAMENTO #ORC-2026-000142\n\nSr(a). João Silva,\n\nSegue nossa proposta para construção de piscina:\n\n1. Piscina em vinil 8x4m — R$45.000,00\n2. Prainha integrada — R$8.000,00\n3. Sistema de aquecimento solar — R$12.000,00\n4. Mão de obra e instalação — R$15.000,00\n\nTotal: R$80.000,00\n\nCondições: 50% na aprovação (R$40.000) + 3 parcelas de R$13.333,33\nPrazo estimado: 45 dias úteis\nGarantia: 5 anos estrutural, 2 anos equipamentos"
    },
    recommendation: "sonnet",
    reasoning: "Precisa de boa qualidade de escrita, formatação correta e cálculos. Sonnet ou GPT-4o dão conta. Opus seria overkill — não é raciocínio complexo, é geração estruturada.",
  },
  {
    id: "diario-summary",
    name: "Resumir diários de obra",
    icon: "🏗️",
    description: "Consolidar diários de obra da semana em relatório executivo para o coordenador: progresso, problemas, próximos passos.",
    inputTokens: 4000,
    outputTokens: 800,
    callsPerDay: 8,
    latencyReq: "relaxed",
    qualityReq: "high",
    dataRisk: "low",
    example: {
      input: "Resuma os diários da semana da obra OBR-2026-000034:\nSeg: Iniciada escavação, 4 colaboradores, tempo bom.\nTer: Continuação escavação, encontrada rocha, necessário martelete.\nQua: Chuva forte, obra parada.\nQui: Retomada escavação com martelete, rocha removida.\nSex: Escavação concluída, início da ferragem.",
      output: "RESUMO SEMANAL — OBR-2026-000034\n\nProgresso: Escavação concluída (100%), ferragem iniciada.\nProblemas: Rocha inesperada (resolvido com martelete) + 1 dia parado por chuva.\nEquipe: 4 colaboradores/dia. Produtividade impactada em 20% pela rocha.\nPróxima semana: Conclusão da ferragem e início da concretagem.\nAlerta: Verificar previsão de chuva para não atrasar concretagem."
    },
    recommendation: "sonnet",
    reasoning: "Precisa sintetizar informações e gerar insights (rocha = problema, chuva = impacto). Haiku perde nuances. Sonnet é o sweet spot. Opus não agrega valor suficiente aqui.",
  },
  {
    id: "whatsapp-responder",
    name: "Rascunho de resposta no WhatsApp",
    icon: "💬",
    description: "Gerar rascunho de resposta para mensagens de clientes/leads no WhatsApp, com tom profissional e dados da empresa.",
    inputTokens: 500,
    outputTokens: 200,
    callsPerDay: 40,
    latencyReq: "fast",
    qualityReq: "medium",
    dataRisk: "medium",
    example: {
      input: 'Tom: profissional e amigável. Empresa: Costa Lima Piscinas.\nMensagem do cliente: "Oi, a bomba da minha piscina tá fazendo um barulho estranho, parece que tá cavitando. Vocês fazem manutenção?"\nContexto: cliente ativo, última manutenção há 6 meses.',
      output: "Olá! Tudo bem? 👋\n\nSim, fazemos manutenção! Pelo que você descreveu (barulho de cavitação), pode ser ar na tubulação ou desgaste do rotor da bomba. São problemas comuns e temos peças em estoque.\n\nPosso agendar uma visita técnica ainda esta semana? Normalmente resolvemos no mesmo dia.\n\nQual o melhor dia e horário pra você?"
    },
    recommendation: "haiku",
    reasoning: "Volume mais alto (40/dia), precisa ser rápido (WhatsApp = expectativa de resposta imediata). Haiku é perfeito: rápido, barato, e resposta curta não exige modelo premium. O vendedor vai revisar antes de enviar.",
  },
  {
    id: "contract-analysis",
    name: "Análise de contratos e laudos",
    icon: "⚖️",
    description: "Analisar documentos (contratos com fornecedores, laudos técnicos, termos de garantia) e extrair cláusulas relevantes, riscos e recomendações.",
    inputTokens: 8000,
    outputTokens: 2000,
    callsPerDay: 2,
    latencyReq: "relaxed",
    qualityReq: "critical",
    dataRisk: "high",
    example: {
      input: "[Contrato de fornecimento de equipamentos - 15 páginas]\nExtraia: cláusulas de garantia, penalidades, prazos de entrega, condições de devolução, riscos para o Costa Lima.",
      output: "ANÁLISE — Contrato Fornecedor XYZ\n\nGarantia: 12 meses peças, 90 dias serviço (ATENÇÃO: inferior ao padrão de mercado de 24 meses)\nPenalidade por atraso: 0.5%/dia (razoável)\nEntrega: 30 dias úteis, sem cláusula de força maior (RISCO)\nDevolução: apenas em 7 dias, sem defeito aparente (RESTRITIVO)\n\nRISCOS:\n1. Garantia curta — negociar para 24 meses\n2. Sem força maior — adicionar cláusula\n3. Devolução restritiva — ampliar para 15 dias\n\nRECOMENDAÇÃO: Negociar itens 1-3 antes de assinar."
    },
    recommendation: "opus",
    reasoning: "Análise jurídica requer raciocínio profundo, atenção a detalhes e capacidade de identificar riscos sutis. Volume baixo (2/dia), então custo não importa. Qualidade é crítica — erro aqui tem consequência legal/financeira real.",
  },
  {
    id: "photo-analysis",
    name: "Analisar fotos de vistorias/obras",
    icon: "📸",
    description: "Receber fotos da câmera do PWA e gerar descrição do estado da piscina, problemas identificados e recomendações.",
    inputTokens: 1500,
    outputTokens: 500,
    callsPerDay: 15,
    latencyReq: "moderate",
    qualityReq: "high",
    dataRisk: "low",
    example: {
      input: "[Foto da piscina]\nDescreva o estado da piscina, identifique problemas visíveis e recomende ações.",
      output: "VISTORIA VISUAL:\n\nEstado geral: Regular\nProblemas identificados:\n1. Revestimento com manchas esverdeadas (provável alga) no canto NE\n2. Rejunte deteriorado na linha d'água (infiltração potencial)\n3. Bomba com sinais de oxidação no eixo\n\nRecomendações:\n1. Tratamento de choque + escovação (urgente)\n2. Refazer rejunte na linha d'água (programar)\n3. Avaliar bomba — possível troca do selo mecânico\n\nPrioridade: MÉDIA-ALTA"
    },
    recommendation: "gpt4o",
    reasoning: "Requer visão (multimodal). GPT-4o e Gemini têm visão nativa. Claude também suporta imagens. Pra análise visual de qualidade, GPT-4o ou Sonnet com vision são as melhores opções.",
  },
];

function calculateCost(model, useCase) {
  const inputCostPerCall = (useCase.inputTokens / 1_000_000) * model.inputCost;
  const outputCostPerCall = (useCase.outputTokens / 1_000_000) * model.outputCost;
  const costPerCall = inputCostPerCall + outputCostPerCall;
  const costPerDay = costPerCall * useCase.callsPerDay;
  const costPerMonth = costPerDay * 30;
  return { costPerCall, costPerDay, costPerMonth };
}

// ============================================================
// COLORS
// ============================================================
const C = {
  bg: "#060911",
  surface: "#0c1119",
  surfaceAlt: "#121a27",
  border: "#1a2540",
  text: "#e0e8f5",
  textMuted: "#7589a8",
  textDim: "#3d506b",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  cyan: "#22d3ee",
  purple: "#8b5cf6",
  blue: "#2563eb",
  pink: "#ec4899",
};

// ============================================================
// COMPONENTS
// ============================================================

function CostBadge({ value }) {
  const color = value < 1 ? C.green : value < 10 ? C.amber : C.red;
  return (
    <span style={{ color, fontWeight: 800, fontSize: "13px" }}>
      ${value < 0.01 ? value.toFixed(4) : value < 1 ? value.toFixed(3) : value.toFixed(2)}
    </span>
  );
}

function ModelComparisonRow({ model, useCase, isRecommended }) {
  const cost = calculateCost(model, useCase);
  const meetsLatency = useCase.latencyReq === "relaxed" || 
    (useCase.latencyReq === "moderate" && model.latencyMs < 1200) ||
    (useCase.latencyReq === "fast" && model.latencyMs < 600);
  const meetsQuality = useCase.qualityReq === "medium" ||
    (useCase.qualityReq === "high" && model.quality >= 80) ||
    (useCase.qualityReq === "critical" && model.quality >= 90);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", borderRadius: "10px",
      background: isRecommended ? `${model.color}08` : C.surface,
      border: `1px solid ${isRecommended ? model.color + "33" : C.border}`,
      transition: "all 0.2s",
    }}>
      <div style={{
        width: "6px", height: "40px", borderRadius: "3px",
        background: model.color, flexShrink: 0, opacity: isRecommended ? 1 : 0.3,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: isRecommended ? model.color : C.text }}>
            {model.name}
          </span>
          {isRecommended && (
            <span style={{
              fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px",
              background: `${model.color}20`, color: model.color, letterSpacing: "0.5px",
            }}>
              RECOMENDADO
            </span>
          )}
        </div>
        <div style={{ fontSize: "10px", color: C.textDim }}>
          {model.provider} · {model.tier} · {model.contextWindow > 200000 ? `${(model.contextWindow/1000)}K ctx` : `${(model.contextWindow/1000).toFixed(0)}K ctx`}
        </div>
      </div>
      <div style={{ textAlign: "center", minWidth: "55px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: model.quality >= 85 ? C.green : model.quality >= 70 ? C.amber : C.textDim }}>
          {model.quality}
        </div>
        <div style={{ fontSize: "9px", color: C.textDim }}>qualidade</div>
      </div>
      <div style={{ textAlign: "center", minWidth: "55px" }}>
        <div style={{
          fontSize: "12px", fontWeight: 700,
          color: meetsLatency ? C.green : C.red,
        }}>
          {model.latencyMs}ms
        </div>
        <div style={{ fontSize: "9px", color: C.textDim }}>latência</div>
      </div>
      <div style={{ textAlign: "center", minWidth: "65px" }}>
        <CostBadge value={cost.costPerCall} />
        <div style={{ fontSize: "9px", color: C.textDim }}>/chamada</div>
      </div>
      <div style={{ textAlign: "center", minWidth: "60px" }}>
        <CostBadge value={cost.costPerMonth} />
        <div style={{ fontSize: "9px", color: C.textDim }}>/mês</div>
      </div>
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: meetsLatency ? C.green : C.red,
        }} title={meetsLatency ? "Atende latência" : "Não atende latência"} />
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: meetsQuality ? C.green : C.red,
        }} title={meetsQuality ? "Atende qualidade" : "Não atende qualidade"} />
      </div>
    </div>
  );
}

function UseCaseDetail({ useCase }) {
  return (
    <div>
      <div style={{
        background: C.surfaceAlt, borderRadius: "10px", padding: "16px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
          {[
            { label: "Input", value: `${useCase.inputTokens} tokens`, color: C.cyan },
            { label: "Output", value: `${useCase.outputTokens} tokens`, color: C.purple },
            { label: "Volume", value: `${useCase.callsPerDay}/dia`, color: C.amber },
            { label: "Latência", value: useCase.latencyReq, color: useCase.latencyReq === "fast" ? C.red : C.green },
            { label: "Qualidade", value: useCase.qualityReq, color: useCase.qualityReq === "critical" ? C.pink : C.amber },
            { label: "Risco dados", value: useCase.dataRisk, color: useCase.dataRisk === "high" ? C.red : C.green },
          ].map(s => (
            <div key={s.label} style={{ fontSize: "10px" }}>
              <span style={{ color: C.textDim }}>{s.label}: </span>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Example */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{
            fontSize: "10px", color: C.textDim, marginBottom: "6px",
            fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
          }}>
            Exemplo de prompt e resposta
          </div>
          <div style={{
            background: C.bg, borderRadius: "8px", padding: "12px",
            fontSize: "11px", lineHeight: 1.6, marginBottom: "8px",
          }}>
            <div style={{ color: C.cyan, fontWeight: 700, marginBottom: "4px" }}>INPUT:</div>
            <div style={{ color: C.textMuted, whiteSpace: "pre-wrap" }}>{useCase.example.input}</div>
          </div>
          <div style={{
            background: C.bg, borderRadius: "8px", padding: "12px",
            fontSize: "11px", lineHeight: 1.6,
          }}>
            <div style={{ color: C.green, fontWeight: 700, marginBottom: "4px" }}>OUTPUT:</div>
            <div style={{ color: C.textMuted, whiteSpace: "pre-wrap" }}>{useCase.example.output}</div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{
        padding: "14px 16px", borderRadius: "10px", marginBottom: "14px",
        background: `${MODELS.find(m => m.id === useCase.recommendation)?.color}08`,
        border: `1px solid ${MODELS.find(m => m.id === useCase.recommendation)?.color}22`,
        fontSize: "12px", color: C.text, lineHeight: 1.6,
      }}>
        <span style={{
          fontWeight: 700,
          color: MODELS.find(m => m.id === useCase.recommendation)?.color,
        }}>
          Análise:
        </span>{" "}
        {useCase.reasoning}
      </div>

      {/* All models comparison */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {MODELS.map(model => (
          <ModelComparisonRow
            key={model.id}
            model={model}
            useCase={useCase}
            isRecommended={model.id === useCase.recommendation}
          />
        ))}
      </div>
    </div>
  );
}

function CostSimulator() {
  const [customCalls, setCustomCalls] = useState(100);
  const [customInput, setCustomInput] = useState(500);
  const [customOutput, setCustomOutput] = useState(300);

  const customUseCase = { inputTokens: customInput, outputTokens: customOutput, callsPerDay: customCalls };

  return (
    <div>
      <div style={{
        background: C.surfaceAlt, borderRadius: "10px", padding: "16px", marginBottom: "16px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <label style={{ fontSize: "11px", color: C.textMuted }}>
            Chamadas/dia
            <input type="number" value={customCalls} onChange={e => setCustomCalls(Number(e.target.value))}
              style={{
                display: "block", width: "100%", marginTop: "4px", padding: "8px 10px",
                borderRadius: "6px", border: `1px solid ${C.border}`, background: C.bg,
                color: C.text, fontSize: "14px", fontFamily: "inherit", fontWeight: 700,
              }}
            />
          </label>
          <label style={{ fontSize: "11px", color: C.textMuted }}>
            Tokens input/chamada
            <input type="number" value={customInput} onChange={e => setCustomInput(Number(e.target.value))}
              style={{
                display: "block", width: "100%", marginTop: "4px", padding: "8px 10px",
                borderRadius: "6px", border: `1px solid ${C.border}`, background: C.bg,
                color: C.text, fontSize: "14px", fontFamily: "inherit", fontWeight: 700,
              }}
            />
          </label>
          <label style={{ fontSize: "11px", color: C.textMuted }}>
            Tokens output/chamada
            <input type="number" value={customOutput} onChange={e => setCustomOutput(Number(e.target.value))}
              style={{
                display: "block", width: "100%", marginTop: "4px", padding: "8px 10px",
                borderRadius: "6px", border: `1px solid ${C.border}`, background: C.bg,
                color: C.text, fontSize: "14px", fontFamily: "inherit", fontWeight: 700,
              }}
            />
          </label>
        </div>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 80px 80px 80px",
          fontSize: "10px", fontWeight: 700, color: C.textDim, letterSpacing: "0.5px",
          padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
          textTransform: "uppercase",
        }}>
          <div>Modelo</div>
          <div style={{ textAlign: "right" }}>/chamada</div>
          <div style={{ textAlign: "right" }}>/dia</div>
          <div style={{ textAlign: "right" }}>/mês</div>
          <div style={{ textAlign: "right" }}>/ano</div>
        </div>
        {MODELS.sort((a, b) => {
          const ca = calculateCost(a, customUseCase);
          const cb = calculateCost(b, customUseCase);
          return ca.costPerMonth - cb.costPerMonth;
        }).map((model, i) => {
          const cost = calculateCost(model, customUseCase);
          return (
            <div key={model.id} style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 80px 80px",
              fontSize: "11px", padding: "10px 14px",
              borderBottom: i < MODELS.length - 1 ? `1px solid ${C.border}` : "none",
              background: i === 0 ? `${C.green}06` : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "4px", height: "16px", borderRadius: "2px", background: model.color }} />
                <span style={{ fontWeight: 600, color: i === 0 ? C.green : C.text }}>{model.name}</span>
                {i === 0 && <span style={{ fontSize: "8px", color: C.green, fontWeight: 800 }}>MAIS BARATO</span>}
              </div>
              <div style={{ textAlign: "right", color: C.textMuted }}>
                ${cost.costPerCall < 0.01 ? cost.costPerCall.toFixed(5) : cost.costPerCall.toFixed(4)}
              </div>
              <div style={{ textAlign: "right", color: C.textMuted }}>
                ${cost.costPerDay.toFixed(2)}
              </div>
              <div style={{ textAlign: "right", color: i === 0 ? C.green : C.amber, fontWeight: 700 }}>
                ${cost.costPerMonth.toFixed(2)}
              </div>
              <div style={{ textAlign: "right", color: C.textDim }}>
                ${(cost.costPerMonth * 12).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AIProviderLab() {
  const [activeTab, setActiveTab] = useState("cases");
  const [selectedCase, setSelectedCase] = useState(USE_CASES[0].id);

  const currentCase = USE_CASES.find(u => u.id === selectedCase);

  const totalMonthlyCost = useMemo(() => {
    return USE_CASES.reduce((total, uc) => {
      const model = MODELS.find(m => m.id === uc.recommendation);
      if (!model) return total;
      const cost = calculateCost(model, uc);
      return total + cost.costPerMonth;
    }, 0);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: C.amber,
            padding: "4px 10px", borderRadius: "4px",
            background: `${C.amber}12`, border: `1px solid ${C.amber}33`,
          }}>
            Cap 2 · Módulo 1
          </span>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.3,
            background: `linear-gradient(135deg, ${C.text}, ${C.amber})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Mercado e Provedores de IA
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Simulador de custo e decisão — Cenários reais do Costa Lima Piscinas
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "cases", label: "Casos de Uso" },
            { id: "simulator", label: "Simulador de Custo" },
            { id: "total", label: "Custo Total" },
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

        {/* CASES TAB */}
        {activeTab === "cases" && (
          <div>
            {/* Case selector */}
            <div style={{
              display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap",
            }}>
              {USE_CASES.map(uc => (
                <button key={uc.id} onClick={() => setSelectedCase(uc.id)} style={{
                  padding: "8px 14px", borderRadius: "8px", fontSize: "11px",
                  fontFamily: "inherit", cursor: "pointer",
                  border: `1px solid ${selectedCase === uc.id ? C.amber : C.border}`,
                  background: selectedCase === uc.id ? `${C.amber}12` : "transparent",
                  color: selectedCase === uc.id ? C.amber : C.textMuted,
                  fontWeight: selectedCase === uc.id ? 700 : 400,
                }}>
                  {uc.icon} {uc.name}
                </button>
              ))}
            </div>

            {currentCase && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
                    {currentCase.icon} {currentCase.name}
                  </h2>
                  <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
                    {currentCase.description}
                  </p>
                </div>
                <UseCaseDetail useCase={currentCase} />
              </div>
            )}
          </div>
        )}

        {/* SIMULATOR TAB */}
        {activeTab === "simulator" && (
          <div>
            <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Configure os parâmetros do seu caso de uso e veja o custo mensal por modelo, ordenado do mais barato ao mais caro.
            </p>
            <CostSimulator />
          </div>
        )}

        {/* TOTAL TAB */}
        {activeTab === "total" && (
          <div>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "24px", marginBottom: "16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", color: C.textDim, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Custo mensal total — todos os casos de uso com modelo recomendado
              </div>
              <div style={{ fontSize: "40px", fontWeight: 800, color: C.green }}>
                ${totalMonthlyCost.toFixed(2)}
              </div>
              <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>
                ≈ R${(totalMonthlyCost * 5.8).toFixed(2)}/mês (câmbio estimado)
              </div>
            </div>

            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              overflow: "hidden", marginBottom: "16px",
            }}>
              {USE_CASES.map((uc, i) => {
                const model = MODELS.find(m => m.id === uc.recommendation);
                const cost = calculateCost(model, uc);
                return (
                  <div key={uc.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px",
                    borderBottom: i < USE_CASES.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontSize: "16px" }}>{uc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: C.text }}>{uc.name}</div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>
                        {model.name} · {uc.callsPerDay} chamadas/dia
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: model.color }}>
                        ${cost.costPerMonth.toFixed(2)}/mês
                      </div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>
                        ${cost.costPerCall.toFixed(5)}/chamada
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: `${C.green}08`, border: `1px solid ${C.green}22`,
              borderRadius: "10px", padding: "20px", fontSize: "12px",
              color: C.textMuted, lineHeight: 1.8,
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 8px" }}>
                Perspectiva de negócio
              </h3>
              <p style={{ margin: "0 0 8px" }}>
                O custo total de IA para o Costa Lima com 6 features inteligentes é menor que
                <strong style={{ color: C.green }}> R${(totalMonthlyCost * 5.8).toFixed(2)}/mês</strong>.
              </p>
              <p style={{ margin: "0 0 8px" }}>
                Para comparação: um estagiário que fizesse essas mesmas tarefas manualmente
                (classificar leads, rascunhar orçamentos, resumir diários, responder WhatsApp)
                custaria R$1.500-2.000/mês + encargos.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.text }}>ROI:</strong> mesmo que a IA só economize 2h/dia do vendedor
                ou coordenador, o retorno sobre esses R${(totalMonthlyCost * 5.8).toFixed(2)} é absurdo.
                O gargalo nunca é custo de API — é qualidade da integração.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
