import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// UX STAGES
// ============================================================
var STAGES = [
  {
    id: "research",
    name: "Pesquisa",
    icon: "\uD83D\uDD0D",
    color: C.cyan,
    desc: "IA analisa dados de uso e feedback para identificar problemas",
    exercises: [
      {
        title: "Analise de uso do Dashboard Costa Lima",
        context: "O dashboard atual do admin faz 10 chamadas paralelas e mostra: leads, orcamentos, obras, financeiro, graficos, tabelas. Coordenadora Sandra reclama que 'nao encontra nada rapido'.",
        prompt: "Com base neste contexto, identifique os 5 principais problemas de UX e sugira prioridade de resolucao.",
        aiResponse: "PROBLEMAS IDENTIFICADOS:\n\n1. SOBRECARGA INFORMACIONAL (Critico)\n   10 widgets competindo por atencao. Sem hierarquia visual clara.\n   -> Reduzir para 3-4 metricas primarias no topo.\n\n2. FALTA DE PERSONALIZACAO POR PERFIL (Alto)\n   Sandra (coordenadora) ve o mesmo dashboard que Felipe (vendedor).\n   -> Personalizar widgets por cargo/funcao.\n\n3. LATENCIA PERCEBIDA (Medio)\n   10 chamadas paralelas = skeleton loaders por 2-3s. Sensacao de lentidao.\n   -> Priorizar carregamento: metricas criticas primeiro, graficos depois.\n\n4. NAVEGACAO INEFICIENTE (Medio)\n   Informacao detalhada exige clique -> nova pagina -> voltar.\n   -> Implementar modais de preview ou expand-in-place.\n\n5. AUSENCIA DE ACOES RAPIDAS (Baixo)\n   Dashboard e read-only. Sandra precisa navegar para agir.\n   -> Adicionar botoes de acao contextual (criar OS, agendar visita).",
        metrics: { problems: 5, actionable: 5, timeToInsight: "30s" },
      },
      {
        title: "Feedback de usuarios do PWA em campo",
        context: "Colaboradores em campo reportam: 'app demora pra abrir', 'botoes muito pequenos', 'perco o diario quando a internet cai', 'camera demora pra carregar'. Total: 23 reclamacoes em 3 meses.",
        prompt: "Categorize as reclamacoes, identifique padroes e sugira prioridade de correcao.",
        aiResponse: "CATEGORIAS DE FEEDBACK:\n\n1. PERFORMANCE (9/23 reclamacoes - 39%)\n   'App demora', 'camera lenta', 'tela congela'\n   -> Otimizar bundle size, lazy load de componentes, pre-carregar camera\n\n2. ERGONOMIA MOBILE (7/23 - 30%)\n   'Botoes pequenos', 'dificil selecionar', 'texto pequeno'\n   -> Aumentar touch targets para min 48px, fonte base 16px, spacing generoso\n\n3. OFFLINE/CONECTIVIDADE (5/23 - 22%)\n   'Perco dados sem internet', 'nao salva offline'\n   -> Implementar queue offline com sync automatico quando reconectar\n\n4. FLUXO DE USO (2/23 - 9%)\n   'Muitos passos pra criar diario', 'confuso'\n   -> Simplificar: abrir -> foto -> observacao -> enviar (3 toques)\n\nPRIORIDADE: Performance > Ergonomia > Offline > Fluxo\n(Resolver performance primeiro porque afeta TODAS as outras categorias)",
        metrics: { problems: 4, actionable: 4, timeToInsight: "45s" },
      },
    ],
  },
  {
    id: "ideation",
    name: "Ideacao",
    icon: "\uD83D\uDCA1",
    color: C.amber,
    desc: "IA gera variacoes e alternativas de design rapidamente",
    exercises: [
      {
        title: "3 variacoes de card de obra",
        context: "Precisamos de um card para listar obras no dashboard. Deve mostrar: codigo, cliente, status, progresso, valor e acoes rapidas.",
        prompt: "Gere 3 variacoes de design para este card: minimalista, detalhado e orientado a acao.",
        aiResponse: "VARIACAO 1: MINIMALISTA\n+----------------------------------+\n| OBR-034  Carlos Mendes      35% |\n| EM_ANDAMENTO        R$85k    [>]|\n+----------------------------------+\nFoco: informacao densa em 1 linha. Progresso como barra inline.\nUso: listagens longas, visao geral rapida.\n\nVARIACAO 2: DETALHADO\n+----------------------------------+\n| OBR-034              EM_ANDAMENTO|\n| Carlos Mendes                    |\n| ================================ | 35%\n| Etapa: Concretagem               |\n| Prazo: 15/05  |  Valor: R$85k    |\n| [Ver detalhes] [Criar OS] [Chat] |\n+----------------------------------+\nFoco: todas as infos sem clicar. Acoes contextuais.\nUso: dashboard de coordenador, visao de trabalho.\n\nVARIACAO 3: ORIENTADO A ACAO\n+----------------------------------+\n| ! OBR-034 - Carlos Mendes        |\n| [=======-------] 35%             |\n|                                  |\n| Proximo: Concretagem amanha 8h   |\n| Equipe: Joao, Pedro, Lucas       |\n|                                  |\n| [Registrar Diario] [Ver Agenda]  |\n+----------------------------------+\nFoco: proxima acao. O que o usuario PRECISA fazer agora.\nUso: PWA do colaborador em campo.",
        metrics: { variations: 3, timeToGenerate: "20s", reusable: true },
      },
      {
        title: "Fluxo de criacao de orcamento simplificado",
        context: "O wizard atual tem 4 etapas: cliente, itens, pagamento, revisao. Vendedores acham longo demais. Querem fazer em 'menos de 2 minutos'.",
        prompt: "Redesenhe o fluxo para menos de 2 minutos. Aplique progressive disclosure.",
        aiResponse: "FLUXO REDESENHADO (3 etapas, ~90s):\n\nETAPA 1: QUEM + O QUE (30s)\n+----------------------------------+\n| [Buscar cliente...         ] [+] |\n| Carlos Mendes - Volta Redonda    |\n|                                  |\n| Servico: [Piscina nova    v]     |\n| Dimensao: [8x4  ] Tipo: [Vinil] |\n|                                  |\n|              [Proximo ->]        |\n+----------------------------------+\nCliente com autocomplete. Servico pre-preenche itens.\n\nETAPA 2: ITENS + VALOR (40s)\n+----------------------------------+\n| Itens sugeridos (auto):          |\n| [x] Piscina vinil 8x4  R$45.000 |\n| [x] Prainha             R$ 8.000 |\n| [ ] Aquecimento solar   R$12.000 |\n| [ ] Iluminacao LED      R$ 2.500 |\n| [+ Adicionar item manual]        |\n|                                  |\n| TOTAL: R$53.000                  |\n| Pgto: [50% + 3x     v]          |\n|                                  |\n|   [<- Voltar]  [Revisar ->]      |\n+----------------------------------+\nItens PRE-SELECIONADOS por tipo de servico. Toggle on/off.\nPagamento em 1 campo dropdown.\n\nETAPA 3: REVISAR + ENVIAR (20s)\n+----------------------------------+\n| ORCAMENTO ORC-2026-XXX           |\n| Carlos Mendes | R$53.000 | 3 itens|\n|                                  |\n| [Ver detalhes v]                 |\n|                                  |\n| [Salvar rascunho] [Enviar PDF]   |\n+----------------------------------+\nRevisao com collapse. Enviar gera PDF e manda pro cliente.\n\nDE 4 ETAPAS PARA 3. De ~4min para ~90s.\nChave: pre-preenchimento inteligente baseado no tipo de servico.",
        metrics: { variations: 1, timeToGenerate: "30s", improvement: "60% menos tempo" },
      },
    ],
  },
  {
    id: "prototype",
    name: "Prototipacao",
    icon: "\u26A1",
    color: C.green,
    desc: "IA gera componentes funcionais em codigo React/Tailwind",
    exercises: [
      {
        title: "Card de obra interativo",
        context: "Baseado na variacao 2 (detalhado) da ideacao.",
        prompt: "Gere o componente React com Tailwind. Inclua animacao na barra de progresso e badge de status colorido.",
        aiResponse: null,
        component: "obra_card",
        metrics: { codeLines: 45, timeToGenerate: "15s", functional: true },
      },
      {
        title: "Formulario de OS para campo (mobile-first)",
        context: "Colaborador em campo, sol, luvas, tela suja. Precisa criar OS em 30 segundos.",
        prompt: "Gere formulario mobile-first com botoes grandes, poucos campos e camera como input principal.",
        aiResponse: null,
        component: "os_form",
        metrics: { codeLines: 38, timeToGenerate: "20s", functional: true },
      },
    ],
  },
  {
    id: "validate",
    name: "Validacao",
    icon: "\u2705",
    color: C.purple,
    desc: "IA audita acessibilidade, carga cognitiva e usabilidade",
    exercises: [
      {
        title: "Audit de acessibilidade do dashboard",
        context: "Dashboard atual com graficos Recharts, tabelas, e cards. Cores: azul primario #1e3a5f, fundo branco.",
        prompt: "Faca um audit de acessibilidade seguindo WCAG 2.1 AA. Identifique problemas e sugira correcoes.",
        aiResponse: "AUDIT DE ACESSIBILIDADE - WCAG 2.1 AA\n\nPROBLEMAS ENCONTRADOS:\n\n1. CONTRASTE INSUFICIENTE (Critico)\n   #1e3a5f em fundo branco: ratio 8.5:1 - OK para texto grande\n   Mas badges coloridos (verde #22c55e em branco): ratio 2.8:1 - FALHA\n   -> Escurecer badges ou adicionar borda/fundo escuro\n\n2. GRAFICOS SEM ALTERNATIVA TEXTUAL (Alto)\n   Recharts nao gera alt text ou tabela de dados\n   -> Adicionar tabela de dados acessivel abaixo do grafico\n   -> Adicionar aria-label descritivo no container\n\n3. NAVEGACAO POR TECLADO (Medio)\n   Cards nao sao focaveis por Tab\n   -> Adicionar tabIndex=0 e onKeyDown handler\n   -> Outline de foco visivel (nao usar outline:none)\n\n4. SKELETON LOADERS SEM ARIA (Baixo)\n   Loading states nao informam screen readers\n   -> Adicionar aria-busy='true' e aria-live='polite'\n   -> Role='status' no container de loading\n\n5. TABELA SEM HEADERS SEMANTICOS (Medio)\n   Tabelas usando div em vez de table/th/td\n   -> Usar elementos semanticos ou ARIA roles\n\nSCORE ESTIMADO: 62/100 (precisa melhorar para AA)\nPRIORIDADE: Contraste > Graficos > Teclado > ARIA > Semantica",
        metrics: { issues: 5, critical: 1, score: "62/100" },
      },
      {
        title: "Analise de carga cognitiva",
        context: "Formulario de cadastro de cliente: 15 campos (nome, CPF, CNPJ, RG, telefone, email, endereco completo, observacoes, vendedor responsavel, origem, tags).",
        prompt: "Analise a carga cognitiva e sugira como simplificar aplicando progressive disclosure e smart defaults.",
        aiResponse: "ANALISE DE CARGA COGNITIVA\n\nATUAL: 15 campos visiveis simultaneamente\nLei de Hick: tempo de decisao aumenta com cada opcao\nLei de Miller: 7+-2 itens na memoria de trabalho\nDiagnostico: SOBRECARGA (15 > 7)\n\nREDESIGN COM PROGRESSIVE DISCLOSURE:\n\nETAPA 1 - ESSENCIAL (4 campos, 15s)\n  Nome*\n  Telefone*\n  Email\n  Tipo: [Pessoa Fisica v] / [Pessoa Juridica]\n\nETAPA 2 - SE PF (4 campos, mostrar on-demand)\n  CPF\n  RG\n  Data nascimento\n  Endereco (CEP com auto-preenchimento)\n\nETAPA 2 - SE PJ (4 campos)\n  CNPJ (busca automatica na Receita)\n  Razao social (auto-preenche)\n  Inscricao estadual\n  Endereco (auto-preenche pelo CNPJ)\n\nETAPA 3 - OPERACIONAL (3 campos)\n  Vendedor responsavel (auto: usuario logado)\n  Origem [dropdown]\n  Observacoes\n\nDE 15 CAMPOS SIMULTANEOS PARA 4 + 4 + 3\nSmart defaults eliminam 2 campos (vendedor, tipo)\nAuto-preenchimento elimina 3 campos (CNPJ preenche razao, endereco)\nResultado efetivo: usuario preenche ~6 campos em vez de 15",
        metrics: { fieldsBefore: 15, fieldsAfter: 6, reduction: "60%" },
      },
    ],
  },
];

