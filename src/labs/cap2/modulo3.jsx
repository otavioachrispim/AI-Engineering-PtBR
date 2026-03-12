import { useState, useCallback, useRef } from "react";

// ============================================================
// SIMULATED AI SERVICE - Full request lifecycle
// ============================================================

const MODELS = {
  haiku: { name: "Claude Haiku 4.5", costIn: 0.80, costOut: 4.00, latencyBase: 350, color: "#f59e0b" },
  sonnet: { name: "Claude Sonnet 4.6", costIn: 3.00, costOut: 15.00, latencyBase: 750, color: "#8b5cf6" },
  opus: { name: "Claude Opus 4.6", costIn: 15.00, costOut: 75.00, latencyBase: 1400, color: "#ec4899" },
};

// Simulated cache
const responseCache = new Map();

// Simulated log store
let logStore = [];
let logIdCounter = 1;

function generateId() {
  return `log_${String(logIdCounter++).padStart(4, "0")}`;
}

function hashPrompt(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return `cache_${Math.abs(h).toString(36)}`;
}

function countTokens(text) {
  return Math.ceil(text.length / 3.5);
}

function estimateCost(model, inputTokens, outputTokens) {
  const m = MODELS[model];
  return ((inputTokens / 1_000_000) * m.costIn) + ((outputTokens / 1_000_000) * m.costOut);
}

// Simulated AI responses based on input
function generateAIResponse(template, input) {
  const lower = input.toLowerCase();

  if (template === "classify") {
    const isConstruction = lower.includes("piscina") && (lower.includes("cust") || lower.includes("fazer") || lower.includes("quero"));
    const isMaint = lower.includes("bomba") || lower.includes("verde") || lower.includes("limpe") || lower.includes("turva");
    const isComplaint = lower.includes("insatisfeito") || lower.includes("infiltr") || lower.includes("reclam");

    const intencao = isComplaint ? "RECLAMACAO" : isMaint ? "MANUTENCAO" : isConstruction ? "CONSTRUCAO" : "ORCAMENTO";
    return JSON.stringify({
      intencao,
      confianca: isComplaint ? 95 : isMaint ? 90 : isConstruction ? 88 : 72,
      servicos: intencao === "CONSTRUCAO" ? ["piscina_nova"] : intencao === "MANUTENCAO" ? ["reparo"] : [],
      urgencia: isComplaint || isMaint ? "alta" : "media",
      proximo_passo: intencao === "CONSTRUCAO" ? "Agendar visita técnica" : "Encaminhar equipe",
    });
  }

  if (template === "whatsapp") {
    return JSON.stringify({
      resposta: "Olá! Tudo bem? 👋\n\nObrigado pelo contato! Vou verificar a melhor opção para você e retorno em breve.\n\nQual o melhor horário para conversarmos?",
      tom: "amigável",
      proximo_passo: "follow_up_24h",
    });
  }

  if (template === "summary") {
    return JSON.stringify({
      progresso: "Escavação 100% concluída. Ferragem iniciada.",
      problemas: [{ descricao: "Rocha encontrada", impacto: "1 dia de atraso", status: "resolvido" }],
      equipe_media: "4 pessoas/dia",
      proxima_semana: "Conclusão ferragem + início concretagem",
    });
  }

  return JSON.stringify({ result: "OK", processed: true });
}

