import { useState, useCallback } from "react";

// ============================================================
// KNOWLEDGE BASE - Simula documentos internos de uma empresa
// ============================================================
const KNOWLEDGE_BASE = [
  {
    id: 1,
    title: "Política de Reembolso",
    content: "O prazo para solicitar reembolso é de 30 dias após a compra. Para produtos com defeito, o prazo é estendido para 90 dias. É necessário apresentar nota fiscal e o produto deve estar na embalagem original. Reembolsos são processados em até 7 dias úteis na mesma forma de pagamento.",
    tags: ["reembolso", "devolução", "prazo", "defeito", "nota fiscal"],
  },
  {
    id: 2,
    title: "Planos e Preços",
    content: "Plano Starter: R$29/mês (1 usuário, 5GB). Plano Pro: R$79/mês (5 usuários, 50GB, suporte prioritário). Plano Enterprise: sob consulta (ilimitado, SLA 99.9%, gerente dedicado). Todos os planos incluem 14 dias de teste grátis. Desconto de 20% no pagamento anual.",
    tags: ["plano", "preço", "starter", "pro", "enterprise", "desconto"],
  },
  {
    id: 3,
    title: "Integrações Disponíveis",
    content: "Integramos com Slack, Jira, GitHub, GitLab, Notion, Google Workspace, Microsoft 365, Salesforce e Hubspot. A API REST está disponível para integrações customizadas. Webhooks são suportados em todos os planos. SDKs disponíveis em JavaScript, Python e Go.",
    tags: ["integração", "api", "slack", "jira", "github", "webhook", "sdk"],
  },
  {
    id: 4,
    title: "SLA e Disponibilidade",
    content: "Garantimos 99.9% de uptime para planos Enterprise e 99.5% para planos Pro. Manutenções programadas ocorrem nas madrugadas de domingo (UTC-3). Em caso de indisponibilidade, créditos são concedidos proporcionalmente. Status em tempo real: status.empresa.com.",
    tags: ["sla", "uptime", "disponibilidade", "manutenção", "status"],
  },
  {
    id: 5,
    title: "Segurança e Compliance",
    content: "Dados criptografados em trânsito (TLS 1.3) e em repouso (AES-256). Certificações SOC 2 Type II e ISO 27001. LGPD compliant com DPO dedicado. Backup diário com retenção de 30 dias. Autenticação por SSO (SAML 2.0) e MFA disponíveis.",
    tags: ["segurança", "criptografia", "lgpd", "soc2", "iso27001", "backup", "sso"],
  },
];

// ============================================================
// TOOLS - Ferramentas que o agente pode usar
// ============================================================
const AVAILABLE_TOOLS = [
  {
    name: "consultar_base",
    description: "Busca na base de conhecimento interna",
    icon: "📚",
  },
  {
    name: "consultar_status",
    description: "Verifica status do sistema em tempo real",
    icon: "🟢",
  },
  {
    name: "criar_ticket",
    description: "Cria ticket de suporte no sistema",
    icon: "🎫",
  },
  {
    name: "consultar_conta",
    description: "Busca dados da conta do cliente",
    icon: "👤",
  },
];

// ============================================================
// SIMULAÇÃO - Três abordagens diferentes
// ============================================================

function similarity(text, tags) {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let score = 0;
  tags.forEach(tag => {
    const t = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(t)) score += 2;
  });
  const words = lower.split(/\s+/);
  words.forEach(w => {
    tags.forEach(tag => {
      const t = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (w.includes(t.substring(0, 4)) && t.length > 3) score += 0.5;
    });
  });
  return score;
}

