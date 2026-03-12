import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// TEAM / STAKEHOLDER MAP
// ============================================================
var STAKEHOLDERS = [
  {
    role: "AI Champion (Dev)",
    name: "Voce",
    icon: "\uD83D\uDCBB",
    color: C.cyan,
    responsibilities: ["Implementar pipeline de IA", "Escrever e iterar prompts", "Monitorar qualidade e custos", "Manter CI/CD e infra", "Traduzir necessidades de negocio em solucoes tecnicas"],
    communicates: ["Metricas tecnicas", "Custos detalhados", "Riscos e limitacoes", "Roadmap tecnico"],
    needs: ["Priorizacao clara do PO", "Feedback do domain expert", "Acesso a dados reais", "Tempo para iterar prompts"],
  },
  {
    role: "Product Owner",
    name: "Dono / Gestor",
    icon: "\uD83C\uDFAF",
    color: C.amber,
    responsibilities: ["Definir prioridades de negocio", "Aprovar budget de IA", "Validar ROI", "Comunicar visao para equipe"],
    communicates: ["Prioridades", "Restricoes de budget", "Expectativas de resultado", "Feedback de clientes"],
    needs: ["Relatorio simples de ROI", "Demo funcional", "Custos transparentes", "Timeline realista"],
  },
  {
    role: "Domain Expert",
    name: "Felipe (Vendedor)",
    icon: "\uD83D\uDC64",
    color: C.green,
    responsibilities: ["Validar outputs da IA", "Fornecer exemplos reais", "Corrigir classificacoes erradas", "Reportar problemas"],
    communicates: ["Feedback de acuracia", "Casos edge", "Sugestoes de melhoria", "Reclamacoes de UX"],
    needs: ["Interface simples", "IA que economiza tempo (nao adiciona)", "Poder de sobrescrever IA", "Confianca de que dados estao seguros"],
  },
  {
    role: "Domain Expert",
    name: "Sandra (Coordenadora)",
    icon: "\uD83D\uDC69\u200D\uD83D\uDCBC",
    color: C.purple,
    responsibilities: ["Validar relatorios gerados", "Definir regras de negocio", "Aprovar acoes do agente", "Supervisionar operacao"],
    communicates: ["Regras de classificacao", "Excecoes e edge cases", "Feedback de qualidade", "Necessidades de relatorio"],
    needs: ["Dashboard claro", "Alertas de problemas", "Copiloto confiavel", "Controle sobre acoes automaticas"],
  },
];