// ============================================================
// PROTOTYPE COMPONENTS (rendered inline)
// ============================================================

function ObraCardPrototype() {
  var status = "EM_ANDAMENTO";
  var statusColors = { EM_ANDAMENTO: C.amber, CONCLUIDA: C.green, APROVADA: C.blue, PAUSADA: C.red };
  var progress = 35;
  var progressColor = progress < 30 ? C.red : progress < 70 ? C.amber : C.green;

  return (
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb",
      maxWidth: "380px", fontFamily: "system-ui, sans-serif", color: "#1a1a2e",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a5f" }}>OBR-034</span>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px",
          background: statusColors[status] + "18", color: statusColors[status],
        }}>
          {status.replace("_", " ")}
        </span>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>Carlos Mendes</div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Piscina vinil 8x4 com prainha</div>
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
          <span style={{ color: "#6b7280" }}>Progresso</span>
          <span style={{ fontWeight: 700, color: progressColor }}>{progress}%</span>
        </div>
        <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ width: progress + "%", height: "100%", background: progressColor, borderRadius: "3px", transition: "width 1s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
        <span>Etapa: Concretagem</span>
        <span>Prazo: 15/05</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "16px", fontWeight: 800, color: "#1e3a5f" }}>R$ 85.000</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={{
            padding: "6px 12px", borderRadius: "6px", border: "1px solid #e5e7eb",
            background: "#fff", color: "#6b7280", fontSize: "11px", cursor: "pointer",
            fontFamily: "inherit",
          }}>Detalhes</button>
          <button style={{
            padding: "6px 12px", borderRadius: "6px", border: "none",
            background: "#1e3a5f", color: "#fff", fontSize: "11px", cursor: "pointer",
            fontFamily: "inherit", fontWeight: 600,
          }}>Criar OS</button>
        </div>
      </div>
    </div>
  );
}