function simulateChatbotSimple(question) {
  const steps = [
    {
      type: "processing",
      label: "Recebendo pergunta",
      detail: `Input: "${question}"`,
    },
    {
      type: "thinking",
      label: "Gerando resposta com conhecimento interno",
      detail: "O modelo usa apenas o que aprendeu no pré-treino. Sem acesso a dados atualizados da empresa.",
    },
  ];

  const lower = question.toLowerCase();
  let response;

  if (lower.includes("reembolso") || lower.includes("devol")) {
    response = "Geralmente, políticas de reembolso variam entre 15 e 30 dias. Recomendo entrar em contato com o suporte para verificar os detalhes específicos da sua compra.";
  } else if (lower.includes("preço") || lower.includes("plano") || lower.includes("custo")) {
    response = "Normalmente oferecemos diferentes planos com preços variados. Para informações atualizadas sobre preços, sugiro visitar nosso site ou falar com a equipe comercial.";
  } else if (lower.includes("integr") || lower.includes("api") || lower.includes("slack") || lower.includes("jira")) {
    response = "Muitas plataformas SaaS oferecem integrações com ferramentas populares. Verifique nossa documentação para a lista completa de integrações disponíveis.";
  } else if (lower.includes("segur") || lower.includes("lgpd") || lower.includes("criptograf")) {
    response = "Segurança é uma prioridade. Geralmente utilizamos criptografia e seguimos as melhores práticas do mercado. Para detalhes específicos, consulte nossa política de segurança.";
  } else if (lower.includes("sla") || lower.includes("uptime") || lower.includes("dispon")) {
    response = "Nosso serviço busca manter alta disponibilidade. Para SLAs específicos, verifique os termos do seu plano contratado.";
  } else {
    response = "Posso ajudar com diversas questões. Para informações mais específicas, sugiro consultar nossa documentação ou entrar em contato com o suporte.";
  }

  steps.push({
    type: "response",
    label: "Resposta gerada",
    detail: response,
  });

  return {
    response,
    steps,
    issues: [
      "Resposta genérica — não tem dados específicos da empresa",
      "Não consegue citar valores, prazos ou políticas exatas",
      "Pode alucinar informações incorretas",
      "Redireciona para 'consulte o suporte' em vez de resolver",
    ],
  };
}