// Schema validation
function validateSchema(template, data) {
  const schemas = {
    classify: {
      required: ["intencao", "confianca", "servicos", "urgencia", "proximo_passo"],
      enums: { intencao: ["CONSTRUCAO", "REFORMA", "MANUTENCAO", "ORCAMENTO", "RECLAMACAO"], urgencia: ["baixa", "media", "alta"] },
      ranges: { confianca: [0, 100] },
    },
    whatsapp: {
      required: ["resposta", "tom", "proximo_passo"],
      enums: {},
      ranges: {},
    },
    summary: {
      required: ["progresso", "problemas", "equipe_media", "proxima_semana"],
      enums: {},
      ranges: {},
    },
  };

  const schema = schemas[template];
  if (!schema) return { valid: true, errors: [] };

  const errors = [];

  schema.required.forEach(field => {
    if (!(field in data)) errors.push(`Campo obrigatório ausente: ${field}`);
  });

  Object.entries(schema.enums).forEach(([field, values]) => {
    if (data[field] && !values.includes(data[field])) {
      errors.push(`Valor inválido para ${field}: "${data[field]}". Esperado: ${values.join(", ")}`);
    }
  });

  Object.entries(schema.ranges).forEach(([field, [min, max]]) => {
    if (data[field] !== undefined && (data[field] < min || data[field] > max)) {
      errors.push(`${field} fora do range [${min}, ${max}]: ${data[field]}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// ============================================================
// FULL REQUEST SIMULATOR
// ============================================================

function simulateFullRequest({
  template, model, input, enableCache, enableRetry, enableValidation,
  simulateError, simulateRateLimit, simulateInvalidJson,
}) {
  const steps = [];
  const startTime = Date.now();
  let totalLatency = 0;

  // STEP 1: RECEIVE
  steps.push({
    phase: "receive",
    label: "Request recebido",
    detail: `Endpoint: /api/ai/${template}\nModel: ${MODELS[model].name}\nInput: ${input.substring(0, 80)}...`,
    status: "ok",
    duration: 1,
  });
  totalLatency += 1;

  // STEP 2: TEMPLATE RESOLUTION
  const templateVersion = template === "classify" ? "v2.1.0" : template === "whatsapp" ? "v1.4.0" : "v1.0.0";
  const systemPrompt = `Você é o assistente da Costa Lima Piscinas para ${template}...`;
  const fullPrompt = `${systemPrompt}\n\n${input}`;
  const inputTokens = countTokens(fullPrompt);

  steps.push({
    phase: "template",
    label: "Template resolvido",
    detail: `Template: ${template} ${templateVersion}\nInput tokens: ${inputTokens}`,
    status: "ok",
    duration: 2,
  });
  totalLatency += 2;

  // STEP 3: CACHE CHECK
  const cacheKey = hashPrompt(fullPrompt);
  let fromCache = false;

  if (enableCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      fromCache = true;
      steps.push({
        phase: "cache",
        label: "Cache HIT ✓",
        detail: `Key: ${cacheKey}\nAge: ${Math.round((Date.now() - cached.timestamp) / 1000)}s\nEconomia: ~$${estimateCost(model, inputTokens, 100).toFixed(6)}`,
        status: "cached",
        duration: 3,
      });
      totalLatency += 3;

      const outputTokens = countTokens(cached.response);
      const log = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        model: MODELS[model].name,
        template: `${template} ${templateVersion}`,
        inputTokens,
        outputTokens,
        latencyMs: totalLatency,
        cost: 0,
        fromCache: true,
        validOutput: true,
        error: null,
        retryCount: 0,
      };
      logStore = [log, ...logStore].slice(0, 50);

      steps.push({
        phase: "complete",
        label: "Resposta entregue (do cache)",
        detail: `Latência total: ${totalLatency}ms\nCusto: $0.00 (cache)`,
        status: "ok",
        duration: 0,
      });

      return { steps, response: cached.response, log, fromCache: true, totalLatency };
    } else {
      steps.push({
        phase: "cache",
        label: "Cache MISS",
        detail: `Key: ${cacheKey}\nProsseguindo para API...`,
        status: "warn",
        duration: 2,
      });
      totalLatency += 2;
    }
  }

  // STEP 4: API CALL (with potential errors)
  let retryCount = 0;
  let apiSuccess = false;
  let apiResponse = "";

  if (simulateRateLimit && enableRetry) {
    // Simulate 429 + retry
    steps.push({
      phase: "api",
      label: "API Call → 429 Rate Limited",
      detail: `Tentativa 1/3\nRetry-After: 2s\nAguardando...`,
      status: "error",
      duration: MODELS[model].latencyBase + 2000,
    });
    totalLatency += MODELS[model].latencyBase + 2000;
    retryCount = 1;

    steps.push({
      phase: "retry",
      label: "Retry #1 (backoff 2s)",
      detail: `Tentativa 2/3\nBackoff exponencial: 2^1 = 2s`,
      status: "warn",
      duration: 2000,
    });
    totalLatency += 2000;

    // Success on retry
    const latency = MODELS[model].latencyBase + Math.floor(Math.random() * 200);
    apiResponse = simulateInvalidJson
      ? `Sure! Here's the classification:\n\`\`\`json\n${generateAIResponse(template, input)}\n\`\`\``
      : generateAIResponse(template, input);

    steps.push({
      phase: "api",
      label: "API Call → 200 OK",
      detail: `Tentativa 2/3\nModel: ${MODELS[model].name}\nLatência: ${latency}ms`,
      status: "ok",
      duration: latency,
    });
    totalLatency += latency;
    apiSuccess = true;
  } else if (simulateError) {
    steps.push({
      phase: "api",
      label: "API Call → 500 Internal Error",
      detail: `Model: ${MODELS[model].name}\nErro: "Internal server error"\n${enableRetry ? "Iniciando retry..." : "Sem retry habilitado — falha."}`,
      status: "error",
      duration: MODELS[model].latencyBase,
    });
    totalLatency += MODELS[model].latencyBase;

    if (enableRetry) {
      for (let i = 1; i <= 2; i++) {
        const backoff = Math.pow(2, i) * 1000;
        steps.push({
          phase: "retry",
          label: `Retry #${i} (backoff ${backoff / 1000}s)`,
          detail: `Tentativa ${i + 1}/3`,
          status: "warn",
          duration: backoff,
        });
        totalLatency += backoff;
        retryCount = i;
      }

      // Still fails
      steps.push({
        phase: "api",
        label: "Todas as tentativas falharam",
        detail: `3/3 tentativas esgotadas\nRetornando fallback...`,
        status: "error",
        duration: 0,
      });

      const log = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        model: MODELS[model].name,
        template: `${template} ${templateVersion}`,
        inputTokens,
        outputTokens: 0,
        latencyMs: totalLatency,
        cost: 0,
        fromCache: false,
        validOutput: false,
        error: "500 Internal Server Error after 3 retries",
        retryCount,
      };
      logStore = [log, ...logStore].slice(0, 50);

      steps.push({
        phase: "fallback",
        label: "Fallback ativado",
        detail: `Retornando classificação padrão com flag de revisão humana.`,
        status: "warn",
        duration: 1,
      });

      return {
        steps,
        response: JSON.stringify({ intencao: "DESCONHECIDO", confianca: 0, flagRevisao: true, error: "AI service unavailable" }, null, 2),
        log,
        fromCache: false,
        totalLatency,
        error: true,
      };
    } else {
      const log = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        model: MODELS[model].name,
        template: `${template} ${templateVersion}`,
        inputTokens,
        outputTokens: 0,
        latencyMs: totalLatency,
        cost: 0,
        fromCache: false,
        validOutput: false,
        error: "500 Internal Server Error (no retry)",
        retryCount: 0,
      };
      logStore = [log, ...logStore].slice(0, 50);

      return {
        steps,
        response: JSON.stringify({ error: "AI service unavailable" }, null, 2),
        log,
        fromCache: false,
        totalLatency,
        error: true,
      };
    }
  } else {
    // Normal success
    const latency = MODELS[model].latencyBase + Math.floor(Math.random() * 200);
    apiResponse = simulateInvalidJson
      ? `Here's the result:\n\`\`\`json\n${generateAIResponse(template, input)}\n\`\`\`\nLet me know if you need changes!`
      : generateAIResponse(template, input);

    steps.push({
      phase: "api",
      label: "API Call → 200 OK",
      detail: `Model: ${MODELS[model].name}\nLatência: ${latency}ms\nOutput tokens: ~${countTokens(apiResponse)}`,
      status: "ok",
      duration: latency,
    });
    totalLatency += latency;
    apiSuccess = true;
  }

  // STEP 5: PARSE & VALIDATE
  let parsed = null;
  let parseOk = false;
  let schemaOk = false;
  let cleanedResponse = apiResponse;

  if (apiSuccess) {
    // Clean markdown fences
    let cleaned = apiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Try to extract JSON if wrapped in text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const hadToClean = cleaned !== apiResponse;
    if (hadToClean) {
      steps.push({
        phase: "parse",
        label: "Limpeza de output",
        detail: `Removidos: markdown fences, texto extra\nJSON extraído: ${cleaned.substring(0, 60)}...`,
        status: "warn",
        duration: 1,
      });
      totalLatency += 1;
    }

    try {
      parsed = JSON.parse(cleaned);
      parseOk = true;
      cleanedResponse = JSON.stringify(parsed, null, 2);
      steps.push({
        phase: "parse",
        label: "JSON.parse → OK",
        detail: `Campos: ${Object.keys(parsed).join(", ")}`,
        status: "ok",
        duration: 1,
      });
    } catch (e) {
      steps.push({
        phase: "parse",
        label: "JSON.parse → FALHA",
        detail: `Erro: ${e.message}\nOutput bruto: ${apiResponse.substring(0, 100)}...`,
        status: "error",
        duration: 1,
      });
    }
    totalLatency += 1;

    if (enableValidation && parsed) {
      const validation = validateSchema(template, parsed);
      schemaOk = validation.valid;
      steps.push({
        phase: "validate",
        label: `Schema validation → ${schemaOk ? "OK" : "FALHA"}`,
        detail: schemaOk
          ? `Todos os campos obrigatórios presentes. Enums e ranges válidos.`
          : `Erros:\n${validation.errors.join("\n")}`,
        status: schemaOk ? "ok" : "error",
        duration: 1,
      });
      totalLatency += 1;
    }
  }

  // STEP 6: CACHE STORE
  if (apiSuccess && parseOk && enableCache) {
    responseCache.set(cacheKey, { response: cleanedResponse, timestamp: Date.now() });
    steps.push({
      phase: "cache",
      label: "Cache STORE",
      detail: `Key: ${cacheKey}\nTTL: 1h`,
      status: "ok",
      duration: 1,
    });
    totalLatency += 1;
  }

  // STEP 7: LOG
  const outputTokens = countTokens(cleanedResponse);
  const cost = estimateCost(model, inputTokens, outputTokens);
  const log = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    model: MODELS[model].name,
    template: `${template} ${templateVersion}`,
    inputTokens,
    outputTokens,
    latencyMs: totalLatency,
    cost,
    fromCache: false,
    validOutput: parseOk && schemaOk,
    error: null,
    retryCount,
  };
  logStore = [log, ...logStore].slice(0, 50);

  steps.push({
    phase: "log",
    label: "Log registrado",
    detail: `ID: ${log.id}\nTokens: ${inputTokens} in + ${outputTokens} out\nCusto: $${cost.toFixed(6)}\nLatência: ${totalLatency}ms`,
    status: "ok",
    duration: 1,
  });
  totalLatency += 1;

  steps.push({
    phase: "complete",
    label: "Resposta entregue",
    detail: `Total: ${totalLatency}ms | $${cost.toFixed(6)} | ${retryCount} retries | cache: ${fromCache}`,
    status: "ok",
    duration: 0,
  });

  return { steps, response: cleanedResponse, log, fromCache, totalLatency };
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
  blue: "#3b82f6",
};