// ============================================================
// COMMUNICATION GENERATOR
// ============================================================
var COMM_SCENARIOS = [
  {
    id: "monthly_report",
    title: "Relatorio mensal de IA",
    audiences: {
      technical: {
        label: "Para devs",
        content: "AI METRICS - Marco 2026\n\nClassificacao: F1 91.4%, Precision 94%, Recall 89%\nLatencia: P50 340ms, P95 580ms\nCache: hit rate 48% (exato) + 12% (semantico) = 60%\nCusto: $68.40/mes ($2.27/dia medio)\n  - Haiku: $12.60 (18%), Sonnet: $55.80 (82%)\n  - Vision e 56% do custo com 4% das chamadas\nFallback ativado: 3x (timeout API, <1min cada)\nGolden tests: 100% pass em 14 deploys\nDrift: -0.3%/semana (estavel)\n\nAcao: implementar cache de imagem (estimativa -$15/mes)",
      },
      business: {
        label: "Para diretoria",
        content: "RESULTADOS DE IA - Marco 2026\n\nTEMPO DE RESPOSTA AO LEAD\n  Antes: 2 horas | Agora: 5 minutos | Meta: 15 min \u2705\n\nCONVERSAO DE LEADS\n  Antes: 12% | Agora: 17.5% | Meta: 18% (quase!)\n\nECONOMIA GERADA\n  Vendedor: 2h/dia economizadas = R$2.200/mes\n  Coordenador: 1h/dia = R$1.320/mes\n  Conversao extra: ~R$10.000/mes\n  Total: R$14.020/mes de economia\n\nCUSTO\n  IA: R$400/mes | Infra: R$250/mes | Dev: R$500/mes\n  Total: R$1.150/mes | ROI: 1.119%\n\nPROXIMOS PASSOS\n  Abril: analise de fotos de vistoria (economia adicional estimada: R$2.000/mes)\n  Maio: busca inteligente no sistema (produtividade +20%)",
      },
      client: {
        label: "Para clientes",
        content: "Prezado cliente,\n\nInvestimos em tecnologia para atender voce ainda melhor!\n\nAgora respondemos suas solicitacoes em poucos minutos (antes levava horas). Nosso sistema identifica automaticamente o que voce precisa e ja prepara as melhores opcoes.\n\nSeus dados continuam protegidos e sao usados apenas para melhorar nosso atendimento. Voce pode solicitar informacoes sobre como tratamos seus dados a qualquer momento.\n\nQualquer duvida, estamos a disposicao!\n\nEquipe Costa Lima Piscinas",
      },
    },
  },
  {
    id: "incident",
    title: "Comunicar incidente de IA",
    audiences: {
      technical: {
        label: "Para devs",
        content: "INCIDENTE #042 - Classificacao incorreta em lote\n\nO QUE: Prompt template classify_lead_v3 reclassificou 'reforma' como 'construcao' apos atualizacao do modelo Haiku.\nQUANDO: 11/03 08:30 - 10:05 (1h35min)\nIMPACTO: ~12 leads classificados incorretamente\nCAUSA: Atualizacao do modelo mudou interpretacao de 'reforma' em contexto ambiguo\nACOES:\n  1. Rollback para template v2 (10:05)\n  2. Golden test #3 adicionado para este caso\n  3. Reclassificacao manual dos 12 leads\n  4. Template v4 em desenvolvimento com few-shot mais explicito\nPREVENCAO: Golden test suite expandida de 8 para 12 casos",
      },
      business: {
        label: "Para diretoria",
        content: "RESUMO DO PROBLEMA\n\nO que aconteceu: por 1h30 na manha de hoje, o sistema classificou alguns leads de 'reforma' como 'construcao'. Isso significou que 12 leads receberam sugestao de resposta incorreta.\n\nImpacto: nenhum lead foi prejudicado porque os vendedores revisam antes de enviar (o sistema so sugere). Os 12 leads foram corrigidos manualmente.\n\nO que fizemos: corrigimos o problema, adicionamos protecoes para que nao aconteca de novo, e reclassificamos todos os leads afetados.\n\nIsso reforça porque o vendedor sempre revisa as sugestões da IA antes de enviar - exatamente o que aconteceu.",
      },
      client: {
        label: "Para clientes",
        content: "(Nenhuma comunicacao necessaria - incidente interno, sem impacto externo. Vendedores revisaram e corrigiram antes de enviar qualquer mensagem ao cliente.)",
      },
    },
  },
  {
    id: "new_feature",
    title: "Anunciar nova feature de IA",
    audiences: {
      technical: {
        label: "Para devs",
        content: "NOVA FEATURE: Analise de foto de vistoria (Vision)\n\nARQUITETURA:\n  PWA (camera) -> S3 -> Backend -> Sonnet Vision -> JSON\n  Custo estimado: $0.015/foto (~R$5/dia)\n  Latencia: 900ms-1.5s\n\nINTEGRACAO:\n  - Reusa fluxo de upload S3 existente\n  - Novo service: services/ai/vision.ts\n  - Novo template: VISTORIA_FOTO_v1\n  - Output: { nota, problemas[], acoes[] }\n  - Validacao: Zod schema VistoriaAnalysis\n\nTESTS:\n  - 3 golden tests (piscina OK, com problemas, em obra)\n  - Schema validation\n  - Cost guard: <$0.02/foto\n  - Fallback: retorna { nota: null, manual: true }",
      },
      business: {
        label: "Para equipe",
        content: "NOVIDADE: Analise inteligente de fotos!\n\nA partir de agora, quando o tecnico tirar foto da piscina no celular, o sistema analisa automaticamente e identifica:\n\n- Problemas (agua verde, rejunte solto, vazamento)\n- Severidade de cada problema\n- Acao recomendada e custo estimado\n\nComo usar:\n1. Tire a foto normalmente no app\n2. O sistema analisa em ~2 segundos\n3. Veja o diagnostico com nota de 0 a 10\n4. Confirme e o sistema ja cria a OS\n\nIsso economiza ~15min por vistoria (antes o tecnico precisava descrever tudo manualmente).",
      },
      client: {
        label: "Para clientes",
        content: "Agora nossos tecnicos usam analise digital nas vistorias! Tiramos uma foto e em segundos temos um diagnostico completo da sua piscina, incluindo problemas identificados e o que precisa ser feito. Isso significa diagnosticos mais rapidos e precisos para voce!",
      },
    },
  },
];