function OSFormPrototype() {
  return (
    <div style={{
      background: "#111827", borderRadius: "16px", padding: "20px",
      maxWidth: "340px", fontFamily: "system-ui, sans-serif", color: "#e5e7eb",
    }}>
      <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px", textAlign: "center" }}>
        Nova Ordem de Servico
      </div>
      <button style={{
        width: "100%", padding: "24px", borderRadius: "12px", border: "2px dashed #374151",
        background: "#1f2937", color: "#9ca3af", fontSize: "14px", textAlign: "center",
        cursor: "pointer", marginBottom: "12px", fontFamily: "inherit",
      }}>
        {"\uD83D\uDCF7"} Tirar Foto
        <div style={{ fontSize: "11px", marginTop: "4px" }}>Toque para abrir camera</div>
      </button>
      <input placeholder="O que precisa ser feito?" style={{
        width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #374151",
        background: "#1f2937", color: "#e5e7eb", fontSize: "14px", marginBottom: "10px",
        fontFamily: "inherit", boxSizing: "border-box",
      }} />
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["Baixa", "Media", "Alta"].map(function(p, i) {
          var colors = [C.green, C.amber, C.red];
          var selected = i === 1;
          return (
            <button key={p} style={{
              flex: 1, padding: "12px", borderRadius: "10px",
              border: "2px solid " + (selected ? colors[i] : "#374151"),
              background: selected ? colors[i] + "20" : "#1f2937",
              color: selected ? colors[i] : "#9ca3af",
              fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{p}</button>
          );
        })}
      </div>
      <button style={{
        width: "100%", padding: "16px", borderRadius: "12px", border: "none",
        background: C.green, color: "#fff", fontSize: "16px", fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Criar OS
      </button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AIUXWorkshop() {
  var [activeStage, setActiveStage] = useState("research");
  var [activeExercise, setActiveExercise] = useState(0);

  var stage = STAGES.find(function(s) { return s.id === activeStage; });
  var exercise = stage ? stage.exercises[activeExercise] : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Cap 5 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            AI-driven UX/UI
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Pesquisa | Ideacao | Prototipacao | Validacao — tudo acelerado por IA
          </p>
        </div>

        {/* Stage tabs */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {STAGES.map(function(s) {
            return (
              <button key={s.id} onClick={function() { setActiveStage(s.id); setActiveExercise(0); }} style={{
                flex: 1, padding: "10px", border: "none", borderRadius: "8px",
                fontSize: "10px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                background: activeStage === s.id ? C.surfaceAlt : "transparent",
                color: activeStage === s.id ? s.color : C.textDim,
              }}>
                {s.icon} {s.name}
              </button>
            );
          })}
        </div>

        {stage && (
          <div>
            {/* Stage header */}
            <div style={{
              padding: "12px 16px", borderRadius: "10px", marginBottom: "14px",
              background: stage.color + "08", border: "1px solid " + stage.color + "22",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: stage.color, marginBottom: "4px" }}>
                {stage.icon} {stage.name}
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>{stage.desc}</div>
            </div>

            {/* Exercise selector */}
            {stage.exercises.length > 1 && (
              <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                {stage.exercises.map(function(ex, i) {
                  return (
                    <button key={i} onClick={function() { setActiveExercise(i); }} style={{
                      flex: 1, padding: "8px 12px", borderRadius: "8px", fontSize: "10px",
                      fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                      border: "1px solid " + (activeExercise === i ? stage.color : C.border),
                      background: activeExercise === i ? stage.color + "10" : C.surface,
                      color: activeExercise === i ? stage.color : C.textMuted,
                      fontWeight: activeExercise === i ? 700 : 400,
                    }}>
                      {ex.title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Exercise content */}
            {exercise && (
              <div style={{
                background: C.surface, border: "1px solid " + C.border,
                borderRadius: "10px", overflow: "hidden",
              }}>
                {/* Context */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid " + C.border }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "6px" }}>{exercise.title}</div>
                  <div style={{
                    padding: "10px 12px", borderRadius: "8px", background: C.surfaceAlt,
                    fontSize: "11px", color: C.textMuted, lineHeight: 1.6,
                  }}>
                    <span style={{ color: C.textDim, fontWeight: 700, fontSize: "9px" }}>CONTEXTO: </span>
                    {exercise.context}
                  </div>
                </div>

                {/* Prompt */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid " + C.border }}>
                  <div style={{
                    padding: "10px 12px", borderRadius: "8px",
                    background: C.blue + "08", border: "1px solid " + C.blue + "18",
                    fontSize: "11px", color: C.cyan, lineHeight: 1.5,
                  }}>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: "9px" }}>PROMPT: </span>
                    {exercise.prompt}
                  </div>
                </div>

                {/* Response or Component */}
                <div style={{ padding: "14px 16px" }}>
                  {exercise.aiResponse && (
                    <div>
                      <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>RESPOSTA DA IA</div>
                      <pre style={{
                        margin: 0, padding: "14px", borderRadius: "8px",
                        background: C.bg, fontSize: "11px", color: C.green,
                        lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit",
                        maxHeight: "400px", overflowY: "auto",
                      }}>
                        {exercise.aiResponse}
                      </pre>
                    </div>
                  )}

                  {exercise.component === "obra_card" && (
                    <div>
                      <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>COMPONENTE GERADO (React + Tailwind)</div>
                      <div style={{ display: "flex", justifyContent: "center", padding: "20px", background: "#f8fafc", borderRadius: "10px" }}>
                        <ObraCardPrototype />
                      </div>
                      <div style={{
                        marginTop: "10px", padding: "10px 12px", borderRadius: "8px",
                        background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
                      }}>
                        Componente funcional gerado por IA. Badge de status com cores dinamicas. Barra de progresso com cores por faixa (vermelho/amarelo/verde). Botoes de acao contextual. Pronto para integrar no Next.js do Costa Lima.
                      </div>
                    </div>
                  )}

                  {exercise.component === "os_form" && (
                    <div>
                      <div style={{ fontSize: "9px", color: C.textDim, fontWeight: 700, marginBottom: "10px" }}>COMPONENTE GERADO (Mobile-first)</div>
                      <div style={{ display: "flex", justifyContent: "center", padding: "20px", background: "#0a0f1a", borderRadius: "10px" }}>
                        <OSFormPrototype />
                      </div>
                      <div style={{
                        marginTop: "10px", padding: "10px 12px", borderRadius: "8px",
                        background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
                      }}>
                        Formulario mobile-first para uso em campo. Camera como input principal (area de toque grande). Apenas 2 campos de texto. Prioridade com botoes grandes e feedback visual. Botao de envio proeminente. Touch targets minimo 48px. Contraste alto para uso ao sol.
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {exercise.metrics && (
                    <div style={{
                      display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap",
                    }}>
                      {Object.keys(exercise.metrics).map(function(key) {
                        return (
                          <div key={key} style={{
                            padding: "6px 12px", borderRadius: "6px",
                            background: C.surfaceAlt, fontSize: "10px",
                          }}>
                            <span style={{ color: C.textDim }}>{key}: </span>
                            <span style={{ color: stage.color, fontWeight: 700 }}>{exercise.metrics[key]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