const PHASE_STYLES = {
  receive: { icon: "→", color: C.textMuted },
  template: { icon: "📋", color: C.cyan },
  cache: { icon: "💾", color: C.blue },
  api: { icon: "🌐", color: C.purple },
  retry: { icon: "🔄", color: C.amber },
  parse: { icon: "🔧", color: C.cyan },
  validate: { icon: "✓", color: C.green },
  log: { icon: "📊", color: C.textMuted },
  complete: { icon: "●", color: C.green },
  fallback: { icon: "⚠", color: C.amber },
};

const STATUS_COLORS = { ok: C.green, warn: C.amber, error: C.red, cached: C.blue };

// ============================================================
// COMPONENTS
// ============================================================

function StepTimeline({ steps }) {
  return (
    <div>
      {steps.map((step, i) => {
        const ps = PHASE_STYLES[step.phase] || PHASE_STYLES.receive;
        const sc = STATUS_COLORS[step.status] || C.textMuted;
        return (
          <div key={i} style={{ display: "flex", gap: "12px", position: "relative" }}>
            {i < steps.length - 1 && (
              <div style={{
                position: "absolute", left: "9px", top: "22px", bottom: "-4px",
                width: "1px", background: C.border,
              }} />
            )}
            <div style={{
              width: "20px", height: "20px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", flexShrink: 0,
              background: `${sc}15`, border: `1px solid ${sc}33`,
            }}>
              <span style={{ fontSize: "10px" }}>{ps.icon}</span>
            </div>
            <div style={{ flex: 1, paddingBottom: "14px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: sc }}>
                  {step.label}
                </span>
                {step.duration > 0 && (
                  <span style={{ fontSize: "9px", color: C.textDim }}>
                    +{step.duration}ms
                  </span>
                )}
              </div>
              <pre style={{
                margin: 0, fontSize: "10px", color: C.textDim, lineHeight: 1.5,
                whiteSpace: "pre-wrap", fontFamily: "inherit",
              }}>
                {step.detail}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AIBackendLab() {
  const [activeTab, setActiveTab] = useState("simulator");

  // Simulator state
  const [template, setTemplate] = useState("classify");
  const [model, setModel] = useState("haiku");
  const [input, setInput] = useState("Boa tarde, gostaria de saber quanto custa uma piscina 8x4 com aquecimento solar.");
  const [enableCache, setEnableCache] = useState(true);
  const [enableRetry, setEnableRetry] = useState(true);
  const [enableValidation, setEnableValidation] = useState(true);
  const [simulateError, setSimulateError] = useState(false);
  const [simulateRateLimit, setSimulateRateLimit] = useState(false);
  const [simulateInvalidJson, setSimulateInvalidJson] = useState(false);
  const [result, setResult] = useState(null);

  const runSimulation = useCallback(() => {
    const r = simulateFullRequest({
      template, model, input,
      enableCache, enableRetry, enableValidation,
      simulateError, simulateRateLimit, simulateInvalidJson,
    });
    setResult(r);
  }, [template, model, input, enableCache, enableRetry, enableValidation, simulateError, simulateRateLimit, simulateInvalidJson]);

  // Stats from logs
  const stats = {
    total: logStore.length,
    cached: logStore.filter(l => l.fromCache).length,
    errors: logStore.filter(l => l.error).length,
    totalCost: logStore.reduce((s, l) => s + l.cost, 0),
    avgLatency: logStore.length > 0 ? Math.round(logStore.reduce((s, l) => s + l.latencyMs, 0) / logStore.length) : 0,
    totalTokens: logStore.reduce((s, l) => s + l.inputTokens + l.outputTokens, 0),
  };

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
            textTransform: "uppercase", color: C.green,
            padding: "4px 10px", borderRadius: "4px",
            background: `${C.green}12`, border: `1px solid ${C.green}33`,
          }}>
            Cap 2 · Módulo 3
          </span>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.3,
            background: `linear-gradient(135deg, ${C.text}, ${C.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Operação de Backend com IA
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Request lifecycle: retry · cache · validação · logs · fallback
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "simulator", label: "Simulador" },
            { id: "logs", label: `Logs (${logStore.length})` },
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

        {/* SIMULATOR */}
        {activeTab === "simulator" && (
          <div>
            {/* Config */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "16px", marginBottom: "12px",
            }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "11px", color: C.textMuted, flex: 1, minWidth: "120px" }}>
                  Template
                  <select value={template} onChange={e => setTemplate(e.target.value)} style={{
                    display: "block", width: "100%", marginTop: "4px", padding: "8px",
                    borderRadius: "6px", border: `1px solid ${C.border}`, background: C.surfaceAlt,
                    color: C.text, fontSize: "11px", fontFamily: "inherit",
                  }}>
                    <option value="classify">Classificar Lead</option>
                    <option value="whatsapp">Resposta WhatsApp</option>
                    <option value="summary">Resumo de Obra</option>
                  </select>
                </label>
                <label style={{ fontSize: "11px", color: C.textMuted, flex: 1, minWidth: "120px" }}>
                  Modelo
                  <select value={model} onChange={e => setModel(e.target.value)} style={{
                    display: "block", width: "100%", marginTop: "4px", padding: "8px",
                    borderRadius: "6px", border: `1px solid ${C.border}`, background: C.surfaceAlt,
                    color: C.text, fontSize: "11px", fontFamily: "inherit",
                  }}>
                    {Object.entries(MODELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "12px" }}>
                Mensagem de input
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} style={{
                  display: "block", width: "100%", marginTop: "4px", padding: "10px",
                  borderRadius: "6px", border: `1px solid ${C.border}`, background: C.surfaceAlt,
                  color: C.text, fontSize: "11px", fontFamily: "inherit", resize: "vertical",
                  boxSizing: "border-box",
                }} />
              </label>

              {/* Feature toggles */}
              <div style={{
                display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px",
              }}>
                {[
                  { label: "Cache", state: enableCache, setter: setEnableCache, color: C.blue },
                  { label: "Retry", state: enableRetry, setter: setEnableRetry, color: C.amber },
                  { label: "Validação", state: enableValidation, setter: setEnableValidation, color: C.green },
                ].map(t => (
                  <button key={t.label} onClick={() => t.setter(!t.state)} style={{
                    padding: "6px 14px", borderRadius: "6px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 700,
                    border: `1px solid ${t.state ? t.color : C.border}`,
                    background: t.state ? `${t.color}15` : "transparent",
                    color: t.state ? t.color : C.textDim,
                  }}>
                    {t.state ? "✓" : "✗"} {t.label}
                  </button>
                ))}
              </div>

              {/* Error simulation */}
              <div style={{
                fontSize: "10px", color: C.textDim, marginBottom: "8px", fontWeight: 700,
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                Simular falhas
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "500 Error", state: simulateError, setter: setSimulateError },
                  { label: "429 Rate Limit", state: simulateRateLimit, setter: setSimulateRateLimit },
                  { label: "JSON Inválido", state: simulateInvalidJson, setter: setSimulateInvalidJson },
                ].map(t => (
                  <button key={t.label} onClick={() => {
                    // Only one error at a time
                    setSimulateError(false); setSimulateRateLimit(false); setSimulateInvalidJson(false);
                    t.setter(!t.state);
                  }} style={{
                    padding: "6px 14px", borderRadius: "6px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                    border: `1px solid ${t.state ? C.red : C.border}`,
                    background: t.state ? `${C.red}15` : "transparent",
                    color: t.state ? C.red : C.textDim,
                  }}>
                    {t.state ? "⚡" : "○"} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button onClick={runSimulation} style={{
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: `linear-gradient(135deg, #065f46, ${C.green})`,
              color: "#fff", fontSize: "13px", fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", marginBottom: "16px",
            }}>
              ▶ Executar Request
            </button>

            {/* Result */}
            {result && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {/* Timeline */}
                <div style={{
                  flex: 1.2, minWidth: "300px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "10px", padding: "16px",
                }}>
                  <div style={{
                    fontSize: "10px", color: C.textDim, marginBottom: "12px",
                    fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                  }}>
                    Request Lifecycle ({result.totalLatency}ms total)
                  </div>
                  <StepTimeline steps={result.steps} />
                </div>

                {/* Response */}
                <div style={{
                  flex: 1, minWidth: "260px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "10px", padding: "16px",
                }}>
                  <div style={{
                    fontSize: "10px", color: C.textDim, marginBottom: "8px",
                    fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                  }}>
                    Response
                  </div>
                  <pre style={{
                    margin: "0 0 12px", fontSize: "10px",
                    color: result.error ? C.red : C.green,
                    lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "inherit",
                    background: C.bg, padding: "12px", borderRadius: "8px",
                    maxHeight: "250px", overflowY: "auto",
                  }}>
                    {result.response}
                  </pre>

                  {result.log && (
                    <div style={{ fontSize: "10px", color: C.textDim, lineHeight: 1.8 }}>
                      <div>ID: <span style={{ color: C.textMuted }}>{result.log.id}</span></div>
                      <div>Model: <span style={{ color: MODELS[model].color }}>{result.log.model}</span></div>
                      <div>Tokens: <span style={{ color: C.cyan }}>{result.log.inputTokens} in + {result.log.outputTokens} out</span></div>
                      <div>Latência: <span style={{ color: result.log.latencyMs > 2000 ? C.amber : C.green }}>{result.log.latencyMs}ms</span></div>
                      <div>Custo: <span style={{ color: C.green }}>${result.log.cost.toFixed(6)}</span></div>
                      <div>Cache: <span style={{ color: result.log.fromCache ? C.blue : C.textDim }}>{result.log.fromCache ? "HIT" : "MISS"}</span></div>
                      <div>Retries: <span style={{ color: result.log.retryCount > 0 ? C.amber : C.textDim }}>{result.log.retryCount}</span></div>
                      <div>Output válido: <span style={{ color: result.log.validOutput ? C.green : C.red }}>{result.log.validOutput ? "SIM" : "NÃO"}</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            {!result && (
              <div style={{
                padding: "20px", borderRadius: "10px", background: C.surface,
                border: `1px solid ${C.border}`, fontSize: "12px", color: C.textMuted, lineHeight: 1.8,
              }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: "8px" }}>Experimentos sugeridos:</div>
                <div>1. Execute normalmente → observe o lifecycle completo</div>
                <div>2. Execute de novo com mesma mensagem → observe o cache HIT</div>
                <div>3. Ative "500 Error" com retry → observe backoff exponencial</div>
                <div>4. Ative "500 Error" sem retry → observe a falha sem recuperação</div>
                <div>5. Ative "429 Rate Limit" com retry → observe o retry com wait</div>
                <div>6. Ative "JSON Inválido" com validação → observe a limpeza de markdown</div>
                <div>7. Desative validação → observe que JSON com fences passa sem limpeza</div>
              </div>
            )}
          </div>
        )}

        {/* LOGS */}
        {activeTab === "logs" && (
          <div>
            {/* Stats */}
            <div style={{
              display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap",
            }}>
              {[
                { label: "Total", value: stats.total, color: C.text },
                { label: "Cache hits", value: stats.cached, color: C.blue },
                { label: "Erros", value: stats.errors, color: C.red },
                { label: "Custo total", value: `$${stats.totalCost.toFixed(4)}`, color: C.green },
                { label: "Latência média", value: `${stats.avgLatency}ms`, color: C.amber },
                { label: "Tokens total", value: stats.totalTokens, color: C.cyan },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, minWidth: "80px", padding: "10px 8px",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "9px", color: C.textDim }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Log entries */}
            {logStore.length === 0 ? (
              <div style={{
                padding: "40px", textAlign: "center", color: C.textDim, fontSize: "12px",
                background: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`,
              }}>
                Nenhum log ainda. Execute requests no simulador.
              </div>
            ) : (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", overflow: "hidden",
              }}>
                {logStore.map((log, i) => (
                  <div key={log.id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px", fontSize: "10px",
                    borderBottom: i < logStore.length - 1 ? `1px solid ${C.border}` : "none",
                    background: log.error ? `${C.red}06` : log.fromCache ? `${C.blue}06` : "transparent",
                  }}>
                    <span style={{ color: C.textDim, fontWeight: 700, width: "50px" }}>{log.id}</span>
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                      background: log.error ? C.red : log.fromCache ? C.blue : C.green,
                    }} />
                    <span style={{ color: C.textMuted, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.template}
                    </span>
                    <span style={{ color: C.textDim }}>{log.inputTokens + log.outputTokens}tok</span>
                    <span style={{ color: log.latencyMs > 2000 ? C.amber : C.textDim }}>{log.latencyMs}ms</span>
                    <span style={{ color: C.green, fontWeight: 700 }}>${log.cost.toFixed(5)}</span>
                    {log.fromCache && <span style={{ color: C.blue, fontSize: "8px", fontWeight: 800 }}>CACHE</span>}
                    {log.error && <span style={{ color: C.red, fontSize: "8px", fontWeight: 800 }}>ERRO</span>}
                    {log.retryCount > 0 && <span style={{ color: C.amber, fontSize: "8px" }}>R{log.retryCount}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARCHITECTURE */}
        {activeTab === "architecture" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "Estrutura no Costa Lima",
                color: C.cyan,
                content: `backend/src/services/ai/
├── client.ts        # HTTP wrapper com retry, timeout, streaming
├── templates.ts     # Prompts versionados com Zod schemas
├── cache.ts         # Cache em memória (ou Redis)
├── logger.ts        # Log de chamadas → tabela AICallLog
├── validator.ts     # Parse JSON + validação de schema
└── index.ts         # Funções: classifyLead(), generateQuote(), etc.

O AI Service segue o mesmo padrão do contaAzul/. 
Controller chama o service, service abstrai tudo.`
              },
              {
                title: "Fluxo completo de um request",
                color: C.green,
                content: `1. Controller recebe request do frontend
2. Chama aiService.classifyLead(mensagem)
3. Service resolve template + versão
4. Verifica cache (hit → retorna imediato)
5. Chama API do provedor (com retry + timeout)
6. Recebe resposta → limpa markdown fences
7. JSON.parse → valida schema com Zod
8. Se inválido → retry ou fallback
9. Armazena no cache
10. Loga metadados no AICallLog
11. Retorna resultado tipado ao controller

Cada etapa tem tratamento de erro. O sistema nunca crasha.`
              },
              {
                title: "Modelo Prisma — AICallLog",
                color: C.purple,
                content: `model AICallLog {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  model           String   // "claude-haiku-4-5"
  templateId      String   // "classify-lead"
  templateVersion String   // "v2.1.0"
  inputTokens     Int
  outputTokens    Int
  latencyMs       Int
  estimatedCostUsd Float
  fromCache       Boolean  @default(false)
  validOutput     Boolean
  endpoint        String   // "/api/leads/classify"
  userId          String?
  entityType      String?  // "Lead"
  entityId        String?
  error           String?
  retryCount      Int      @default(0)
}

Mesma lógica do ContaAzulSyncLog que você já tem.`
              },
              {
                title: "Variáveis de ambiente",
                color: C.amber,
                content: `# .env (adicionar ao já existente)
ANTHROPIC_API_KEY=sk-ant-...
AI_DEFAULT_MODEL=claude-haiku-4-5-20251001
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=3
AI_CACHE_TTL_MS=3600000
AI_LOG_PROMPTS=false  # true apenas em dev (LGPD)

No Railway/Render, configura via dashboard.
Mesmo padrão das variáveis CONTA_AZUL_*.`
              },
              {
                title: "Segurança e LGPD",
                color: C.red,
                content: `1. API key NUNCA no frontend — apenas no backend Express
2. Dados de clientes nos prompts → não logar em produção
3. AI_LOG_PROMPTS=false em prod (só metadados)
4. Se o provedor processa dados fora do Brasil → verificar DPA
5. Opção: usar Claude na AWS (São Paulo) para residência de dados
6. Mesma postura que você já tem com Conta Azul e S3

Em produção, o log guarda: quantos tokens, quanto custou, 
quanto demorou, se deu erro. NÃO guarda o que o cliente disse.`
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