// ============================================================
// ETHICS EVALUATOR
// ============================================================
var ETHICS_FEATURES = [
  {
    name: "Classificar leads automaticamente",
    criteria: {
      transparencia: { score: 4, note: "Vendedor ve a classificacao e pode corrigir. Cliente nao sabe (nao precisa)." },
      fairness: { score: 3, note: "Monitorar por regiao/perfil. Possivel vies se historico e enviesado." },
      agency: { score: 5, note: "Vendedor tem controle total. Pode ignorar ou corrigir." },
      privacidade: { score: 4, note: "So mensagem vai pro LLM. CPF/endereco nao sao enviados." },
      accountability: { score: 5, note: "Log completo. Se errar, vendedor e responsavel pela decisao final." },
      reversibilidade: { score: 5, note: "Classificacao pode ser corrigida a qualquer momento." },
    },
  },
  {
    name: "Gerar resposta WhatsApp",
    criteria: {
      transparencia: { score: 3, note: "Cliente recebe mensagem 'do vendedor'. Nao sabe que IA rascunhou." },
      fairness: { score: 4, note: "Tom e conteudo consistentes independente do cliente." },
      agency: { score: 5, note: "Vendedor revisa e aprova TODA mensagem antes de enviar (HITL)." },
      privacidade: { score: 3, note: "Primeiro nome do cliente vai pro LLM. Minimizado mas presente." },
      accountability: { score: 4, note: "Vendedor aprovou = vendedor e responsavel pelo conteudo." },
      reversibilidade: { score: 2, note: "Mensagem enviada nao pode ser 'des-enviada'. HITL e critico." },
    },
  },
  {
    name: "Analisar foto de vistoria",
    criteria: {
      transparencia: { score: 4, note: "Tecnico ve o diagnostico e pode discordar. Cliente sabe da analise." },
      fairness: { score: 4, note: "Analise baseada em imagem, sem vies de perfil de cliente." },
      agency: { score: 4, note: "Tecnico confirma diagnostico. Mas OS pode ser criada automaticamente." },
      privacidade: { score: 2, note: "Foto pode conter rostos, placas, enderecos. Requer consentimento." },
      accountability: { score: 3, note: "Se diagnostico errado, quem e responsavel? Tecnico que confirmou." },
      reversibilidade: { score: 4, note: "OS pode ser cancelada. Diagnostico pode ser corrigido." },
    },
  },
  {
    name: "Agente autonomo de atendimento",
    criteria: {
      transparencia: { score: 2, note: "Agente faz multiplas acoes. Usuario pode nao entender todas." },
      fairness: { score: 3, note: "Prioridade de atendimento pode favorecer VIPs sistematicamente." },
      agency: { score: 3, note: "HITL para escrita, mas agente decide caminho. Menor controle." },
      privacidade: { score: 3, note: "Agente acessa multiplos dados (cliente, obra, financeiro)." },
      accountability: { score: 2, note: "Cadeia de decisoes complexa. Dificil atribuir responsabilidade." },
      reversibilidade: { score: 3, note: "Acoes individuais reversiveis, mas sequencia pode ser dificil." },
    },
  },
];

