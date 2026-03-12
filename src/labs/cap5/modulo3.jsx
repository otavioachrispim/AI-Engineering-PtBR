import { useState, useCallback } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// CLI COMMANDS AND SIMULATED OUTPUTS
// ============================================================

var COMMANDS = [
  {
    id: "scaffold",
    category: "Scaffolding",
    icon: "\uD83D\uDCC1",
    color: C.green,
    title: "Scaffold: nova feature Vistorias",
    command: 'claude "Crie a estrutura completa para feature vistorias seguindo o padrao de obras/"',
    description: "Analisa a estrutura existente de obras/ e replica para vistorias/ com adaptacoes",
    steps: [
      { type: "read", text: "Analisando frontend-admin/src/app/obras/ ..." },
      { type: "read", text: "Lendo prisma/schema.prisma (modelo Vistoria) ..." },
      { type: "read", text: "Lendo services/obras.ts (padrao de service) ..." },
      { type: "think", text: "Padrao identificado: page.tsx + components/{List,Form,Detail,Modal} + loading.tsx + service" },
      { type: "create", file: "app/vistorias/page.tsx", lines: 45, desc: "Page com layout, breadcrumbs, importa VistoriaList" },
      { type: "create", file: "app/vistorias/loading.tsx", lines: 12, desc: "Skeleton loader com 3 cards + tabela" },
      { type: "create", file: "app/vistorias/components/VistoriaList.tsx", lines: 98, desc: "Tabela paginada com filtros: status, cliente, periodo" },
      { type: "create", file: "app/vistorias/components/VistoriaForm.tsx", lines: 134, desc: "Form com shadcn + Zod: cliente, obra, obs, upload S3" },
      { type: "create", file: "app/vistorias/components/VistoriaDetail.tsx", lines: 87, desc: "Detalhe com abas: Info, Fotos, Checklist, Historico" },
      { type: "create", file: "app/vistorias/components/VistoriaModal.tsx", lines: 56, desc: "Modal de criacao/edicao reutilizando VistoriaForm" },
      { type: "create", file: "services/vistorias.ts", lines: 78, desc: "CRUD tipado: getVistorias, getById, create, update" },
      { type: "create", file: "types/vistoria.ts", lines: 34, desc: "Types: Vistoria, CreateVistoria, VistoriaFilter" },
      { type: "validate", text: "npx tsc --noEmit ... OK (0 errors)" },
      { type: "validate", text: "npx eslint app/vistorias/ ... OK (0 warnings)" },
      { type: "summary", text: "8 arquivos criados | 544 linhas | 0 erros TS | 0 warnings lint\nTempo estimado manual: ~2h | Tempo com agente: ~30s" },
    ],
  },
  {
    id: "refactor_extract",
    category: "Refatoracao",
    icon: "\uD83D\uDD04",
    color: C.amber,
    title: "Extrair componente compartilhado de endereco",
    command: 'claude "Extraia o formulario de endereco que se repete em clientes/, obras/ e leads/ para components/shared/AddressForm.tsx"',
    description: "Identifica codigo duplicado de endereco em 3 features e consolida em 1 componente",
    steps: [
      { type: "read", text: "Buscando formularios de endereco no projeto ..." },
      { type: "think", text: "Encontrado em 3 locais:\n- app/clientes/components/ClienteForm.tsx (linhas 45-89)\n- app/obras/components/ObraForm.tsx (linhas 67-105)\n- app/leads/components/LeadForm.tsx (linhas 34-72)\nCampos comuns: CEP, rua, numero, complemento, bairro, cidade, estado" },
      { type: "create", file: "components/shared/AddressForm.tsx", lines: 67, desc: "Componente com auto-preenchimento por CEP, todos os campos, Zod schema" },
      { type: "modify", file: "app/clientes/components/ClienteForm.tsx", changes: "-44 +3 linhas", desc: "Substituido bloco de endereco por <AddressForm />" },
      { type: "modify", file: "app/obras/components/ObraForm.tsx", changes: "-38 +3 linhas", desc: "Substituido bloco de endereco por <AddressForm />" },
      { type: "modify", file: "app/leads/components/LeadForm.tsx", changes: "-38 +3 linhas", desc: "Substituido bloco de endereco por <AddressForm />" },
      { type: "validate", text: "npx tsc --noEmit ... OK" },
      { type: "summary", text: "1 criado, 3 modificados | -120 linhas duplicadas, +67 compartilhadas\nReducao: 53 linhas no total | DRY aplicado | 1 lugar para manter" },
    ],
  },
  {
    id: "refactor_types",
    category: "Refatoracao",
    icon: "\uD83D\uDD27",
    color: C.cyan,
    title: "Eliminar 'any' types nos services",
    command: 'claude "Encontre todos os any em services/ e substitua por types corretos baseados nas respostas reais da API"',
    description: "Busca tipos any nos services, infere tipos corretos e substitui",
    steps: [
      { type: "read", text: "Buscando 'any' em services/ ..." },
      { type: "think", text: "Encontrados 12 ocorrencias de 'any' em 5 arquivos:\n- services/agenda.ts: 4 any\n- services/financeiro.ts: 3 any\n- services/estoque.ts: 2 any\n- services/frota.ts: 2 any\n- services/dashboard.ts: 1 any" },
      { type: "read", text: "Analisando controllers do backend para inferir tipos reais ..." },
      { type: "create", file: "types/agenda.ts", lines: 28, desc: "AgendaItem, CreateAgenda, AgendaFilter" },
      { type: "create", file: "types/financeiro.ts", lines: 42, desc: "ContaReceber, ContaPagar, LancamentoFinanceiro" },
      { type: "create", file: "types/estoque.ts", lines: 22, desc: "Equipamento, Movimentacao, EstoqueFilter" },
      { type: "modify", file: "services/agenda.ts", changes: "4 any -> types", desc: "Importa e aplica AgendaItem, AgendaFilter" },
      { type: "modify", file: "services/financeiro.ts", changes: "3 any -> types", desc: "Importa ContaReceber, ContaPagar" },
      { type: "modify", file: "services/estoque.ts", changes: "2 any -> types", desc: "Importa Equipamento, Movimentacao" },
      { type: "modify", file: "services/frota.ts", changes: "2 any -> types", desc: "Tipos de Veiculo e Abastecimento" },
      { type: "modify", file: "services/dashboard.ts", changes: "1 any -> types", desc: "DashboardSummary tipado" },
      { type: "validate", text: "npx tsc --noEmit ... OK (0 errors)\nany count before: 12 | after: 0" },
      { type: "summary", text: "3 criados, 5 modificados | 12 any eliminados | 92 linhas de types adicionadas\nType safety: 100% nos services" },
    ],
  },
  {
    id: "tests",
    category: "Testes",
    icon: "\uD83E\uDDEA",
    color: C.purple,
    title: "Gerar testes para ObraCard",
    command: 'claude "Gere testes unitarios para components/obras/ObraCard.tsx cobrindo: render, status, progresso, acoes, acessibilidade"',
    description: "Le o componente, identifica props e comportamentos, gera testes completos",
    steps: [
      { type: "read", text: "Lendo components/obras/ObraCard.tsx ..." },
      { type: "read", text: "Lendo tests/ para identificar padrao de testes existente ..." },
      { type: "think", text: "Componente aceita: obra (Obra), onCreateOS (callback), onViewDetail (callback)\nComportamentos: badge de status, barra de progresso, botoes de acao\nPadrao de teste: Vitest + Testing Library" },
      { type: "create", file: "tests/components/ObraCard.test.tsx", lines: 112, desc: "8 testes unitarios" },
      { type: "detail", text: "TESTES GERADOS:\n\n1. renderiza com dados completos\n   expect(screen.getByText('OBR-034')).toBeInTheDocument()\n\n2. renderiza com dados minimos (opcionais null)\n   expect(screen.queryByText('Etapa')).not.toBeInTheDocument()\n\n3. badge mostra cor correta por status\n   EM_ANDAMENTO -> amber, CONCLUIDA -> green, PAUSADA -> red\n\n4. barra de progresso reflete percentual\n   style.width = '35%' para progresso=35\n\n5. botao Criar OS chama callback\n   fireEvent.click -> expect(onCreateOS).toHaveBeenCalledWith('obr_001')\n\n6. botao Detalhes chama callback\n   fireEvent.click -> expect(onViewDetail).toHaveBeenCalledWith('obr_001')\n\n7. acessibilidade: navegavel por teclado\n   userEvent.tab -> foco nos botoes em ordem\n\n8. trunca nome longo do cliente\n   nome com 50 chars -> text-overflow: ellipsis" },
      { type: "validate", text: "npx vitest run tests/components/ObraCard.test.tsx\n\n 8 passed | 0 failed | 0.8s" },
      { type: "summary", text: "1 arquivo, 112 linhas, 8 testes | Todos passando\nCobertura estimada do componente: ~85%" },
    ],
  },
  {
    id: "docs",
    category: "Documentacao",
    icon: "\uD83D\uDCDD",
    color: C.orange,
    title: "Documentar services/",
    command: 'claude "Adicione JSDoc em todas as funcoes exportadas de services/ e gere um README do diretorio"',
    description: "Le cada service, entende os parametros e retornos, gera documentacao",
    steps: [
      { type: "read", text: "Listando services/: 27 arquivos ..." },
      { type: "think", text: "142 funcoes exportadas em 27 services.\nCategorizando: auth (3), clientes (5), obras (6), leads (5), tarefas (4), orcamentos (6), financeiro (8), estoque (4), frota (3), agenda (4), vistorias (4), contaAzul (12), dashboard (2), uploads (2)..." },
      { type: "modify", file: "services/obras.ts", changes: "+28 linhas JSDoc", desc: "/**\n * Busca obras com filtros e paginacao\n * @param params - Filtros (status, clienteId, periodo)\n * @returns PaginatedResponse<Obra>\n */" },
      { type: "modify", file: "services/clientes.ts", changes: "+22 linhas JSDoc", desc: "Documentacao completa das 5 funcoes" },
      { type: "modify", file: "services/leads.ts", changes: "+20 linhas JSDoc", desc: "Documentacao com @example de uso" },
      { type: "detail", text: "... (24 arquivos restantes documentados)" },
      { type: "create", file: "services/README.md", lines: 89, desc: "Indice de services com descricao, endpoints e exemplos" },
      { type: "summary", text: "27 modificados, 1 README criado | ~350 linhas de JSDoc adicionadas\n142 funcoes documentadas | Autocomplete do IDE agora mostra descricoes" },
    ],
  },
  {
    id: "review",
    category: "Code Review",
    icon: "\uD83D\uDC41",
    color: C.red,
    title: "Review de seguranca no frontend",
    command: 'claude "Faca um review de seguranca em frontend-admin/: tokens expostos, XSS, dados sensiveis em logs, dependencias vulneraveis"',
    description: "Analisa o frontend inteiro em busca de vulnerabilidades e bad practices",
    steps: [
      { type: "read", text: "Analisando frontend-admin/ (30+ paginas, 27 services) ..." },
      { type: "think", text: "Verificando: exposicao de tokens, XSS, console.log com dados sensiveis, dependencias, env vars..." },
      { type: "detail", text: "RESULTADO DO REVIEW:\n\n[CRITICO] 0 encontrados\n  Nenhum token hardcoded ou credencial exposta.\n\n[ALTO] 2 encontrados\n  1. services/api.ts linha 23: console.log(error.response.data)\n     -> Pode logar dados sensiveis em producao\n     -> FIX: usar logger condicional (if dev) ou remover\n\n  2. contexts/AuthContext.tsx linha 45: token em localStorage\n     -> Vulneravel a XSS (JS no mesmo dominio acessa)\n     -> FIX: httpOnly cookie (requer mudanca no backend)\n\n[MEDIO] 3 encontrados\n  3. Nenhum CSP header configurado no next.config.js\n  4. dangerouslySetInnerHTML usado em 1 componente\n  5. Imagens de usuario sem sanitizacao de URL\n\n[BAIXO] 2 encontrados\n  6. 3 dependencias com vulnerabilidades conhecidas (npm audit)\n  7. Source maps habilitados em producao" },
      { type: "modify", file: "services/api.ts", changes: "Removido console.log sensivel", desc: "Substituido por logger condicional" },
      { type: "modify", file: "next.config.js", changes: "+CSP headers", desc: "Adicionado Content-Security-Policy basico" },
      { type: "validate", text: "npm audit: 3 vulnerabilidades -> 0 apos npm audit fix" },
      { type: "summary", text: "0 criticos | 2 altos (1 corrigido, 1 requer backend) | 3 medios | 2 baixos\n3 arquivos modificados | 3 dependencias atualizadas" },
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================

function TerminalStep(props) {
  var step = props.step;
  var visible = props.visible;
  if (!visible) return null;

  var typeStyles = {
    read: { prefix: "READ", color: C.cyan, icon: "\u25B8" },
    think: { prefix: "THINK", color: C.amber, icon: "\uD83E\uDDE0" },
    create: { prefix: "CREATE", color: C.green, icon: "+" },
    modify: { prefix: "MODIFY", color: C.blue, icon: "\u270E" },
    validate: { prefix: "CHECK", color: C.green, icon: "\u2713" },
    summary: { prefix: "DONE", color: C.green, icon: "\u2605" },
    detail: { prefix: "INFO", color: C.purple, icon: "\u25CF" },
  };

  var ts = typeStyles[step.type] || typeStyles.read;

  return (
    <div style={{ marginBottom: "4px", fontSize: "11px", lineHeight: 1.5 }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ color: ts.color, fontWeight: 700, fontSize: "9px", minWidth: "50px" }}>
          {ts.icon} {ts.prefix}
        </span>
        <div style={{ flex: 1 }}>
          {step.file && (
            <span style={{ color: C.cyan, fontWeight: 600 }}>
              {step.file}
              {step.lines && <span style={{ color: C.textDim }}> ({step.lines} linhas)</span>}
              {step.changes && <span style={{ color: C.amber }}> [{step.changes}]</span>}
            </span>
          )}
          {step.file && step.desc && <br />}
          <span style={{ color: step.type === "summary" ? C.green : step.type === "think" || step.type === "detail" ? C.textMuted : C.textDim }}>
            {step.text || step.desc || ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function CommandSimulator(props) {
  var cmd = props.cmd;
  var visibleSteps = props.visibleSteps;
  var playing = props.playing;

  // Count stats
  var created = cmd.steps.filter(function(s) { return s.type === "create"; }).length;
  var modified = cmd.steps.filter(function(s) { return s.type === "modify"; }).length;
  var totalLines = cmd.steps.reduce(function(sum, s) { return sum + (s.lines || 0); }, 0);

  return (
    <div style={{
      background: "#0a0e14", borderRadius: "10px", border: "1px solid " + C.border,
      overflow: "hidden", fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      {/* Terminal header */}
      <div style={{
        padding: "8px 14px", background: "#111827",
        display: "flex", alignItems: "center", gap: "6px",
        borderBottom: "1px solid " + C.border,
      }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "8px" }}>Terminal - Costa Lima</span>
      </div>

      {/* Command */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border }}>
        <span style={{ color: C.green, fontSize: "11px" }}>$ </span>
        <span style={{ color: C.text, fontSize: "11px" }}>{cmd.command}</span>
      </div>

      {/* Output */}
      <div style={{
        padding: "10px 14px",
        maxHeight: "400px", overflowY: "auto",
      }}>
        {cmd.steps.map(function(step, i) {
          return <TerminalStep key={i} step={step} visible={i < visibleSteps} />;
        })}
        {playing && visibleSteps < cmd.steps.length && (
          <div style={{ color: C.amber, fontSize: "10px", marginTop: "4px" }}>
            {"\u25CF"} Processando...
          </div>
        )}
      </div>

      {/* Stats bar */}
      {!playing && visibleSteps >= cmd.steps.length && (
        <div style={{
          padding: "8px 14px", background: "#111827",
          borderTop: "1px solid " + C.border,
          display: "flex", gap: "16px", fontSize: "10px",
        }}>
          <span style={{ color: C.green }}>{created} criados</span>
          <span style={{ color: C.blue }}>{modified} modificados</span>
          <span style={{ color: C.textDim }}>{totalLines} linhas</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function CLIAgentLab() {
  var [selectedId, setSelectedId] = useState(null);
  var [visibleSteps, setVisibleSteps] = useState(0);
  var [playing, setPlaying] = useState(false);
  var [activeTab, setActiveTab] = useState("sim");

  var selectedCmd = COMMANDS.find(function(c) { return c.id === selectedId; });

  var runCommand = useCallback(function(id) {
    setSelectedId(id);
    setVisibleSteps(0);
    setPlaying(true);
    var cmd = COMMANDS.find(function(c) { return c.id === id; });
    if (!cmd) return;
    cmd.steps.forEach(function(_, i) {
      setTimeout(function() {
        setVisibleSteps(i + 1);
        if (i === cmd.steps.length - 1) setPlaying(false);
      }, (i + 1) * 350);
    });
  }, []);

  // Group by category
  var categories = {};
  COMMANDS.forEach(function(c) {
    if (!categories[c.category]) categories[c.category] = [];
    categories[c.category].push(c);
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.green, padding: "4px 10px", borderRadius: "4px",
            background: C.green + "12", border: "1px solid " + C.green + "33",
          }}>Cap 5 - Modulo 3</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Agentes CLI e Automacao
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Scaffolding | Refatoracao | Testes | Documentacao | Code Review
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "sim", label: "Simulador" },
            { id: "workflow", label: "Workflow" },
            { id: "guide", label: "Boas Praticas" },
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

        {/* SIMULATOR */}
        {activeTab === "sim" && (
          <div>
            {/* Command cards grouped by category */}
            {Object.keys(categories).map(function(cat) {
              return (
                <div key={cat} style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px", letterSpacing: "0.5px" }}>
                    {cat.toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {categories[cat].map(function(cmd) {
                      var isSel = selectedId === cmd.id;
                      return (
                        <button key={cmd.id} onClick={function() { runCommand(cmd.id); }} disabled={playing} style={{
                          textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                          border: "1px solid " + (isSel ? cmd.color + "44" : C.border),
                          background: isSel ? cmd.color + "08" : C.surface,
                          color: C.text, cursor: playing ? "default" : "pointer",
                          fontFamily: "inherit", opacity: playing && !isSel ? 0.5 : 1,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "14px" }}>{cmd.icon}</span>
                            <span style={{ fontSize: "12px", fontWeight: 700 }}>{cmd.title}</span>
                          </div>
                          <div style={{ fontSize: "10px", color: C.textMuted }}>{cmd.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Terminal output */}
            {selectedCmd && (
              <div style={{ marginTop: "16px" }}>
                <CommandSimulator cmd={selectedCmd} visibleSteps={visibleSteps} playing={playing} />
              </div>
            )}
          </div>
        )}

        {/* WORKFLOW */}
        {activeTab === "workflow" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
              O workflow ideal combina agente CLI para o trabalho mecanico e humano para a logica de negocio.
            </p>

            {[
              { step: 1, title: "SCAFFOLD", agent: true, desc: "Agente cria estrutura base de arquivos seguindo padrao do projeto", time: "30s", manual: "2h", color: C.green },
              { step: 2, title: "CUSTOMIZAR", agent: false, desc: "Voce escreve a logica de negocio especifica (validacoes, regras, fluxos)", time: "30min", manual: "30min", color: C.blue },
              { step: 3, title: "REFATORAR", agent: true, desc: "Agente extrai componentes compartilhados, renomeia, move imports", time: "1min", manual: "30min", color: C.amber },
              { step: 4, title: "TESTAR", agent: true, desc: "Agente gera testes unitarios baseados no codigo real", time: "1min", manual: "1h", color: C.purple },
              { step: 5, title: "DOCUMENTAR", agent: true, desc: "Agente gera JSDoc, README, exemplos de uso", time: "1min", manual: "45min", color: C.orange },
              { step: 6, title: "REVIEW", agent: true, desc: "Agente revisa: types, seguranca, edge cases, performance", time: "2min", manual: "30min", color: C.red },
            ].map(function(s) {
              return (
                <div key={s.step} style={{
                  display: "flex", gap: "12px", marginBottom: "8px", alignItems: "center",
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: s.color + "20", border: "2px solid " + s.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 800, color: s.color, flexShrink: 0,
                  }}>{s.step}</div>
                  <div style={{
                    flex: 1, padding: "10px 14px", borderRadius: "8px",
                    background: C.surface, border: "1px solid " + C.border,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: s.color }}>{s.title}</span>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                        background: s.agent ? C.green + "15" : C.blue + "15",
                        color: s.agent ? C.green : C.blue,
                      }}>{s.agent ? "AGENTE" : "HUMANO"}</span>
                      <span style={{ fontSize: "9px", color: C.textDim, marginLeft: "auto" }}>
                        {s.time} <span style={{ color: C.textDim }}>vs</span> <span style={{ color: C.red }}>{s.manual} manual</span>
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: "14px", padding: "14px", borderRadius: "10px",
              background: C.green + "08", border: "1px solid " + C.green + "22",
              display: "flex", justifyContent: "space-between", fontSize: "12px",
            }}>
              <div>
                <div style={{ color: C.green, fontWeight: 700 }}>Com agente CLI</div>
                <div style={{ color: C.textMuted, fontSize: "11px" }}>~35min (5min agente + 30min humano)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.red, fontWeight: 700 }}>Manual</div>
                <div style={{ color: C.textMuted, fontSize: "11px" }}>~4h45min</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.amber, fontWeight: 700 }}>Economia</div>
                <div style={{ color: C.amber, fontSize: "11px" }}>~87% do tempo</div>
              </div>
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Projetos bem estruturados = melhor resultado",
                color: C.green,
                text: "O Costa Lima tem boa estrutura: padrao consistente em app/{feature}/, services tipados, shadcn/ui. Isso significa que o agente consegue replicar padroes com alta fidelidade.\n\nSe o codigo fosse inconsistente (cada feature com estrutura diferente), o agente geraria codigo inconsistente tambem. Garbage in = garbage out.",
              },
              {
                title: "Sempre revise o output",
                color: C.amber,
                text: "O agente NAO entende regras de negocio como voce. Pode gerar:\n- Formulario bonito mas com validacao errada para o dominio\n- Testes que passam mas nao testam o comportamento real\n- Refatoracao que funciona mas muda a semantica\n\nRevise especialmente: validacoes Zod, logica condicional, tratamento de edge cases.",
              },
              {
                title: "Forneca contexto explicito",
                color: C.cyan,
                text: "BOM: 'Siga o padrao de obras/'\nRUIM: 'Crie um componente'\n\nBOM: 'Extraia de clientes/ linhas 45-89'\nRUIM: 'Refatore o codigo'\n\nBOM: 'Gere testes seguindo o padrao de tests/auth.test.ts'\nRUIM: 'Escreva testes'\n\nReferencia a codigo existente > descricao abstrata.",
              },
              {
                title: "Escopo pequeno = resultado melhor",
                color: C.purple,
                text: "BOM: 'Gere testes para ObraCard.tsx'\nRUIM: 'Gere testes para todo o projeto'\n\nBOM: 'Elimine any em services/agenda.ts'\nRUIM: 'Corrija todos os tipos do projeto'\n\nTarefas delimitadas permitem revisao focada. Tarefas enormes geram output que ninguem revisa.",
              },
              {
                title: "Integracao no dia a dia do Costa Lima",
                color: C.orange,
                text: "1. Nova feature? Scaffold primeiro, customize depois\n2. Code review? Agente faz pre-review antes do PR\n3. Bug encontrado? Agente gera teste que reproduz\n4. Refatoracao? Agente faz as mudancas mecanicas\n5. Documentacao atrasada? Agente gera JSDoc do batch\n\nO agente e como um junior muito rapido: faz o trabalho braco com precisao, mas precisa de supervisao senior nas decisoes.",
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
