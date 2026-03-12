import { useState, useRef, useCallback, useEffect } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316", pink: "#ec4899",
};

// ============================================================
// SAMPLE LEADS - realistic WhatsApp messages
// ============================================================
var SAMPLE_LEADS = [
  {
    id: 1,
    nome: "Carlos Mendes",
    msg: "Boa tarde! Tenho um terreno de 15x30 em Volta Redonda e gostaria de fazer uma piscina de 8x4 com prainha e aquecimento solar. Qual o valor aproximado e prazo?",
    hasPhoto: true,
    photoType: "terreno",
    origem: "WHATSAPP",
  },
  {
    id: 2,
    nome: "Ana Paula Costa",
    msg: "Oi, minha piscina ta com a agua toda verde faz quase uma semana. Ja coloquei cloro e nao resolveu. O rejunte da borda tambem ta saindo. Podem vir ver?",
    hasPhoto: true,
    photoType: "problema",
    origem: "WHATSAPP",
  },
  {
    id: 3,
    nome: "Roberto Almeida",
    msg: "Estou comparando orcamentos para reforma da minha piscina. Preciso trocar o vinil (ta todo desbotado), colocar iluminacao LED e talvez trocar a bomba. A piscina tem 6x3.",
    hasPhoto: false,
    photoType: null,
    origem: "SITE",
  },
  {
    id: 4,
    nome: "Juliana Ferreira",
    msg: "URGENTE - a bomba da piscina do condominio parou de funcionar e esta vazando agua. Somos 40 apartamentos e precisamos resolver hoje. Podem mandar alguem?",
    hasPhoto: true,
    photoType: "emergencia",
    origem: "TELEFONE",
  },
  {
    id: 5,
    nome: "Marcos Oliveira",
    msg: "Oi, meu vizinho fez a piscina com voces e ficou show. Quero fazer uma tambem mas nao sei qual tamanho cabe no meu quintal. Podem fazer uma visita pra avaliar?",
    hasPhoto: true,
    photoType: "quintal",
    origem: "INDICACAO",
  },
];