var CRITERIA_LABELS = {
  transparencia: { icon: "\uD83D\uDC41", label: "Transparencia", desc: "Os afetados sabem que IA esta envolvida?" },
  fairness: { icon: "\u2696", label: "Fairness", desc: "Trata todos os grupos de forma equitativa?" },
  agency: { icon: "\u270B", label: "Agency", desc: "Humano mantem controle e pode sobrescrever?" },
  privacidade: { icon: "\uD83D\uDD12", label: "Privacidade", desc: "Dados tratados com o minimo necessario?" },
  accountability: { icon: "\uD83D\uDCCB", label: "Accountability", desc: "Se errar, quem e responsavel?" },
  reversibilidade: { icon: "\u21A9", label: "Reversibilidade", desc: "Acoes podem ser desfeitas?" },
};

// ============================================================
// DILEMMA SCENARIOS
// ============================================================
var DILEMMAS = [
  {
    title: "O vendedor nao quer que o dono saiba que a IA faz o trabalho dele",
    context: "Felipe usa o copiloto o dia inteiro. Responde 3x mais leads. Mas pede: 'nao conta pro chefe que e a IA, senao ele acha que meu trabalho e facil e corta meu salario'.",
    options: [
      { label: "Proteger o Felipe", desc: "Nao reportar metricas individuais. Reportar apenas agregadas ('equipe responde 3x mais rapido'). Respeita o medo do Felipe mas esconde dados do dono.", color: C.amber },
      { label: "Transparencia total", desc: "Reportar metricas por usuario. O dono ve que Felipe usa IA e decide como valorizar. Honesto mas pode prejudicar Felipe.", color: C.cyan },
      { label: "Reframing", desc: "Comunicar como 'Felipe e nosso usuario mais avancado de IA - ele gera 3x mais receita usando as ferramentas certas'. Transforma em argumento de valor, nao de substituicao.", color: C.green },
    ],
    recommendation: "Opcao 3 (Reframing). O vendedor que usa IA melhor e MAIS valioso, nao menos. Comunicar como habilidade, nao como muleta.",
  },
  {
    title: "A IA classifica leads de uma regiao como 'frios' sistematicamente",
    context: "Analise mostra que leads de Resende sao classificados como 'frios' 2x mais que leads de Volta Redonda. Motivo: historicamente, menos clientes de Resende converteram (distancia, concorrencia local).",
    options: [
      { label: "Manter como esta", desc: "A IA reflete os dados reais. Resende realmente converte menos. O vendedor pode sobrescrever se discordar.", color: C.amber },
      { label: "Corrigir o vies", desc: "Remover localizacao do prompt de classificacao. Classificar apenas por intencao da mensagem, nao por regiao.", color: C.green },
      { label: "Monitorar e ajustar", desc: "Adicionar monitoramento por regiao. Se a diferenca persiste apos remover localizacao do prompt, o vies e real (nao da IA).", color: C.cyan },
    ],
    recommendation: "Opcao 3 primeiro, depois opcao 2 se confirmado vies. Sempre separe o que e padrao real do que e vies do modelo.",
  },
  {
    title: "Cliente descobre que resposta foi gerada por IA e reclama",
    context: "Cliente VIP Carlos Mendes percebe que duas respostas de vendedores diferentes tem tom muito parecido. Desconfia e pergunta: 'voces estao usando robo pra me responder?'",
    options: [
      { label: "Negar", desc: "Dizer que nao usa IA. Mentira que pode ser descoberta e destruir confianca.", color: C.red },
      { label: "Transparencia parcial", desc: "'Usamos ferramentas inteligentes que ajudam nossos vendedores a responder mais rapido, mas toda mensagem e revisada e aprovada pessoalmente.' Verdade sem alarmar.", color: C.green },
      { label: "Transparencia total", desc: "'Sim, usamos IA pra rascunhar respostas, mas o vendedor sempre revisa e personaliza antes de enviar. Assim respondemos mais rapido sem perder qualidade.' Completamente honesto.", color: C.cyan },
    ],
    recommendation: "Opcao 2 ou 3 dependendo do cliente. NUNCA opcao 1. Mentir sobre IA e risco reputacional serio. O ponto-chave: 'revisada e aprovada pessoalmente' = verdade + confianca.",
  },
];

