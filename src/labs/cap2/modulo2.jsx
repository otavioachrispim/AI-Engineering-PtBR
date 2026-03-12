import { useState, useCallback } from "react";

// ============================================================
// PROMPT TEMPLATES - Costa Lima Piscinas
// ============================================================

const TECHNIQUES = [
  {
    id: "zero-shot",
    name: "Zero-Shot",
    color: "#60a5fa",
    description: "Instrução direta sem exemplos. O mais simples e barato.",
    icon: "1️⃣",
  },
  {
    id: "few-shot",
    name: "Few-Shot",
    color: "#a78bfa",
    description: "Com exemplos concretos. Mais consistente, especialmente para formato.",
    icon: "📋",
  },
  {
    id: "cot",
    name: "Chain-of-Thought",
    color: "#f59e0b",
    description: "Raciocínio passo a passo. Melhor para tarefas analíticas.",
    icon: "🧠",
  },
  {
    id: "pipeline",
    name: "Pipeline Multi-Etapa",
    color: "#22c55e",
    description: "Quebra a tarefa em etapas menores. Mais controle e robustez.",
    icon: "⛓️",
  },
];

const SCENARIOS = [
  {
    id: "classify",
    name: "Classificar Lead",
    icon: "📋",
    description: "Mensagem de lead → intenção + dados estruturados",
    testInputs: [
      "Boa tarde, gostaria de saber quanto custa mais ou menos uma piscina de 8x4 com prainha e aquecimento solar. Tenho um terreno de 15x30 em Volta Redonda.",
      "A bomba da minha piscina tá fazendo um barulho estranho, parece que tá cavitando. Vocês fazem manutenção?",
      "Oi, vocês trabalham com reforma de piscina? A minha tem 15 anos e o vinil tá todo desbotado, queria trocar e talvez mudar o formato.",
      "Preciso de um orçamento urgente pra entregar pro meu cliente. Piscina comercial 12x6 com raia.",
      "Vocês me entregaram a piscina há 2 meses e já tá infiltrando. Estou muito insatisfeito.",
    ],
    prompts: {
      "zero-shot": {
        system: "Você é o assistente de classificação de leads da Costa Lima Piscinas.",
        user: `Classifique a intenção da mensagem abaixo em uma das categorias: CONSTRUCAO, REFORMA, MANUTENCAO, ORCAMENTO, RECLAMACAO.

Retorne APENAS um JSON válido com esta estrutura:
{
  "intencao": "CATEGORIA",
  "confianca": número de 0 a 100,
  "servicos": ["lista de serviços identificados"],
  "urgencia": "baixa" | "media" | "alta",
  "proximo_passo": "ação recomendada"
}

Mensagem: "{{input}}"`,
      },
      "few-shot": {
        system: "Você é o assistente de classificação de leads da Costa Lima Piscinas. Siga exatamente o formato dos exemplos.",
        user: `Classifique a intenção do lead. Exemplos:

Mensagem: "Quero construir uma piscina no meu quintal, terreno de 10x20"
→ {"intencao": "CONSTRUCAO", "confianca": 95, "servicos": ["piscina_nova"], "urgencia": "media", "proximo_passo": "Agendar visita técnica para avaliar terreno"}

Mensagem: "Minha piscina tá verde, preciso de uma limpeza urgente"
→ {"intencao": "MANUTENCAO", "confianca": 92, "servicos": ["limpeza", "tratamento_agua"], "urgencia": "alta", "proximo_passo": "Agendar limpeza emergencial"}

Mensagem: "Quero trocar o vinil da piscina e colocar iluminação LED"
→ {"intencao": "REFORMA", "confianca": 90, "servicos": ["troca_vinil", "iluminacao"], "urgencia": "media", "proximo_passo": "Enviar catálogo de vinís e orçamento de iluminação"}

Mensagem: "Obra atrasada, ninguém me dá retorno, quero falar com gerente"
→ {"intencao": "RECLAMACAO", "confianca": 98, "servicos": [], "urgencia": "alta", "proximo_passo": "Escalar para coordenador imediatamente"}

Agora classifique:
Mensagem: "{{input}}"`,
      },
      "cot": {
        system: "Você é o assistente de classificação de leads da Costa Lima Piscinas. Raciocine passo a passo antes de classificar.",
        user: `Analise a mensagem do lead passo a passo:

1. Identifique palavras-chave e intenção principal
2. Determine quais serviços estão sendo solicitados
3. Avalie a urgência (sinais: "urgente", "problema", reclamação = alta; consulta = média; pesquisa = baixa)
4. Defina o próximo passo mais adequado
5. Atribua confiança baseada na clareza da mensagem

Depois, retorne APENAS o JSON final:
{"intencao": "CATEGORIA", "confianca": 0-100, "servicos": [], "urgencia": "baixa|media|alta", "proximo_passo": "string", "raciocinio": "seu raciocínio resumido"}

Mensagem: "{{input}}"`,
      },
      "pipeline": {
        system: "Você executa pipelines de análise de leads em etapas.",
        user: `Execute o pipeline abaixo sequencialmente:

=== ETAPA 1: EXTRAÇÃO ===
Extraia da mensagem: serviços mencionados, dimensões (se houver), localização (se houver), tom emocional.

=== ETAPA 2: CLASSIFICAÇÃO ===
Com base na extração, classifique em: CONSTRUCAO, REFORMA, MANUTENCAO, ORCAMENTO, RECLAMACAO.

=== ETAPA 3: SCORING ===
Atribua confiança (0-100) e urgência (baixa/media/alta).

=== ETAPA 4: AÇÃO ===
Defina o próximo passo mais adequado para o vendedor.

Retorne o resultado completo em JSON:
{
  "extracao": {"servicos": [], "dimensoes": null, "localizacao": null, "tom": "string"},
  "classificacao": {"intencao": "CATEGORIA", "confianca": 0-100},
  "scoring": {"urgencia": "string", "valor_estimado": "string ou null"},
  "acao": {"proximo_passo": "string", "prioridade": "string"}
}

Mensagem: "{{input}}"`,
      },
    },
  },
  {
    id: "response",
    name: "Gerar Resposta WhatsApp",
    icon: "💬",
    description: "Dados do lead → resposta profissional para WhatsApp",
    testInputs: [
      "Boa tarde, vocês fazem piscina de concreto? Qual o prazo e valor médio?",
      "Oi, minha piscina tá com a água turva faz 3 dias, já coloquei cloro e nada resolve",
      "Estou comparando orçamentos. O de vocês ficou 20% mais caro que o concorrente. Tem como negociar?",
      "Adorei o trabalho de vocês na piscina do meu vizinho! Quero fazer uma igual",
      "Preciso cancelar a obra, tive um imprevisto financeiro",
    ],
    prompts: {
      "zero-shot": {
        system: "Você é o assistente de WhatsApp da Costa Lima Piscinas. Responda de forma profissional e amigável. Máximo 3 parágrafos curtos.",
        user: `Gere uma resposta para o cliente via WhatsApp.

Regras:
- Tom profissional mas acessível
- Máximo 3 parágrafos curtos
- Sempre sugira próximo passo concreto
- Nunca invente preços específicos
- Use emoji com moderação (máximo 2)

Mensagem do cliente: "{{input}}"`,
      },
      "few-shot": {
        system: "Você é o assistente de WhatsApp da Costa Lima Piscinas. Siga o tom e formato dos exemplos abaixo.",
        user: `Exemplos de respostas:

Cliente: "Vocês trabalham com piscina de fibra?"
Resposta: "Olá! Tudo bem? 👋\n\nTrabalhamos com piscinas de vinil e concreto armado, que são os modelos que oferecem melhor durabilidade e personalização de tamanho. A fibra tem limitações de formato e transporte.\n\nPosso agendar uma visita técnica gratuita para avaliar seu espaço e apresentar as opções? Qual o melhor dia?"

Cliente: "O filtro da piscina tá vazando"
Resposta: "Oi! Esse tipo de vazamento precisa ser avaliado presencialmente — pode ser junta, conexão ou o próprio filtro. 🔧\n\nConsigo encaixar uma visita técnica ainda esta semana. Você prefere manhã ou tarde?\n\nEnquanto isso, se puder desligar a bomba pra evitar perda de água, ajuda bastante."

Agora gere resposta para:
Cliente: "{{input}}"`,
      },
      "cot": {
        system: "Você é o assistente de WhatsApp da Costa Lima Piscinas.",
        user: `Antes de responder, analise:
1. Qual o tom do cliente? (animado, preocupado, irritado, neutro)
2. É urgente? (problema ativo vs consulta)
3. O que o cliente realmente precisa? (informação, ação, empatia)
4. Qual o melhor próximo passo?

Depois gere a resposta de WhatsApp (máximo 3 parágrafos, tom adequado ao item 1).

Retorne JSON:
{
  "analise": {"tom": "", "urgente": true/false, "necessidade": "", "proximo_passo": ""},
  "resposta": "texto da mensagem WhatsApp"
}

Mensagem do cliente: "{{input}}"`,
      },
      "pipeline": {
        system: "Você executa pipelines de comunicação com clientes.",
        user: `Pipeline de resposta ao cliente:

=== ETAPA 1: ANÁLISE DE SENTIMENTO ===
Tom do cliente: positivo/neutro/negativo/urgente
Nível de conhecimento técnico: leigo/intermediário/técnico

=== ETAPA 2: CLASSIFICAÇÃO DE INTENÇÃO ===
O que o cliente quer: informação, orçamento, suporte, reclamação, cancelamento

=== ETAPA 3: CONTEXTO DE NEGÓCIO ===
É oportunidade de venda? Risco de perder cliente? Precisa escalar?

=== ETAPA 4: GERAÇÃO DE RESPOSTA ===
Considerando etapas 1-3, gere resposta WhatsApp adequada (máx 3 parágrafos).

Retorne JSON:
{
  "sentimento": {"tom": "", "conhecimento": ""},
  "intencao": "",
  "negocio": {"oportunidade": true/false, "risco": true/false, "escalar": true/false},
  "resposta": "texto WhatsApp"
}

Mensagem: "{{input}}"`,
      },
    },
  },
  {
    id: "summary",
    name: "Resumir Diário de Obra",
    icon: "🏗️",
    description: "Diários da semana → relatório executivo + alertas",
    testInputs: [
      "Segunda: Equipe de 5 pessoas iniciou a escavação. Tempo ensolarado. Profundidade de 1.2m alcançada.\nTerça: Continuação da escavação, encontramos um veio d'água no canto leste. Engenheiro chamado para avaliar.\nQuarta: Engenheiro aprovou drenagem lateral. Instalação do sistema de drenagem. 3 pessoas.\nQuinta: Chuva pela manhã, obra parada até 13h. À tarde, conclusão da drenagem e retomada da escavação.\nSexta: Escavação finalizada. Início da compactação do solo. Materiais para ferragem chegam segunda.",
      "Seg: Concretagem da laje da piscina. 6 operários + caminhão betoneira. Tudo ok.\nTer: Cura do concreto. Equipe reduzida (2 pessoas) fazendo acabamento nas bordas.\nQua: Início do revestimento com vinil. Chegou o vinil errado (cor azul royal em vez de azul claro). PARADA para troca.\nQui: Aguardando vinil correto. Equipe realocada para outra obra. Cliente ligou cobrando prazo.\nSex: Vinil correto chegou às 14h. Não deu tempo de instalar. Segunda sem falta.",
    ],
    prompts: {
      "zero-shot": {
        system: "Você é o assistente de obras da Costa Lima Piscinas. Gere relatórios executivos objetivos.",
        user: `Resuma os diários de obra da semana em um relatório executivo.

Formato do relatório:
- Progresso geral (% estimado e atividades concluídas)
- Problemas encontrados e como foram resolvidos
- Alertas que precisam de atenção
- Equipe e produtividade
- Previsão para próxima semana

Diários da semana:
{{input}}`,
      },
      "few-shot": {
        system: "Você é o assistente de obras da Costa Lima Piscinas. Siga o formato do exemplo.",
        user: `Exemplo:

Diários: "Seg: Chegou material, 4 pessoas. Ter: Início ferragem. Qua: Chuva, parado. Qui: Retomou ferragem. Sex: Ferragem 80%."

Relatório:
{"progresso": "Ferragem 80% concluída. 1 dia perdido por chuva.", "problemas": [{"descricao": "Chuva parou obra quarta", "impacto": "1 dia de atraso", "resolvido": true}], "alertas": ["Verificar previsão para próxima semana"], "equipe": "4 pessoas/dia, produtividade impactada 20% pelo clima", "proxima_semana": "Concluir ferragem + iniciar concretagem"}

Agora gere o relatório:
Diários:
{{input}}`,
      },
      "cot": {
        system: "Você é o assistente de obras da Costa Lima Piscinas. Analise sistematicamente antes de gerar o relatório.",
        user: `Analise os diários passo a passo:

1. CRONOLOGIA: O que aconteceu cada dia?
2. PROGRESSO: Quais marcos foram atingidos?
3. PROBLEMAS: O que deu errado? Foi resolvido?
4. IMPACTOS: Algum atraso no cronograma?
5. RISCOS: Algo pode causar problemas futuros?
6. EQUIPE: Quantas pessoas/dia? Houve variação?

Depois, sintetize em JSON:
{
  "progresso": "resumo em 1-2 frases",
  "marcos_atingidos": ["lista"],
  "problemas": [{"descricao": "", "impacto": "", "status": "resolvido|pendente"}],
  "atrasos_dias": número,
  "riscos": ["lista de riscos futuros"],
  "equipe_media": "X pessoas/dia",
  "proxima_semana": "prioridades",
  "alerta_coordenador": "string ou null"
}

Diários:
{{input}}`,
      },
      "pipeline": {
        system: "Você executa análise de diários de obra em pipeline.",
        user: `Pipeline de análise:

=== ETAPA 1: PARSE ===
Extraia de cada dia: data, atividades, equipe, clima, incidentes.

=== ETAPA 2: MÉTRICAS ===
Calcule: dias trabalhados vs dias parados, tamanho médio de equipe, % de conclusão estimado.

=== ETAPA 3: PROBLEMAS & RISCOS ===
Classifique problemas por severidade (baixa/media/alta). Identifique riscos futuros.

=== ETAPA 4: RELATÓRIO EXECUTIVO ===
Gere relatório para coordenador + versão resumida para cliente.

JSON:
{
  "parse": [{"dia": "", "atividades": "", "equipe": 0, "clima": "", "incidente": null}],
  "metricas": {"dias_trabalhados": 0, "dias_parados": 0, "equipe_media": 0, "conclusao_estimada": ""},
  "problemas": [{"descricao": "", "severidade": "", "status": ""}],
  "riscos": [],
  "relatorio_coordenador": "texto",
  "relatorio_cliente": "texto curto"
}

Diários:
{{input}}`,
      },
    },
  },
];

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
  pink: "#ec4899",
};