function simulateRAG(question) {
  const steps = [
    {
      type: "processing",
      label: "Recebendo pergunta",
      detail: `Input: "${question}"`,
    },
    {
      type: "search",
      label: "Busca semântica na base de conhecimento",
      detail: "Convertendo pergunta em embedding e buscando documentos similares...",
    },
  ];

  const scored = KNOWLEDGE_BASE.map(doc => ({
    ...doc,
    score: similarity(question, doc.tags),
  })).sort((a, b) => b.score - a.score);

  const relevant = scored.filter(d => d.score > 0).slice(0, 2);

  if (relevant.length > 0) {
    steps.push({
      type: "retrieval",
      label: `${relevant.length} documento(s) encontrado(s)`,
      detail: relevant.map(d => `📄 ${d.title} (score: ${d.score.toFixed(1)})`).join("\n"),
    });

    steps.push({
      type: "thinking",
      label: "Gerando resposta com contexto injetado",
      detail: "Prompt = pergunta + documentos relevantes → LLM gera resposta fundamentada.",
    });

    const context = relevant.map(d => d.content).join(" ");
    let response;

    const lower = question.toLowerCase();
    if (lower.includes("reembolso") || lower.includes("devol")) {
      response = `Conforme nossa política: o prazo para reembolso é de 30 dias após a compra (90 dias para produtos com defeito). Você precisa apresentar nota fiscal e o produto na embalagem original. O processamento leva até 7 dias úteis na mesma forma de pagamento.`;
    } else if (lower.includes("preço") || lower.includes("plano") || lower.includes("custo")) {
      response = `Temos três planos: Starter (R$29/mês, 1 usuário, 5GB), Pro (R$79/mês, 5 usuários, 50GB, suporte prioritário) e Enterprise (sob consulta, ilimitado, SLA 99.9%). Todos incluem 14 dias grátis e 20% de desconto no anual.`;
    } else if (lower.includes("integr") || lower.includes("api") || lower.includes("slack") || lower.includes("jira")) {
      response = `Integramos com Slack, Jira, GitHub, GitLab, Notion, Google Workspace, Microsoft 365, Salesforce e Hubspot. Temos API REST para integrações customizadas, webhooks em todos os planos, e SDKs em JavaScript, Python e Go.`;
    } else if (lower.includes("segur") || lower.includes("lgpd") || lower.includes("criptograf")) {
      response = `Nossos dados são criptografados com TLS 1.3 (trânsito) e AES-256 (repouso). Temos certificações SOC 2 Type II e ISO 27001, somos LGPD compliant com DPO dedicado. Backup diário com 30 dias de retenção. SSO e MFA disponíveis.`;
    } else if (lower.includes("sla") || lower.includes("uptime") || lower.includes("dispon")) {
      response = `O SLA é 99.9% para Enterprise e 99.5% para Pro. Manutenções programadas são nas madrugadas de domingo (UTC-3). Em caso de indisponibilidade, concedemos créditos proporcionais. Status em tempo real em status.empresa.com.`;
    } else {
      response = relevant.length > 0
        ? `Com base na nossa documentação sobre "${relevant[0].title}": ${relevant[0].content.substring(0, 150)}...`
        : "Não encontrei documentos específicos sobre isso na base. Posso ajudar de outra forma?";
    }

    steps.push({ type: "response", label: "Resposta gerada", detail: response });

    return {
      response,
      steps,
      issues: [
        "✅ Resposta específica com dados reais da empresa",
        "✅ Cita valores, prazos e políticas exatas",
        "⚠️ Limitado ao que está na base — não faz ações",
        "⚠️ Se a busca errar, a resposta erra junto",
      ],
    };
  } else {
    steps.push({
      type: "retrieval",
      label: "Nenhum documento relevante encontrado",
      detail: "Busca semântica não retornou resultados com score suficiente.",
    });
    steps.push({
      type: "response",
      label: "Resposta sem contexto",
      detail: "Não encontrei informações específicas sobre isso na nossa base de conhecimento. Posso criar um ticket para a equipe investigar?",
    });
    return {
      response: "Não encontrei informações específicas sobre isso na nossa base de conhecimento. Posso criar um ticket para a equipe investigar?",
      steps,
      issues: [
        "⚠️ Falha elegante — reconhece que não sabe",
        "⚠️ Sugere ação alternativa",
        "✅ Não alucina informações",
      ],
    };
  }
}