// ============================================================
// MAIN APP
// ============================================================
export default function TeamEthicsLab() {
  var [activeTab, setActiveTab] = useState("team");
  var [selectedComm, setSelectedComm] = useState(0);
  var [selectedAudience, setSelectedAudience] = useState("business");
  var [selectedEthics, setSelectedEthics] = useState(0);
  var [selectedDilemma, setSelectedDilemma] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Cap 7 - Modulo 2</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Equipes, Comunicacao e Etica
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Stakeholders | Comunicacao por audiencia | Avaliacao etica | Dilemas reais
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "team", label: "Time e Stakeholders" },
            { id: "comms", label: "Comunicacao" },
            { id: "ethics", label: "Avaliacao Etica" },
            { id: "dilemmas", label: "Dilemas" },
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

        {/* TEAM */}
        {activeTab === "team" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Mapa de stakeholders do Costa Lima. Cada pessoa tem responsabilidades, comunicacoes e necessidades especificas em relacao a IA.
            </p>
            {STAKEHOLDERS.map(function(s) {
              return (
                <div key={s.role + s.name} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "10px", marginBottom: "10px", overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px", borderBottom: "1px solid " + C.border,
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: s.color + "20", border: "2px solid " + s.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px",
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.role}</div>
                      <div style={{ fontSize: "10px", color: C.textDim }}>{s.name}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", fontSize: "10px" }}>
                    <div>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: "9px", marginBottom: "4px" }}>RESPONSABILIDADES</div>
                      {s.responsibilities.map(function(r, i) {
                        return <div key={i} style={{ color: C.textMuted, marginBottom: "2px" }}>{"\u2022"} {r}</div>;
                      })}
                    </div>
                    <div>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: "9px", marginBottom: "4px" }}>COMUNICA</div>
                      {s.communicates.map(function(c, i) {
                        return <div key={i} style={{ color: C.textMuted, marginBottom: "2px" }}>{"\u2022"} {c}</div>;
                      })}
                    </div>
                    <div>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: "9px", marginBottom: "4px" }}>PRECISA</div>
                      {s.needs.map(function(n, i) {
                        return <div key={i} style={{ color: C.textMuted, marginBottom: "2px" }}>{"\u2022"} {n}</div>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMMS */}
        {activeTab === "comms" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              A mesma informacao, comunicada de 3 formas diferentes para 3 audiencias. Selecione o cenario e a audiencia.
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {COMM_SCENARIOS.map(function(sc, i) {
                return (
                  <button key={i} onClick={function() { setSelectedComm(i); }} style={{
                    flex: 1, padding: "8px 10px", borderRadius: "8px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                    border: "1px solid " + (selectedComm === i ? C.cyan : C.border),
                    background: selectedComm === i ? C.cyan + "10" : C.surface,
                    color: selectedComm === i ? C.cyan : C.textMuted,
                    fontWeight: selectedComm === i ? 700 : 400,
                  }}>{sc.title}</button>
                );
              })}
            </div>

            {(function() {
              var sc = COMM_SCENARIOS[selectedComm];
              var audiences = Object.keys(sc.audiences);
              return (
                <div>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
                    {audiences.map(function(aud) {
                      var a = sc.audiences[aud];
                      return (
                        <button key={aud} onClick={function() { setSelectedAudience(aud); }} style={{
                          flex: 1, padding: "8px 10px", borderRadius: "8px", fontSize: "10px",
                          fontFamily: "inherit", cursor: "pointer",
                          border: "1px solid " + (selectedAudience === aud ? C.green : C.border),
                          background: selectedAudience === aud ? C.green + "10" : "transparent",
                          color: selectedAudience === aud ? C.green : C.textDim,
                          fontWeight: selectedAudience === aud ? 700 : 400,
                        }}>{a.label}</button>
                      );
                    })}
                  </div>
                  {sc.audiences[selectedAudience] && (
                    <pre style={{
                      margin: 0, padding: "16px", borderRadius: "10px",
                      background: C.surface, border: "1px solid " + C.border,
                      fontSize: "11px", color: C.text, lineHeight: 1.7,
                      whiteSpace: "pre-wrap", fontFamily: "inherit",
                    }}>
                      {sc.audiences[selectedAudience].content}
                    </pre>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ETHICS */}
        {activeTab === "ethics" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Avaliacao etica de 4 features de IA do Costa Lima em 6 criterios. Score de 1 (preocupante) a 5 (excelente).
            </p>

            <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
              {ETHICS_FEATURES.map(function(f, i) {
                return (
                  <button key={i} onClick={function() { setSelectedEthics(i); }} style={{
                    flex: 1, padding: "8px 10px", borderRadius: "8px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                    border: "1px solid " + (selectedEthics === i ? C.purple : C.border),
                    background: selectedEthics === i ? C.purple + "10" : C.surface,
                    color: selectedEthics === i ? C.purple : C.textMuted,
                    fontWeight: selectedEthics === i ? 700 : 400,
                  }}>{f.name}</button>
                );
              })}
            </div>

            {(function() {
              var feature = ETHICS_FEATURES[selectedEthics];
              var criteria = Object.keys(feature.criteria);
              var avgScore = criteria.reduce(function(s, k) { return s + feature.criteria[k].score; }, 0) / criteria.length;
              var avgColor = avgScore >= 4 ? C.green : avgScore >= 3 ? C.amber : C.red;

              return (
                <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: avgColor }}>{avgScore.toFixed(1)}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{feature.name}</div>
                      <div style={{ fontSize: "10px", color: C.textMuted }}>
                        Score etico medio ({avgScore >= 4 ? "bom" : avgScore >= 3 ? "aceitavel com ressalvas" : "precisa melhorar"})
                      </div>
                    </div>
                  </div>

                  {criteria.map(function(key) {
                    var c = feature.criteria[key];
                    var cl = CRITERIA_LABELS[key];
                    var scoreColor = c.score >= 4 ? C.green : c.score >= 3 ? C.amber : C.red;
                    return (
                      <div key={key} style={{
                        padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
                        background: C.surfaceAlt, border: "1px solid " + C.border,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px" }}>{cl.icon}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: C.text }}>{cl.label}</span>
                          <span style={{ fontSize: "9px", color: C.textDim, flex: 1 }}>{cl.desc}</span>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {[1, 2, 3, 4, 5].map(function(n) {
                              return (
                                <div key={n} style={{
                                  width: "12px", height: "12px", borderRadius: "2px",
                                  background: n <= c.score ? scoreColor : C.bg,
                                  border: "1px solid " + (n <= c.score ? scoreColor : C.border),
                                }} />
                              );
                            })}
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: scoreColor, width: "16px", textAlign: "right" }}>{c.score}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: C.textMuted, paddingLeft: "24px" }}>{c.note}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* DILEMMAS */}
        {activeTab === "dilemmas" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              Dilemas eticos reais que surgem no uso de IA no Costa Lima. Nao ha resposta certa — ha trade-offs conscientes.
            </p>

            {DILEMMAS.map(function(d, i) {
              var isExpanded = selectedDilemma === i;
              return (
                <div key={i} style={{
                  background: C.surface, border: "1px solid " + (isExpanded ? C.amber + "33" : C.border),
                  borderRadius: "10px", marginBottom: "10px", overflow: "hidden",
                }}>
                  <div onClick={function() { setSelectedDilemma(isExpanded ? null : i); }} style={{
                    padding: "14px 16px", cursor: "pointer",
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>{d.title}</div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{d.context}</div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>OPCOES</div>
                      {d.options.map(function(opt, oi) {
                        return (
                          <div key={oi} style={{
                            padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
                            background: opt.color + "08", border: "1px solid " + opt.color + "18",
                          }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: opt.color, marginBottom: "3px" }}>{opt.label}</div>
                            <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.5 }}>{opt.desc}</div>
                          </div>
                        );
                      })}
                      <div style={{
                        padding: "10px 12px", borderRadius: "8px",
                        background: C.green + "08", border: "1px solid " + C.green + "22",
                        fontSize: "11px", color: C.textMuted, lineHeight: 1.6, marginTop: "8px",
                      }}>
                        <span style={{ color: C.green, fontWeight: 700 }}>Recomendacao: </span>
                        {d.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