// ============================================================
// DRAW PHOTOS
// ============================================================
function drawPhoto(canvas, type) {
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (type === "terreno") {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, w, h * 0.35);
    ctx.fillStyle = "#7A9A5A";
    ctx.fillRect(0, h * 0.35, w, h * 0.65);
    ctx.fillStyle = "#5A7A3A";
    ctx.fillRect(w * 0.1, h * 0.4, w * 0.8, h * 0.5);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(w * 0.25, h * 0.5, w * 0.5, h * 0.3);
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText("15 x 30m", w * 0.4, h * 0.47);
    ctx.fillText("area piscina", w * 0.35, h * 0.67);
  } else if (type === "problema") {
    ctx.fillStyle = "#d4a574";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8B8682";
    var px = w * 0.1, py = h * 0.15, pw = w * 0.8, ph = h * 0.7;
    ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
    ctx.fillStyle = "#3A6A2A";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "rgba(30,80,10,0.5)";
    for (var i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(px + 15 + i * pw / 6, py + ph * 0.4 + (i % 2) * 20, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#5A3A2A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py + 6);
    ctx.lineTo(px + pw, py + 6);
    ctx.stroke();
  } else if (type === "emergencia") {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#555";
    ctx.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.5);
    ctx.fillStyle = "#4A7AB5";
    ctx.fillRect(w * 0.22, h * 0.32, w * 0.56, h * 0.46);
    ctx.fillStyle = "rgba(100,50,20,0.6)";
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.85, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.red;
    ctx.font = "bold 14px monospace";
    ctx.fillText("VAZAMENTO", w * 0.28, h * 0.25);
  } else if (type === "quintal") {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = "#6B8E4A";
    ctx.fillRect(0, h * 0.3, w, h * 0.7);
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(0, h * 0.3, w, h * 0.15);
    ctx.fillStyle = "#5A7A3A";
    ctx.beginPath();
    ctx.arc(w * 0.15, h * 0.35, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.4, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#D4A574";
    ctx.fillRect(w * 0.6, h * 0.3, w * 0.15, h * 0.35);
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.fillText("quintal ~12x8m", w * 0.3, h * 0.95);
  }

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(2, h - 18, 80, 16);
  ctx.fillStyle = "#fff";
  ctx.font = "9px monospace";
  ctx.fillText("WhatsApp", 6, h - 6);
}

// ============================================================
// PIPELINE SIMULATION
// ============================================================

function runPipeline(lead) {
  var steps = [];
  var results = {};
  var totalCost = 0;
  var totalTokens = 0;
  var totalLatency = 0;

  // STEP 1: Classify intent
  var lower = lead.msg.toLowerCase();
  var isConstruction = lower.includes("piscina") && (lower.includes("fazer") || lower.includes("construir") || lower.includes("quero") || lower.includes("terreno"));
  var isMaint = lower.includes("bomba") || lower.includes("verde") || lower.includes("limpe") || lower.includes("parou") || lower.includes("vazando");
  var isReform = lower.includes("reform") || lower.includes("troc") || lower.includes("vinil") || lower.includes("desbotad");
  var isUrgent = lower.includes("urgente") || lower.includes("hoje") || lower.includes("parou") || lower.includes("vazando");

  var intencao = isMaint ? "MANUTENCAO" : isReform ? "REFORMA" : isConstruction ? "CONSTRUCAO" : "ORCAMENTO";
  var confianca = isMaint ? 92 : isReform ? 88 : isConstruction ? 95 : 70;

  steps.push({
    name: "Classificar Intencao",
    model: "Claude Haiku 4.5",
    technique: "Few-shot + JSON schema",
    modulo: "M1+M2",
    tokens: 380,
    latency: 350,
    cost: 0.0003,
    status: "ok",
    output: {
      intencao: intencao,
      confianca: confianca,
      urgencia: isUrgent ? "alta" : "media",
      servicos: intencao === "CONSTRUCAO" ? ["piscina_nova", "prainha", "aquecimento"] :
        intencao === "MANUTENCAO" ? ["reparo_bomba", "tratamento_agua"] :
        intencao === "REFORMA" ? ["troca_vinil", "iluminacao", "troca_bomba"] : ["orcamento"],
    },
  });
  totalCost += 0.0003;
  totalTokens += 380;
  totalLatency += 350;

  results.classificacao = steps[0].output;

  // STEP 2: Analyze photo (if present)
  if (lead.hasPhoto) {
    var photoAnalysis = {};
    if (lead.photoType === "terreno") {
      photoAnalysis = {
        descricao: "Terreno plano com grama, area demarcada para piscina visivel",
        dimensoes_estimadas: "Area disponivel ~8x5m dentro de terreno 15x30m",
        observacoes: "Solo aparentemente firme, sem inclinacao visivel, bom acesso",
        viabilidade: "alta",
      };
    } else if (lead.photoType === "problema") {
      photoAnalysis = {
        descricao: "Piscina com agua esverdeada, presenca de algas",
        problemas_visiveis: ["Agua verde (algas)", "Rejunte deteriorado na borda", "Possivel nivel baixo"],
        severidade: "alta",
        acao_imediata: "Tratamento de choque + avaliacao do rejunte",
      };
    } else if (lead.photoType === "emergencia") {
      photoAnalysis = {
        descricao: "Bomba de piscina com vazamento visivel na base",
        problemas_visiveis: ["Vazamento ativo na bomba", "Poca de agua no chao"],
        severidade: "critica",
        acao_imediata: "Desligar bomba imediatamente, enviar tecnico emergencial",
      };
    } else {
      photoAnalysis = {
        descricao: "Quintal residencial com espaco para piscina",
        dimensoes_estimadas: "Area util ~10x6m",
        observacoes: "Arvores nos cantos, muro ao fundo, acesso lateral",
        viabilidade: "alta",
      };
    }

    steps.push({
      name: "Analisar Foto",
      model: "Claude Sonnet 4.6",
      technique: "Vision + prompt estruturado",
      modulo: "M4",
      tokens: 1800,
      latency: 900,
      cost: 0.005,
      status: "ok",
      output: photoAnalysis,
    });
    totalCost += 0.005;
    totalTokens += 1800;
    totalLatency += 900;
    results.foto = photoAnalysis;
  }

  // STEP 3: Enrich lead profile
  var valor_estimado = intencao === "CONSTRUCAO" ? "R$ 70.000 - 100.000" :
    intencao === "REFORMA" ? "R$ 15.000 - 35.000" :
    intencao === "MANUTENCAO" ? "R$ 500 - 3.000" : "A definir";

  var perfil = {
    intencao: intencao,
    score_qualificacao: lead.origem === "INDICACAO" ? 92 : lead.origem === "WHATSAPP" ? 78 : 65,
    valor_estimado: valor_estimado,
    perfil_cliente: isUrgent ? "Urgente - precisa de solucao imediata" :
      lead.origem === "INDICACAO" ? "Indicacao - alta probabilidade de conversao" :
      "Pesquisa inicial - nutrir com informacao",
    temperatura: lead.origem === "INDICACAO" ? "quente" : isUrgent ? "quente" : isConstruction ? "morno" : "morno",
    proximo_passo: isUrgent ? "Ligar imediatamente" :
      intencao === "CONSTRUCAO" ? "Agendar visita tecnica" :
      intencao === "REFORMA" ? "Enviar portfolio + agendar avaliacao" :
      "Agendar diagnostico",
  };

  steps.push({
    name: "Enriquecer Perfil",
    model: "Claude Haiku 4.5",
    technique: "Chain-of-thought + dados combinados",
    modulo: "M2",
    tokens: 600,
    latency: 400,
    cost: 0.0005,
    status: "ok",
    output: perfil,
  });
  totalCost += 0.0005;
  totalTokens += 600;
  totalLatency += 400;
  results.perfil = perfil;

  // STEP 4: Generate WhatsApp response
  var resposta = "";
  if (intencao === "CONSTRUCAO") {
    resposta = "Ola " + lead.nome.split(" ")[0] + "! Tudo bem?\n\nQue otimo que esta planejando sua piscina! Uma piscina 8x4 com prainha e aquecimento solar e um projeto muito procurado. O investimento fica na faixa de R$70-100 mil dependendo do acabamento, e o prazo medio e de 45-60 dias.\n\nPosso agendar uma visita tecnica gratuita no seu terreno para fazer o dimensionamento certinho e apresentar as opcoes? Qual o melhor dia pra voce?";
  } else if (intencao === "MANUTENCAO" && isUrgent) {
    resposta = "Ola " + lead.nome.split(" ")[0] + "!\n\nEntendo a urgencia! Ja vou acionar nossa equipe tecnica para atendimento emergencial. Um tecnico pode estar ai ainda hoje.\n\nEnquanto isso, se possivel, desligue a bomba pelo disjuntor para evitar danos maiores.\n\nVou confirmar o horario em instantes. Qual o endereco completo?";
  } else if (intencao === "MANUTENCAO") {
    resposta = "Ola " + lead.nome.split(" ")[0] + "!\n\nPela descricao e pela foto, parece que a piscina precisa de um tratamento de choque (a agua verde indica proliferacao de algas) e o rejunte precisa ser refeito. Sao servicos que fazemos frequentemente.\n\nConsigo agendar uma visita tecnica essa semana para avaliar pessoalmente e passar o orcamento certinho. Prefere manha ou tarde?";
  } else if (intencao === "REFORMA") {
    resposta = "Ola " + lead.nome.split(" ")[0] + "! Tudo bem?\n\nReforma de piscina e nossa especialidade! Para uma 6x3, a troca de vinil + iluminacao LED + bomba nova fica em torno de R$15-25 mil dependendo dos materiais.\n\nPosso agendar uma visita para avaliar o estado atual e montar um orcamento detalhado? Temos um portfolio com varios projetos de reforma pra voce ver as opcoes. Qual o melhor dia?";
  } else {
    resposta = "Ola " + lead.nome.split(" ")[0] + "!\n\nObrigado pelo contato! Vou preparar uma proposta personalizada pra voce.\n\nPra eu dimensionar certinho, pode me passar mais detalhes sobre o que precisa? Qual o tamanho aproximado da area e o que imagina pro projeto?\n\nSe preferir, posso agendar uma visita tecnica gratuita pra avaliar.";
  }

  steps.push({
    name: "Gerar Resposta WhatsApp",
    model: "Claude Haiku 4.5",
    technique: "Few-shot + tom calibrado",
    modulo: "M2",
    tokens: 450,
    latency: 380,
    cost: 0.0004,
    status: "ok",
    output: { resposta: resposta, tom: "profissional e amigavel", palavras: resposta.split(" ").length },
  });
  totalCost += 0.0004;
  totalTokens += 450;
  totalLatency += 380;
  results.resposta = resposta;

  // STEP 5: Create actions
  var acoes = [];
  if (isUrgent) {
    acoes.push({ mod: "OS", desc: "Criar OS emergencial - prioridade P0", auto: true });
    acoes.push({ mod: "AGENDA", desc: "Agendar tecnico para hoje", auto: true });
  }
  acoes.push({ mod: "LEAD", desc: "Criar lead: " + lead.nome + " - " + intencao, auto: true });
  acoes.push({ mod: "HISTORICO", desc: "Registrar interacao + classificacao AI", auto: true });
  if (intencao === "CONSTRUCAO" || intencao === "REFORMA") {
    acoes.push({ mod: "AGENDA", desc: "Sugerir agendamento de visita tecnica", auto: false });
    acoes.push({ mod: "ORC", desc: "Preparar pre-orcamento com itens do catalogo", auto: false });
  }
  acoes.push({ mod: "ZAP", desc: "Enviar resposta via Z-API (aguardando aprovacao)", auto: false });

  steps.push({
    name: "Definir Acoes no Sistema",
    model: "Regras de negocio",
    technique: "Logica deterministica",
    modulo: "M1",
    tokens: 0,
    latency: 5,
    cost: 0,
    status: "ok",
    output: { acoes: acoes },
  });
  totalLatency += 5;
  results.acoes = acoes;

  return {
    steps: steps,
    results: results,
    totals: { cost: totalCost, tokens: totalTokens, latency: totalLatency, apiCalls: steps.filter(function(s) { return s.tokens > 0; }).length },
  };
}

// ============================================================
// COMPONENTS
// ============================================================

var modColors = {
  "M1+M2": C.amber, "M4": C.orange, "M2": C.purple, "M1": C.cyan, "M3": C.green,
};

var acaoColors = {
  OS: C.red, AGENDA: C.blue, LEAD: C.green, HISTORICO: C.textDim,
  ORC: C.amber, ZAP: C.green,
};

function StepCard(props) {
  var step = props.step;
  var index = props.index;
  var expanded = props.expanded;
  var onToggle = props.onToggle;
  var mc = modColors[step.modulo] || C.textMuted;

  return (
    <div style={{
      background: C.surface, border: "1px solid " + C.border,
      borderRadius: "10px", overflow: "hidden", marginBottom: "8px",
    }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 14px", cursor: "pointer",
      }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: C.green + "15", border: "1px solid " + C.green + "33",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 800, color: C.green, flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{step.name}</div>
          <div style={{ fontSize: "10px", color: C.textDim }}>
            {step.model} | {step.technique}
          </div>
        </div>
        <span style={{
          fontSize: "8px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
          background: mc + "15", color: mc,
        }}>
          {step.modulo}
        </span>
        <div style={{ textAlign: "right", fontSize: "10px", color: C.textDim, flexShrink: 0 }}>
          {step.tokens > 0 && <div>{step.tokens} tok</div>}
          <div>{step.latency}ms</div>
        </div>
        <span style={{ color: C.textDim, fontSize: "12px", transform: expanded ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>
          {"▾"}
        </span>
      </div>
      {expanded && (
        <div style={{
          padding: "12px 14px", borderTop: "1px solid " + C.border,
          background: C.surfaceAlt,
        }}>
          <pre style={{
            margin: 0, fontSize: "10px", color: C.cyan, lineHeight: 1.6,
            whiteSpace: "pre-wrap", fontFamily: "inherit",
            background: C.bg, padding: "12px", borderRadius: "8px",
          }}>
            {JSON.stringify(step.output, null, 2)}
          </pre>
          {step.cost > 0 && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: C.textDim }}>
              {"Custo: $" + step.cost.toFixed(6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function LeadIntakePipeline() {
  var [selectedLead, setSelectedLead] = useState(null);
  var [pipeline, setPipeline] = useState(null);
  var [expandedStep, setExpandedStep] = useState(null);
  var [activeTab, setActiveTab] = useState("pipeline");
  var [processing, setProcessing] = useState(false);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var photoRef = useRef(null);

  useEffect(function() {
    if (selectedLead && selectedLead.hasPhoto) {
      setTimeout(function() {
        drawPhoto(photoRef.current, selectedLead.photoType);
      }, 50);
    }
  }, [selectedLead]);

  var runPipelineForLead = useCallback(function(lead) {
    setSelectedLead(lead);
    setPipeline(null);
    setProcessing(true);
    setVisibleSteps(0);
    setExpandedStep(null);

    var result = runPipeline(lead);
    setPipeline(result);

    // Animate steps appearing
    result.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
      }, (i + 1) * 500);
    });

    setTimeout(function() {
      setProcessing(false);
    }, result.steps.length * 500 + 200);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.blue, padding: "4px 10px", borderRadius: "4px",
            background: C.blue + "12", border: "1px solid " + C.blue + "33",
          }}>Projeto Integrador - Cap 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Pipeline Inteligente de Atendimento
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Lead chega (texto + foto) {">"} classifica {">"} analisa {">"} enriquece {">"} responde {">"} aciona sistema
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "pipeline", label: "Pipeline" },
            { id: "arch", label: "Arquitetura" },
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

        {activeTab === "pipeline" && (
          <div>
            {/* Lead selector */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px", letterSpacing: "0.5px" }}>
              SELECIONE UM LEAD (mensagens reais do WhatsApp)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              {SAMPLE_LEADS.map(function(lead) {
                var isSelected = selectedLead && selectedLead.id === lead.id;
                return (
                  <button key={lead.id} onClick={function() { runPipelineForLead(lead); }} style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    border: "1px solid " + (isSelected ? C.blue : C.border),
                    background: isSelected ? C.blue + "10" : C.surface,
                    color: C.text, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{lead.nome}</span>
                      <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: C.surfaceAlt, color: C.textDim }}>{lead.origem}</span>
                      {lead.hasPhoto && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: C.orange + "15", color: C.orange }}>COM FOTO</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.4 }}>
                      {lead.msg.length > 120 ? lead.msg.substring(0, 120) + "..." : lead.msg}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pipeline result */}
            {pipeline && (
              <div>
                {/* Input display */}
                <div style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "14px", marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>INPUT DO PIPELINE</div>
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{
                        padding: "12px", borderRadius: "8px", background: "#1a3a1a",
                        border: "1px solid #2a5a2a", fontSize: "11px", color: "#90EE90",
                        lineHeight: 1.6,
                      }}>
                        <div style={{ fontSize: "9px", color: "#5a8a5a", marginBottom: "4px" }}>{selectedLead.nome} - WhatsApp</div>
                        {selectedLead.msg}
                      </div>
                    </div>
                    {selectedLead.hasPhoto && (
                      <div style={{ flexShrink: 0 }}>
                        <canvas ref={photoRef} width={160} height={120} style={{
                          borderRadius: "8px", border: "2px solid " + C.border, display: "block",
                        }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals bar */}
                <div style={{
                  display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap",
                }}>
                  {[
                    { label: "Chamadas API", value: pipeline.totals.apiCalls, color: C.purple },
                    { label: "Tokens total", value: pipeline.totals.tokens, color: C.cyan },
                    { label: "Latencia total", value: pipeline.totals.latency + "ms", color: C.amber },
                    { label: "Custo total", value: "$" + pipeline.totals.cost.toFixed(4), color: C.green },
                  ].map(function(s) {
                    return (
                      <div key={s.label} style={{
                        flex: 1, minWidth: "90px", padding: "10px 8px",
                        background: C.surface, border: "1px solid " + C.border,
                        borderRadius: "8px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: "9px", color: C.textDim }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Steps */}
                <div>
                  {pipeline.steps.map(function(step, i) {
                    if (i >= visibleSteps) return null;
                    return (
                      <StepCard
                        key={i}
                        step={step}
                        index={i}
                        expanded={expandedStep === i}
                        onToggle={function() { setExpandedStep(expandedStep === i ? null : i); }}
                      />
                    );
                  })}
                  {processing && (
                    <div style={{ textAlign: "center", padding: "16px", color: C.textDim, fontSize: "12px" }}>
                      Processando etapa {visibleSteps + 1}...
                    </div>
                  )}
                </div>

                {/* WhatsApp response preview */}
                {!processing && pipeline.results.resposta && (
                  <div style={{
                    background: C.surface, border: "1px solid " + C.green + "33",
                    borderRadius: "10px", padding: "16px", marginTop: "16px",
                  }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                      RESPOSTA GERADA (aguardando aprovacao do vendedor)
                    </div>
                    <div style={{
                      padding: "14px", borderRadius: "8px", background: "#1a3a1a",
                      border: "1px solid #2a5a2a", fontSize: "12px", color: "#90EE90",
                      lineHeight: 1.7, whiteSpace: "pre-wrap",
                    }}>
                      {pipeline.results.resposta}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button style={{
                        padding: "8px 20px", borderRadius: "8px", border: "none",
                        background: C.green, color: "#fff", fontSize: "11px", fontWeight: 700,
                        fontFamily: "inherit", cursor: "pointer",
                      }}>Aprovar e Enviar</button>
                      <button style={{
                        padding: "8px 20px", borderRadius: "8px",
                        border: "1px solid " + C.border, background: "transparent",
                        color: C.textMuted, fontSize: "11px", fontFamily: "inherit", cursor: "pointer",
                      }}>Editar</button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!processing && pipeline.results.acoes && (
                  <div style={{
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "10px", padding: "16px", marginTop: "12px",
                  }}>
                    <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>
                      ACOES NO COSTA LIMA
                    </div>
                    {pipeline.results.acoes.map(function(a, i) {
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "6px 10px", borderRadius: "6px", marginBottom: "4px",
                          background: C.surfaceAlt, fontSize: "10px",
                        }}>
                          <span style={{
                            padding: "2px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: 800,
                            background: (acaoColors[a.mod] || C.textDim) + "15",
                            color: acaoColors[a.mod] || C.textDim,
                          }}>{a.mod}</span>
                          <span style={{ color: C.textMuted, flex: 1 }}>{a.desc}</span>
                          <span style={{
                            fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                            background: a.auto ? C.green + "15" : C.amber + "15",
                            color: a.auto ? C.green : C.amber,
                          }}>
                            {a.auto ? "AUTO" : "MANUAL"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedLead && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.textDim, fontSize: "13px" }}>
                Selecione um lead acima para executar o pipeline completo
              </div>
            )}
          </div>
        )}

        {activeTab === "arch" && (
          <div>
            {[
              {
                title: "O que este projeto demonstra",
                color: C.blue,
                text: "Combinacao dos 4 modulos do Cap 2 num fluxo real: M1 (escolha de modelo por etapa - Haiku para classificacao, Sonnet para vision), M2 (few-shot, chain-of-thought, templates), M3 (pipeline multi-etapa com custos e latencia rastreados), M4 (analise de foto do WhatsApp). O resultado: um lead que levaria 15min de trabalho manual do vendedor e processado em ~2 segundos por ~$0.006.",
              },
              {
                title: "Arquitetura do pipeline",
                color: C.cyan,
                text: "Etapa 1: Classificar intencao (Haiku, few-shot, 350ms, $0.0003). Etapa 2: Analisar foto se houver (Sonnet Vision, 900ms, $0.005). Etapa 3: Enriquecer perfil combinando texto+foto (Haiku, CoT, 400ms, $0.0005). Etapa 4: Gerar resposta WhatsApp (Haiku, few-shot, 380ms, $0.0004). Etapa 5: Definir acoes no sistema (regras, 5ms, $0). Total: 3-4 chamadas API, ~2000ms, ~$0.006 por lead.",
              },
              {
                title: "Integracao no Costa Lima",
                color: C.green,
                text: "O pipeline se integra com: Z-API (recebe mensagem + foto do WhatsApp), S3 (armazena foto), Lead (cria registro no banco), LeadHistorico (registra interacao + classificacao AI), Tarefa (cria OS se urgente), AgendaProgramacao (sugere visita tecnica), Orcamento (pre-orcamento com itens do catalogo). O vendedor ve tudo pronto no admin e so precisa aprovar a resposta.",
              },
              {
                title: "Model routing inteligente",
                color: C.amber,
                text: "Cada etapa usa o modelo otimo: Haiku ($0.80/M) para classificacao e resposta (tarefas simples, alto volume). Sonnet ($3/M) apenas para analise de imagem (precisa de vision + qualidade). Regras deterministicas para acoes do sistema (zero custo). Se o lead nao tem foto, pula a etapa 2 e economiza $0.005/lead. Essa decisao por etapa e o model routing do M1.",
              },
              {
                title: "Operacao (M3) aplicada",
                color: C.purple,
                text: "Cada etapa do pipeline tem: retry com backoff se a API falhar, timeout por modelo (Haiku 10s, Sonnet 30s), validacao de schema Zod no output, fallback (se classificacao falhar, marca como INDEFINIDO + flag revisao humana), log completo em AICallLog (tokens, custo, latencia, template, entityType=Lead). Cache: mesma mensagem em 24h retorna do cache.",
              },
              {
                title: "ROI e impacto",
                color: C.green,
                text: "Custo por lead processado: ~$0.006 (~R$0.035). 30 leads/dia = R$1.05/dia = R$31.50/mes. Economia: vendedor gasta 15min por lead manualmente (classificar, pesquisar historico, escrever resposta). Com o pipeline, gasta 30s (revisar e aprovar). 30 leads x 14min economizados = 7h/dia devolvidas ao time comercial. ROI absurdo.",
              },
            ].map(function(section) {
              return (
                <div key={section.title} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", padding: "20px", marginBottom: "12px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: section.color, margin: "0 0 10px" }}>{section.title}</h3>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.8, color: C.textMuted }}>{section.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