function simulateAgent(question) {
  const steps = [
    {
      type: "processing",
      label: "Recebendo pergunta",
      detail: `Input: "${question}"`,
    },
    {
      type: "planning",
      label: "Planejamento (ReAct loop)",
      detail: "Analisando intenção → decidindo quais ferramentas usar → definindo sequência de ações...",
    },
  ];

  const lower = question.toLowerCase();
  const toolsUsed = [];

  // Sempre consulta a base
  toolsUsed.push("consultar_base");
  steps.push({
    type: "tool",
    label: "🔧 Tool: consultar_base",
    detail: "Buscando documentos relevantes na base de conhecimento...",
  });

  const scored = KNOWLEDGE_BASE.map(doc => ({
    ...doc,
    score: similarity(question, doc.tags),
  })).sort((a, b) => b.score - a.score);
  const relevant = scored.filter(d => d.score > 0).slice(0, 2);

  if (relevant.length > 0) {
    steps.push({
      type: "retrieval",
      label: `Resultado: ${relevant.length} doc(s)`,
      detail: relevant.map(d => `📄 ${d.title}`).join(", "),
    });
  }

  // Consulta status se pergunta sobre disponibilidade
  if (lower.includes("status") || lower.includes("fora") || lower.includes("uptime") || lower.includes("funciona") || lower.includes("dispon")) {
    toolsUsed.push("consultar_status");
    steps.push({
      type: "tool",
      label: "🔧 Tool: consultar_status",
      detail: "Verificando status atual do sistema...",
    });
    steps.push({
      type: "retrieval",
      label: "Resultado: sistema operacional",
      detail: "✅ Todos os serviços online | Latência: 42ms | Uptime 30d: 99.97%",
    });
  }

  // Consulta conta se pergunta sobre conta/plano do cliente
  if (lower.includes("meu plano") || lower.includes("minha conta") || lower.includes("upgrade") || lower.includes("meu") || lower.includes("minha")) {
    toolsUsed.push("consultar_conta");
    steps.push({
      type: "tool",
      label: "🔧 Tool: consultar_conta",
      detail: "Buscando dados da conta do cliente...",
    });
    steps.push({
      type: "retrieval",
      label: "Resultado: dados da conta",
      detail: "Plano: Pro | Usuários: 3/5 | Storage: 28GB/50GB | Renovação: 15/04/2026",
    });
  }

  // Cria ticket se é reclamação
  if (lower.includes("problema") || lower.includes("erro") || lower.includes("bug") || lower.includes("reclamaç") || lower.includes("defeito")) {
    toolsUsed.push("criar_ticket");
    steps.push({
      type: "tool",
      label: "🔧 Tool: criar_ticket",
      detail: "Criando ticket de suporte automaticamente...",
    });
    steps.push({
      type: "retrieval",
      label: "Resultado: ticket criado",
      detail: "🎫 Ticket #4821 criado | Prioridade: Alta | SLA: 4h",
    });
  }

  steps.push({
    type: "thinking",
    label: "Sintetizando informações",
    detail: `Combinando resultados de ${toolsUsed.length} ferramenta(s): [${toolsUsed.join(", ")}]`,
  });

  let response;
  if (lower.includes("reembolso") || lower.includes("devol")) {
    response = `Conforme nossa política, o prazo é 30 dias (90 para defeito). Precisa de nota fiscal e embalagem original. Processamento em 7 dias úteis. ${lower.includes("problema") || lower.includes("defeito") ? "Já criei o ticket #4821 para acompanhamento — nossa equipe vai analisar em até 4 horas." : "Quer que eu inicie o processo de reembolso para você?"}`;
  } else if (lower.includes("preço") || lower.includes("plano") || lower.includes("custo")) {
    const hasAccount = lower.includes("meu") || lower.includes("minha") || lower.includes("upgrade");
    response = hasAccount
      ? `Você está no plano Pro (R$79/mês), usando 3 de 5 usuários e 28GB de 50GB. Para upgrade ao Enterprise (SLA 99.9%, usuários ilimitados), o valor é sob consulta. Quer que eu agende uma call com o comercial?`
      : `Temos Starter (R$29/mês), Pro (R$79/mês) e Enterprise (sob consulta). Todos com 14 dias grátis e 20% off no anual. Quer que eu compare com seu uso atual?`;
  } else if (lower.includes("integr") || lower.includes("api")) {
    response = `Integramos com Slack, Jira, GitHub, GitLab, Notion, Google/Microsoft, Salesforce e Hubspot. API REST + webhooks em todos os planos. SDKs em JS, Python e Go. Quer que eu gere uma API key de teste?`;
  } else if (lower.includes("segur") || lower.includes("lgpd")) {
    response = `Criptografia TLS 1.3 + AES-256, SOC 2 Type II, ISO 27001, LGPD compliant com DPO. Backup diário, SSO e MFA. Quer que eu exporte nosso relatório de compliance?`;
  } else if (lower.includes("status") || lower.includes("fora") || lower.includes("dispon")) {
    response = `Status atual: ✅ todos os serviços online, latência 42ms, uptime 99.97% nos últimos 30 dias. SLA do seu plano Pro: 99.5%. Nenhum incidente aberto. Quer receber alertas por Slack?`;
  } else if (lower.includes("problema") || lower.includes("erro") || lower.includes("bug")) {
    response = `Criei o ticket #4821 (prioridade alta, SLA 4h). Nossa equipe vai investigar. Enquanto isso, verifiquei: todos os serviços estão online. Pode descrever mais detalhes sobre o erro para eu atualizar o ticket?`;
  } else {
    response = `Com base nos nossos documentos e dados da sua conta, posso ajudar com: planos/preços, reembolso, integrações, segurança ou status. O que precisa?`;
  }

  steps.push({ type: "response", label: "Resposta final", detail: response });

  return {
    response,
    steps,
    issues: [
      "✅ Combina conhecimento + dados em tempo real + ações",
      "✅ Personaliza resposta com dados da conta do cliente",
      "✅ Toma ações proativas (criar ticket, sugerir próximos passos)",
      `✅ Usou ${toolsUsed.length} ferramenta(s): ${toolsUsed.join(", ")}`,
      "⚠️ Mais complexo — mais pontos de falha e mais custo",
      "⚠️ Precisa de guardrails para ações críticas",
    ],
  };
}