// ============================================================
// SIMULATED RESPONSES (since we can't call API in artifact directly)
// ============================================================
function simulateResponse(scenario, technique, input) {
  const lower = input.toLowerCase();

  if (scenario === "classify") {
    const isConstruction = lower.includes("piscina") && (lower.includes("cust") || lower.includes("fazer") || lower.includes("quero") || lower.includes("terreno"));
    const isMaintenance = lower.includes("bomba") || lower.includes("verde") || lower.includes("turva") || lower.includes("limpe");
    const isReform = lower.includes("reform") || lower.includes("troc") || lower.includes("vinil") && lower.includes("trocar");
    const isComplaint = lower.includes("insatisfeito") || lower.includes("infiltr") || lower.includes("reclam") || lower.includes("cancel");

    const intencao = isComplaint ? "RECLAMACAO" : isMaintenance ? "MANUTENCAO" : isReform ? "REFORMA" : isConstruction ? "CONSTRUCAO" : "ORCAMENTO";
    const confianca = isComplaint ? 95 : isMaintenance ? 90 : isReform ? 88 : isConstruction ? 92 : 75;

    if (technique === "zero-shot") {
      return JSON.stringify({
        intencao, confianca,
        servicos: intencao === "CONSTRUCAO" ? ["piscina_nova", "aquecimento_solar"] : intencao === "MANUTENCAO" ? ["reparo_bomba"] : ["reforma_geral"],
        urgencia: isComplaint ? "alta" : isMaintenance ? "alta" : "media",
        proximo_passo: intencao === "CONSTRUCAO" ? "Agendar visita técnica" : intencao === "RECLAMACAO" ? "Escalar para coordenador" : "Enviar orçamento estimado"
      }, null, 2);
    } else if (technique === "few-shot") {
      return JSON.stringify({
        intencao, confianca: confianca + 3,
        servicos: intencao === "CONSTRUCAO" ? ["piscina_nova", "prainha", "aquecimento_solar"] : intencao === "MANUTENCAO" ? ["diagnostico_bomba", "reparo"] : ["troca_vinil", "reforma_estrutural"],
        urgencia: isComplaint ? "alta" : isMaintenance ? "alta" : "media",
        proximo_passo: intencao === "CONSTRUCAO" ? "Agendar visita técnica para avaliar terreno 15x30 em Volta Redonda" : intencao === "RECLAMACAO" ? "Escalar para coordenador imediatamente — cliente insatisfeito com infiltração" : "Agendar visita técnica diagnóstica"
      }, null, 2);
    } else if (technique === "cot") {
      return JSON.stringify({
        raciocinio: `1. Palavras-chave: ${intencao === "CONSTRUCAO" ? "'piscina 8x4', 'prainha', 'aquecimento solar', 'terreno'" : intencao === "MANUTENCAO" ? "'bomba', 'barulho', 'cavitando'" : intencao === "RECLAMACAO" ? "'infiltrando', 'insatisfeito', '2 meses'" : "'reforma', 'trocar'"}\n2. Serviços: ${intencao === "CONSTRUCAO" ? "construção de piscina + prainha + aquecimento solar" : "manutenção corretiva"}\n3. Urgência: ${isComplaint || isMaintenance ? "alta — problema ativo que precisa de resolução" : "média — consulta/interesse"}\n4. Próximo passo: ${intencao === "CONSTRUCAO" ? "visita técnica para dimensionar projeto" : "agendamento prioritário"}\n5. Confiança: ${confianca + 5}% — mensagem clara e específica`,
        intencao, confianca: confianca + 5,
        servicos: intencao === "CONSTRUCAO" ? ["piscina_vinil_8x4", "prainha", "aquecimento_solar"] : intencao === "MANUTENCAO" ? ["diagnostico_bomba", "possivel_troca_rotor"] : ["analise_infiltracao", "reparo_garantia"],
        urgencia: isComplaint ? "alta" : isMaintenance ? "alta" : "media",
        proximo_passo: intencao === "CONSTRUCAO" ? "Agendar visita técnica em Volta Redonda para avaliar terreno 15x30m e dimensionar projeto (piscina 8x4 + prainha + aquecimento)" : "Resolver com prioridade máxima"
      }, null, 2);
    } else {
      return JSON.stringify({
        extracao: {
          servicos: intencao === "CONSTRUCAO" ? ["piscina 8x4", "prainha", "aquecimento solar"] : ["manutenção"],
          dimensoes: intencao === "CONSTRUCAO" ? "8x4m (terreno 15x30m)" : null,
          localizacao: lower.includes("volta redonda") ? "Volta Redonda" : null,
          tom: isComplaint ? "insatisfeito/urgente" : isMaintenance ? "preocupado" : "interessado/positivo"
        },
        classificacao: { intencao, confianca: confianca + 4 },
        scoring: { urgencia: isComplaint ? "alta" : isMaintenance ? "alta" : "media", valor_estimado: intencao === "CONSTRUCAO" ? "R$80.000-100.000" : null },
        acao: { proximo_passo: intencao === "CONSTRUCAO" ? "Agendar visita técnica em Volta Redonda" : "Encaminhar para equipe técnica", prioridade: isComplaint ? "P0 - imediata" : "P2 - normal" }
      }, null, 2);
    }
  }

  // Simplified for other scenarios
  return JSON.stringify({ nota: "Resposta simulada — em produção, viria da API do Claude", tecnica: technique, cenario: scenario }, null, 2);
}

