export interface Module {
  num: number;
  title: string;
  labFile: string; // filename in labs/capN/
}

export interface Chapter {
  num: number;
  title: string;
  subtitle: string;
  color: string;
  modules: Module[];
  integrator: { title: string; labFile: string } | null;
}

export const CHAPTERS: Chapter[] = [
  {
    num: 1,
    title: "Fundamentos de IA e LLMs",
    subtitle: "Tokenização, embeddings, redes neurais e ML no browser",
    color: "#2563eb",
    modules: [
      { num: 1, title: "Panorama histórico e as 3 ondas da IA", labFile: "modulo1.jsx" },
      { num: 2, title: "Tokenização, embeddings e transformers", labFile: "modulo2.jsx" },
      { num: 3, title: "Redes neurais e ciclo de treinamento", labFile: "modulo3.jsx" },
      { num: 4, title: "Machine learning no browser (TF.js)", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "Lead Scoring System", labFile: "integrador.jsx" },
  },
  {
    num: 2,
    title: "APIs de IA e Prompt Engineering",
    subtitle: "Escolha de modelos, prompt engineering, multimodal",
    color: "#22d3ee",
    modules: [
      { num: 1, title: "Escolhendo o modelo certo: custo vs qualidade", labFile: "modulo1.jsx" },
      { num: 2, title: "Prompt engineering: few-shot, CoT, pipelines", labFile: "modulo2.jsx" },
      { num: 3, title: "Operações de backend: retry, cache, validação", labFile: "modulo3.jsx" },
      { num: 4, title: "Multimodal: visão, OCR e PDFs", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "Pipeline de Intake de Leads", labFile: "integrador.jsx" },
  },
  {
    num: 3,
    title: "MCP: Model Context Protocol",
    subtitle: "Tools, resources, RBAC e produção",
    color: "#22c55e",
    modules: [
      { num: 1, title: "Fundamentos: tools, resources e prompts", labFile: "modulo1.jsx" },
      { num: 2, title: "MCP Server em TypeScript/Prisma", labFile: "modulo2.jsx" },
      { num: 3, title: "Segurança: auth, RBAC, rate limiting", labFile: "modulo3.jsx" },
      { num: 4, title: "Produção: multi-client e composição", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "Copiloto Costa Lima", labFile: "integrador.jsx" },
  },
  {
    num: 4,
    title: "Agentes Autônomos",
    subtitle: "ReAct, memória, grafos e multi-agent",
    color: "#f59e0b",
    modules: [
      { num: 1, title: "Padrões: ReAct, Plan-and-Execute, Reflection", labFile: "modulo1.jsx" },
      { num: 2, title: "Memória: curta, longa, episódica e RAG", labFile: "modulo2.jsx" },
      { num: 3, title: "Grafos, fallback, circuit breaker e HITL", labFile: "modulo3.jsx" },
      { num: 4, title: "Multi-agent: Supervisor, Handoff, Hierárquico", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "Central de Agentes Costa Lima", labFile: "integrador.jsx" },
  },
  {
    num: 5,
    title: "IA para UX e UI",
    subtitle: "Design-to-code, CLI agents, features inteligentes",
    color: "#8b5cf6",
    modules: [
      { num: 1, title: "Ciclo de UX assistido por IA", labFile: "modulo1.jsx" },
      { num: 2, title: "Design-to-code e checklist de produção", labFile: "modulo2.jsx" },
      { num: 3, title: "Agentes CLI para desenvolvimento", labFile: "modulo3.jsx" },
      { num: 4, title: "Lógica inteligente e testes E2E", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "Painel Inteligente Costa Lima", labFile: "integrador.jsx" },
  },
  {
    num: 6,
    title: "DevOps e Infraestrutura",
    subtitle: "CI/CD, observabilidade, LGPD, custos",
    color: "#22c55e",
    modules: [
      { num: 1, title: "CI/CD e deploy com IA", labFile: "modulo1.jsx" },
      { num: 2, title: "Monitoramento, observabilidade e escala", labFile: "modulo2.jsx" },
      { num: 3, title: "Segurança, compliance e LGPD", labFile: "modulo3.jsx" },
      { num: 4, title: "Custos, otimização e estratégia", labFile: "modulo4.jsx" },
    ],
    integrator: { title: "DevOps Command Center", labFile: "integrador.jsx" },
  },
  {
    num: 7,
    title: "Gestão de Produtos de IA",
    subtitle: "Discovery, RICE, ética, roadmap",
    color: "#f97316",
    modules: [
      { num: 1, title: "Discovery, priorização e métricas", labFile: "modulo1.jsx" },
      { num: 2, title: "Equipes, comunicação e ética", labFile: "modulo2.jsx" },
      { num: 3, title: "Roadmap, iteração e melhoria contínua", labFile: "modulo3.jsx" },
    ],
    integrator: { title: "Product HQ", labFile: "integrador.jsx" },
  },
  {
    num: 8,
    title: "RAG, Embeddings e Vector Stores",
    subtitle: "pgvector, hybrid search, re-ranking, multi-step",
    color: "#22d3ee",
    modules: [
      { num: 1, title: "Embeddings e busca semântica", labFile: "modulo1.jsx" },
      { num: 2, title: "RAG — Retrieval-Augmented Generation", labFile: "modulo2.jsx" },
      { num: 3, title: "RAG avançado e hybrid search", labFile: "modulo3.jsx" },
    ],
    integrator: { title: "Base de Conhecimento Inteligente", labFile: "integrador.jsx" },
  },
  {
    num: 9,
    title: "Fine-Tuning e MLOps",
    subtitle: "Destilação, avaliação, shadow deploy",
    color: "#8b5cf6",
    modules: [
      { num: 1, title: "Quando, por que e como fazer fine-tuning", labFile: "modulo1.jsx" },
      { num: 2, title: "Destilação, avaliação e pipeline de MLOps", labFile: "modulo2.jsx" },
    ],
    integrator: { title: "ML Studio", labFile: "integrador.jsx" },
  },
  {
    num: 10,
    title: "Segurança Avançada",
    subtitle: "OWASP LLM, red teaming, incident response",
    color: "#ef4444",
    modules: [
      { num: 1, title: "Ameaças, ataques e defesas", labFile: "modulo1.jsx" },
      { num: 2, title: "Hardening, auditoria e incident response", labFile: "modulo2.jsx" },
    ],
    integrator: { title: "Security Operations Center", labFile: "integrador.jsx" },
  },
];

export const CAPSTONE = {
  title: "AI Engineering Command Center",
  labFile: "capstone.jsx",
};

export function getChapter(num: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.num === num);
}

export function getTotalModules(): number {
  return CHAPTERS.reduce((s, c) => s + c.modules.length, 0) + 1; // +1 capstone
}

export function getTotalLabs(): number {
  return CHAPTERS.reduce((s, c) => s + c.modules.length, 0)
    + CHAPTERS.filter((c) => c.integrator).length
    + 1; // capstone
}