// ============================================================
// COLORS & STYLES
// ============================================================
const C = {
  bg: "#0b0e14",
  surface: "#12161f",
  surfaceAlt: "#181d2a",
  border: "#1c2333",
  borderHover: "#2a3550",
  text: "#dce4f0",
  textMuted: "#7b8ca5",
  textDim: "#4a5568",
  cyan: "#22d3ee",
  cyanDim: "#0e7490",
  purple: "#a78bfa",
  purpleDim: "#6d28d9",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
  blue: "#60a5fa",
};

const APPROACHES = [
  { id: "simple", label: "Chatbot Simples", icon: "💬", color: C.amber, desc: "LLM puro, sem contexto externo", fn: simulateChatbotSimple },
  { id: "rag", label: "Com RAG", icon: "📚", color: C.cyan, desc: "LLM + busca em base de conhecimento", fn: simulateRAG },
  { id: "agent", label: "Agente", icon: "🤖", color: C.purple, desc: "LLM + ferramentas + planejamento + ações", fn: simulateAgent },
];

const SAMPLE_QUESTIONS = [
  "Qual o prazo para pedir reembolso?",
  "Quanto custa o plano Pro?",
  "Meu plano permite integrar com Jira?",
  "O sistema está fora do ar?",
  "Estou tendo um problema com erro 500",
  "Quero fazer upgrade do meu plano",
  "Vocês são LGPD compliant?",
  "Quais integrações vocês suportam?",
];

// ============================================================
// COMPONENTS
// ============================================================