// Token counting approximation
function countTokens(text) {
  return Math.ceil(text.length / 3.5);
}

// ============================================================
// MAIN APP
// ============================================================
export default function PromptWorkbench() {
  const [activeTab, setActiveTab] = useState("workbench");
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const [selectedTechnique, setSelectedTechnique] = useState("zero-shot");
  const [selectedInput, setSelectedInput] = useState(0);
  const [results, setResults] = useState({});
  const [showPrompt, setShowPrompt] = useState(false);

  const scenario = SCENARIOS.find(s => s.id === selectedScenario);
  const technique = TECHNIQUES.find(t => t.id === selectedTechnique);
  const input = scenario?.testInputs[selectedInput] || "";
  const promptTemplate = scenario?.prompts[selectedTechnique];

  const fullPrompt = promptTemplate
    ? `[SYSTEM]\n${promptTemplate.system}\n\n[USER]\n${promptTemplate.user.replace("{{input}}", input)}`
    : "";

  const inputTokens = countTokens(fullPrompt);
  const estimatedOutputTokens = selectedTechnique === "pipeline" ? 400 : selectedTechnique === "cot" ? 300 : 200;

  const runSingle = useCallback(() => {
    const response = simulateResponse(selectedScenario, selectedTechnique, input);
    setResults(prev => ({
      ...prev,
      [`${selectedScenario}-${selectedTechnique}-${selectedInput}`]: {
        response,
        tokens: { input: inputTokens, output: countTokens(response) },
        timestamp: Date.now(),
      }
    }));
  }, [selectedScenario, selectedTechnique, selectedInput, input, inputTokens]);

  const runAll = useCallback(() => {
    TECHNIQUES.forEach(t => {
      const response = simulateResponse(selectedScenario, t.id, input);
      setResults(prev => ({
        ...prev,
        [`${selectedScenario}-${t.id}-${selectedInput}`]: {
          response,
          tokens: { input: countTokens(scenario.prompts[t.id].user.replace("{{input}}", input)), output: countTokens(response) },
          timestamp: Date.now(),
        }
      }));
    });
  }, [selectedScenario, selectedInput, input, scenario]);

  const currentResult = results[`${selectedScenario}-${selectedTechnique}-${selectedInput}`];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: C.purple,
            padding: "4px 10px", borderRadius: "4px",
            background: `${C.purple}12`, border: `1px solid ${C.purple}33`,
          }}>
            Cap 2 · Módulo 2
          </span>
          <h1 style={{
            fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.3,
            background: `linear-gradient(135deg, ${C.text}, ${C.purple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Prompt Engineering Workbench
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Zero-shot · Few-shot · Chain-of-Thought · Pipeline — compare lado a lado
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "workbench", label: "Workbench" },
            { id: "compare", label: "Comparar Todas" },
            { id: "templates", label: "Templates" },
            { id: "guide", label: "Guia" },
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

        {/* WORKBENCH TAB */}
        {activeTab === "workbench" && (
          <div>
            {/* Scenario selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => { setSelectedScenario(s.id); setSelectedInput(0); }} style={{
                  flex: 1, padding: "10px", borderRadius: "8px", fontSize: "11px",
                  fontFamily: "inherit", cursor: "pointer", textAlign: "center",
                  border: `1px solid ${selectedScenario === s.id ? C.cyan : C.border}`,
                  background: selectedScenario === s.id ? `${C.cyan}10` : C.surface,
                  color: selectedScenario === s.id ? C.cyan : C.textMuted,
                  fontWeight: selectedScenario === s.id ? 700 : 400,
                }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>

            {/* Technique selector */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              {TECHNIQUES.map(t => (
                <button key={t.id} onClick={() => setSelectedTechnique(t.id)} style={{
                  flex: 1, minWidth: "120px", padding: "10px 12px", borderRadius: "8px", fontSize: "10px",
                  fontFamily: "inherit", cursor: "pointer",
                  border: `1px solid ${selectedTechnique === t.id ? t.color : C.border}`,
                  background: selectedTechnique === t.id ? `${t.color}10` : "transparent",
                  color: selectedTechnique === t.id ? t.color : C.textDim,
                  fontWeight: 600, textAlign: "left",
                }}>
                  <div style={{ fontSize: "12px", marginBottom: "2px" }}>{t.icon} {t.name}</div>
                  <div style={{ fontSize: "9px", opacity: 0.7 }}>{t.description}</div>
                </button>
              ))}
            </div>

            {/* Input selector */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "14px", marginBottom: "12px",
            }}>
              <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Mensagem de teste ({selectedInput + 1}/{scenario?.testInputs.length})
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                {scenario?.testInputs.map((_, i) => (
                  <button key={i} onClick={() => setSelectedInput(i)} style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    border: `1px solid ${selectedInput === i ? C.cyan : C.border}`,
                    background: selectedInput === i ? `${C.cyan}15` : "transparent",
                    color: selectedInput === i ? C.cyan : C.textDim,
                    fontSize: "11px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  }}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <div style={{
                padding: "12px", borderRadius: "8px", background: C.bg,
                fontSize: "12px", color: C.textMuted, lineHeight: 1.6,
              }}>
                "{input}"
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
              <button onClick={runSingle} style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: `linear-gradient(135deg, ${C.purple}cc, ${C.purple})`,
                color: "#fff", fontSize: "12px", fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer",
              }}>
                ▶ Executar {technique?.name}
              </button>
              <button onClick={() => setShowPrompt(!showPrompt)} style={{
                padding: "10px 16px", borderRadius: "8px",
                border: `1px solid ${C.border}`, background: "transparent",
                color: C.textMuted, fontSize: "11px", fontFamily: "inherit", cursor: "pointer",
              }}>
                {showPrompt ? "Ocultar" : "Ver"} Prompt ({inputTokens} tokens)
              </button>
            </div>

            {/* Show full prompt */}
            {showPrompt && (
              <div style={{
                background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "16px", marginBottom: "12px", maxHeight: "300px", overflowY: "auto",
              }}>
                <pre style={{
                  margin: 0, fontSize: "11px", color: C.textMuted, lineHeight: 1.6,
                  whiteSpace: "pre-wrap", fontFamily: "inherit",
                }}>
                  {fullPrompt}
                </pre>
                <div style={{
                  marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}`,
                  display: "flex", gap: "16px", fontSize: "10px", color: C.textDim,
                }}>
                  <span>Input: ~{inputTokens} tokens</span>
                  <span>Output estimado: ~{estimatedOutputTokens} tokens</span>
                  <span>Total: ~{inputTokens + estimatedOutputTokens} tokens</span>
                </div>
              </div>
            )}

            {/* Result */}
            {currentResult && (
              <div style={{
                background: C.surface, border: `1px solid ${technique?.color}33`, borderRadius: "10px",
                padding: "16px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px",
                }}>
                  <span style={{
                    fontSize: "9px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px",
                    background: `${technique?.color}15`, color: technique?.color, letterSpacing: "0.5px",
                  }}>
                    {technique?.name}
                  </span>
                  <span style={{ fontSize: "10px", color: C.textDim }}>
                    {currentResult.tokens.input} in + {currentResult.tokens.output} out = {currentResult.tokens.input + currentResult.tokens.output} tokens
                  </span>
                </div>
                <pre style={{
                  margin: 0, fontSize: "11px", color: C.green, lineHeight: 1.6,
                  whiteSpace: "pre-wrap", fontFamily: "inherit",
                  background: C.bg, padding: "14px", borderRadius: "8px",
                  maxHeight: "350px", overflowY: "auto",
                }}>
                  {currentResult.response}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.6 }}>
              Executa as 4 técnicas na mesma mensagem para comparação direta.
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => { setSelectedScenario(s.id); setSelectedInput(0); }} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", fontSize: "11px",
                  fontFamily: "inherit", cursor: "pointer",
                  border: `1px solid ${selectedScenario === s.id ? C.cyan : C.border}`,
                  background: selectedScenario === s.id ? `${C.cyan}10` : "transparent",
                  color: selectedScenario === s.id ? C.cyan : C.textMuted,
                }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>

            <div style={{
              padding: "10px 14px", borderRadius: "8px", background: C.surface,
              border: `1px solid ${C.border}`, fontSize: "11px", color: C.textMuted,
              marginBottom: "12px",
            }}>
              "{scenario?.testInputs[selectedInput]}"
            </div>

            <button onClick={runAll} style={{
              padding: "10px 24px", borderRadius: "8px", border: "none",
              background: `linear-gradient(135deg, ${C.cyan}cc, ${C.cyan})`,
              color: "#fff", fontSize: "12px", fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", marginBottom: "16px",
            }}>
              ▶ Executar Todas as 4 Técnicas
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {TECHNIQUES.map(t => {
                const key = `${selectedScenario}-${t.id}-${selectedInput}`;
                const result = results[key];
                return (
                  <div key={t.id} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", borderBottom: result ? `1px solid ${C.border}` : "none",
                    }}>
                      <span style={{
                        fontSize: "9px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px",
                        background: `${t.color}15`, color: t.color,
                      }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: "10px", color: C.textDim, flex: 1 }}>{t.description}</span>
                      {result && (
                        <span style={{ fontSize: "10px", color: C.textDim }}>
                          {result.tokens.input + result.tokens.output} tokens
                        </span>
                      )}
                    </div>
                    {result && (
                      <pre style={{
                        margin: 0, fontSize: "10px", color: t.color, lineHeight: 1.5,
                        whiteSpace: "pre-wrap", fontFamily: "inherit",
                        padding: "12px 14px", maxHeight: "200px", overflowY: "auto",
                      }}>
                        {result.response}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Templates prontos para integração no backend do Costa Lima. Copie e adapte para o serviço Express.
            </p>
            {SCENARIOS.map(s => (
              <div key={s.id} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                marginBottom: "12px", overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                  fontSize: "13px", fontWeight: 700, color: C.text,
                }}>
                  {s.icon} {s.name}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{
                    fontSize: "10px", color: C.textDim, marginBottom: "8px",
                    fontWeight: 700, letterSpacing: "0.5px",
                  }}>
                    TEMPLATE RECOMENDADO (Few-Shot)
                  </div>
                  <pre style={{
                    margin: 0, fontSize: "10px", color: C.cyan, lineHeight: 1.5,
                    whiteSpace: "pre-wrap", fontFamily: "inherit",
                    background: C.bg, padding: "12px", borderRadius: "8px",
                    maxHeight: "250px", overflowY: "auto",
                  }}>
{`// ${s.name} - Template v1.0
const TEMPLATE_${s.id.toUpperCase()} = {
  model: "${s.id === "classify" ? "haiku" : "sonnet"}",
  system: ${JSON.stringify(s.prompts["few-shot"].system)},
  user: ${JSON.stringify(s.prompts["few-shot"].user).replace(/\\n/g, "\\n\"\n    + \"")},
};

// Uso no controller:
async function ${s.id}Handler(req, res) {
  const { mensagem } = req.body;
  const prompt = TEMPLATE_${s.id.toUpperCase()}
    .user.replace("{{input}}", mensagem);
  
  const response = await callClaude({
    model: TEMPLATE_${s.id.toUpperCase()}.model,
    system: TEMPLATE_${s.id.toUpperCase()}.system,
    message: prompt,
  });
  
  const result = JSON.parse(response);
  res.json(result);
}`}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "Quando usar cada técnica",
                color: C.cyan,
                content: `Zero-Shot: Tarefas simples, modelo grande, custo importa. 
→ Costa Lima: classificação rápida de leads com Haiku.

Few-Shot: Formato precisa ser consistente, modelo menor, ou tarefa ambígua.
→ Costa Lima: respostas de WhatsApp com tom padronizado.

Chain-of-Thought: Raciocínio analítico, decisões com justificativa, debugging.
→ Costa Lima: análise de viabilidade de obra, decisão sobre prioridade.

Pipeline: Tarefas complexas que combinam extração + classificação + geração.
→ Costa Lima: lead chega → classificar → estimar valor → gerar resposta → sugerir ação.`
              },
              {
                title: "Prompt como código — versionamento",
                color: C.amber,
                content: `Trate prompts como você trata migrations do Prisma:

1. Versione: CLASSIFY_LEAD_v2.1 — nunca edite sem incrementar versão
2. Teste: prompt novo deve passar nos mesmos inputs que o antigo
3. Monitore: logue inputs/outputs pra detectar degradação
4. Rollback: se v2.1 piorar, volte pra v2.0 imediatamente

No Costa Lima, crie um arquivo prompts/templates.ts com todos os templates versionados, e um serviço ai/client.ts que abstrai a chamada à API.`
              },
              {
                title: "Armadilhas comuns",
                color: C.red,
                content: `1. "Faça o melhor possível" → vago, imprevisível. Defina critérios explícitos.

2. Prompt enorme com tudo junto → quebra em pipeline. Menos contexto = menos confusão.

3. Confiar no output sem validação → SEMPRE valide JSON com try/catch, verifique se os campos existem, se os valores estão no range esperado.

4. Mesmo prompt pra todos os modelos → adapte. Haiku precisa de mais exemplos; Opus precisa de menos mas mais contexto.

5. Não medir → sem métricas, você não sabe se o prompt melhorou. Crie um conjunto de teste com 20+ inputs e respostas esperadas.`
              },
              {
                title: "Métricas de qualidade de prompt",
                color: C.green,
                content: `Consistência: mesmo input → output com mesma estrutura? (rode 10x e compare)
Acurácia: classificou corretamente? (compare com labels manuais)
Completude: todos os campos preenchidos? (valide schema)
Latência: tempo total aceitável pro caso de uso?
Custo: tokens por chamada dentro do budget?

Para o Costa Lima, crie 20 mensagens de leads com classificação manual.
Rode cada técnica nas 20 e meça:
- % de classificações corretas
- % de JSONs parseáveis
- Tokens médios por chamada
- Tempo médio de resposta`
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