function StepLine({ step, isLast }) {
  const typeStyles = {
    processing: { color: C.textMuted, icon: "○" },
    search: { color: C.cyan, icon: "◎" },
    retrieval: { color: C.green, icon: "◉" },
    thinking: { color: C.amber, icon: "◈" },
    planning: { color: C.purple, icon: "◇" },
    tool: { color: C.blue, icon: "▸" },
    response: { color: C.text, icon: "●" },
  };
  const s = typeStyles[step.type] || typeStyles.processing;

  return (
    <div style={{ display: "flex", gap: "12px", position: "relative" }}>
      {!isLast && (
        <div style={{
          position: "absolute", left: "7px", top: "20px", bottom: "-8px",
          width: "1px", background: C.border,
        }} />
      )}
      <div style={{
        fontSize: "14px", lineHeight: "18px", color: s.color,
        flexShrink: 0, width: "16px", textAlign: "center",
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: s.color, marginBottom: "3px" }}>
          {step.label}
        </div>
        <div style={{
          fontSize: "11px", color: C.textMuted, lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}>
          {step.detail}
        </div>
      </div>
    </div>
  );
}

function ApproachPanel({ approach, result }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      flex: 1,
      minWidth: "260px",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <span style={{ fontSize: "18px" }}>{approach.icon}</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: approach.color }}>
            {approach.label}
          </div>
          <div style={{ fontSize: "10px", color: C.textDim }}>{approach.desc}</div>
        </div>
      </div>

      {/* Steps */}
      {result && (
        <div style={{ padding: "16px" }}>
          {result.steps.map((step, i) => (
            <StepLine key={i} step={step} isLast={i === result.steps.length - 1} />
          ))}

          {/* Response highlight */}
          <div style={{
            margin: "16px 0 0",
            padding: "12px 14px",
            borderRadius: "8px",
            background: `${approach.color}08`,
            border: `1px solid ${approach.color}18`,
            fontSize: "12px",
            lineHeight: 1.7,
            color: C.text,
          }}>
            {result.response}
          </div>

          {/* Issues */}
          <div style={{ marginTop: "12px" }}>
            {result.issues.map((issue, i) => (
              <div key={i} style={{
                fontSize: "10px",
                color: issue.startsWith("✅") ? C.green : issue.startsWith("⚠️") ? C.amber : C.textDim,
                lineHeight: 1.8,
              }}>
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && (
        <div style={{
          padding: "40px 16px",
          textAlign: "center",
          color: C.textDim,
          fontSize: "12px",
        }}>
          Faça uma pergunta para ver o fluxo
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function LLMComparisonLab() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState({});
  const [activeView, setActiveView] = useState("compare");

  const runComparison = useCallback((text) => {
    if (!text.trim()) return;
    const r = {};
    APPROACHES.forEach(a => {
      r[a.id] = a.fn(text);
    });
    setResults(r);
    setInput(text);
  }, []);

  const handleSubmit = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      runComparison(input);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: C.cyan,
            padding: "4px 10px", borderRadius: "4px",
            background: `${C.cyan}12`, border: `1px solid ${C.cyanDim}44`,
          }}>
            Cap 1 · Módulo 2
          </span>
          <h1 style={{
            fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.2,
            background: `linear-gradient(135deg, ${C.text}, ${C.cyan})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Chatbot Simples vs RAG vs Agente
          </h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
            Mesma pergunta, três arquiteturas — veja como contexto e ferramentas mudam tudo
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "compare", label: "Comparativo" },
            { id: "knowledge", label: "Base de Conhecimento" },
            { id: "tools", label: "Ferramentas do Agente" },
            { id: "learn", label: "Lições" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: "8px",
              fontSize: "11px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
              background: activeView === tab.id ? C.surfaceAlt : "transparent",
              color: activeView === tab.id ? C.text : C.textDim,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* COMPARE VIEW */}
        {activeView === "compare" && (
          <>
            {/* Input */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleSubmit}
                placeholder="Faça uma pergunta como cliente..."
                style={{
                  flex: 1, padding: "14px 18px", borderRadius: "10px",
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: "13px", fontFamily: "inherit", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = C.cyan}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={handleSubmit} style={{
                padding: "14px 20px", borderRadius: "10px", border: "none",
                background: `linear-gradient(135deg, ${C.cyanDim}, ${C.cyan})`,
                color: "#fff", fontSize: "12px", fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
              }}>
                COMPARAR
              </button>
            </div>

            {/* Sample questions */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px",
            }}>
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => { setInput(q); runComparison(q); }} style={{
                  padding: "6px 12px", borderRadius: "20px", border: `1px solid ${C.border}`,
                  background: "transparent", color: C.textMuted, fontSize: "10px",
                  fontFamily: "inherit", cursor: "pointer", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Three panels */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {APPROACHES.map(a => (
                <ApproachPanel key={a.id} approach={a} result={results[a.id]} />
              ))}
            </div>
          </>
        )}

        {/* KNOWLEDGE BASE VIEW */}
        {activeView === "knowledge" && (
          <div>
            <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Esta é a base de conhecimento da empresa fictícia. O <strong style={{ color: C.cyan }}>RAG</strong> e o{" "}
              <strong style={{ color: C.purple }}>Agente</strong> buscam aqui. O <strong style={{ color: C.amber }}>Chatbot Simples</strong> não tem acesso.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {KNOWLEDGE_BASE.map(doc => (
                <div key={doc.id} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "10px", padding: "18px",
                }}>
                  <div style={{
                    fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "8px",
                  }}>
                    📄 {doc.title}
                  </div>
                  <p style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 10px" }}>
                    {doc.content}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {doc.tags.map(tag => (
                      <span key={tag} style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
                        background: `${C.cyan}12`, color: C.cyan, border: `1px solid ${C.cyan}22`,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOLS VIEW */}
        {activeView === "tools" && (
          <div>
            <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Ferramentas disponíveis para o <strong style={{ color: C.purple }}>Agente</strong>. 
              Ele decide quais usar com base na pergunta (loop ReAct: Raciocinar → Agir → Observar).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {AVAILABLE_TOOLS.map(tool => (
                <div key={tool.name} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: "10px", padding: "18px",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <span style={{ fontSize: "28px" }}>{tool.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.purple }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: "12px", color: C.textMuted }}>{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: "20px", padding: "18px", borderRadius: "10px",
              background: C.surface, border: `1px solid ${C.border}`,
              fontSize: "12px", color: C.textMuted, lineHeight: 1.7,
            }}>
              <strong style={{ color: C.amber }}>Diferença chave:</strong> o Chatbot e o RAG apenas respondem.
              O Agente pode <em>agir</em> — criar tickets, consultar sistemas em tempo real, acionar workflows.
              Mais poder = mais responsabilidade = mais necessidade de guardrails.
            </div>
          </div>
        )}

        {/* LESSONS VIEW */}
        {activeView === "learn" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "Chatbot Simples (LLM puro)",
                color: C.amber,
                points: [
                  "Usa apenas o conhecimento do pré-treino — estático e genérico",
                  "Não tem acesso a dados da empresa, do cliente ou em tempo real",
                  "Tende a respostas vagas: 'consulte o suporte', 'verifique o site'",
                  "Risco alto de alucinação: pode inventar prazos, preços e políticas",
                  "Custo mais baixo — uma chamada de API por pergunta",
                  "Útil para: conversa casual, brainstorming, tarefas genéricas",
                ],
              },
              {
                title: "RAG (Retrieval-Augmented Generation)",
                color: C.cyan,
                points: [
                  "Busca documentos relevantes → injeta no contexto → LLM responde com base neles",
                  "Respostas específicas e fundamentadas em dados reais",
                  "Reduz alucinação porque o modelo tem evidência no prompt",
                  "Limitado a responder — não executa ações",
                  "Qualidade depende da busca: se o retrieval erra, tudo erra",
                  "Custo médio — busca vetorial + chamada de API com contexto maior",
                  "Útil para: FAQ, documentação, suporte informativo",
                ],
              },
              {
                title: "Agente (LLM + Tools + Planning)",
                color: C.purple,
                points: [
                  "Planeja, usa ferramentas, observa resultados, decide próximos passos",
                  "Pode consultar APIs, bancos de dados, criar tickets, enviar emails",
                  "Personaliza com dados do cliente em tempo real",
                  "Mais complexo = mais pontos de falha, mais caro, mais lento",
                  "Precisa de guardrails: limites de ação, aprovação humana, logs",
                  "Custo mais alto — múltiplas chamadas de API + ferramentas",
                  "Útil para: suporte completo, automação, workflows complexos",
                ],
              },
            ].map(section => (
              <div key={section.title} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "20px", marginBottom: "12px",
              }}>
                <h3 style={{
                  fontSize: "14px", fontWeight: 700, color: section.color,
                  margin: "0 0 12px",
                }}>
                  {section.title}
                </h3>
                {section.points.map((p, i) => (
                  <div key={i} style={{ marginBottom: "4px" }}>
                    <span style={{ color: C.textDim, marginRight: "8px" }}>→</span>{p}
                  </div>
                ))}
              </div>
            ))}

            <div style={{
              background: `${C.green}08`, border: `1px solid ${C.green}22`,
              borderRadius: "10px", padding: "20px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 10px" }}>
                A Regra de Ouro
              </h3>
              <p style={{ margin: 0, color: C.text }}>
                Comece com o mais simples que resolve. Chatbot → RAG → Agente.
                Cada camada adiciona poder <em>e</em> complexidade. Só escale quando
                o nível anterior comprovadamente não atende.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
