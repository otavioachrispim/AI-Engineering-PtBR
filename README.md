# AI Engineering: Do Conceito à Produção

> Curso completo de engenharia de IA aplicada — 11 capítulos, 35 módulos, 45 laboratórios interativos.  
> Aplicado ao **Costa Lima Piscinas**, um ERP real em produção.

---

## 📊 Números do Curso

| Métrica | Quantidade |
|---------|-----------|
| Capítulos | 11 |
| Módulos | 35 |
| Laboratórios interativos | 45 |
| Projetos integradores | 10 |
| Código dos labs | ~1.4MB React |

## 🏗️ O Que Você Vai Aprender

| # | Capítulo | Entregável |
|---|----------|------------|
| 1 | Fundamentos de IA e LLMs | Lead Scoring (Naive Bayes + regras) |
| 2 | APIs e Prompt Engineering | Pipeline intake leads ($0.006/lead) |
| 3 | MCP: Model Context Protocol | MCP Server com 6 tools + RBAC |
| 4 | Agentes Autônomos | Central de 4 agentes especializados |
| 5 | UX/UI com IA | Painel inteligente (busca, chat, smart fill) |
| 6 | DevOps e Infraestrutura | DevOps Command Center |
| 7 | Gestão de Produtos de IA | Product HQ (RICE, métricas, retro) |
| 8 | RAG e Embeddings | Base de conhecimento inteligente |
| 9 | Fine-Tuning e MLOps | ML Studio (destilação + shadow deploy) |
| 10 | Segurança Avançada | Security Operations Center |
| 11 | Capstone | AI Engineering Command Center |

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
git clone https://github.com/seu-usuario/ai-engineering-course.git
cd ai-engineering-course
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm start
```

## 🌐 Deploy na Vercel

### Opção 1: Deploy automático
1. Push para o GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório
4. Deploy automático

### Opção 2: CLI
```bash
npm i -g vercel
vercel
```

Nenhuma variável de ambiente é necessária — os labs rodam 100% no browser.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Índice do curso
│   ├── capitulo/[num]/     # Página de cada capítulo
│   │   └── lab/[mod]/      # Labs interativos
│   └── capstone/           # Projeto final
├── labs/                   # 45 componentes React (labs)
│   ├── cap1/ ... cap10/    # Organizados por capítulo
│   └── capstone.jsx        # Lab do capstone
├── lib/
│   └── chapters.ts         # Metadata do curso
└── styles/
    └── globals.css
```

## 🎯 Projeto Aplicado: Costa Lima Piscinas

Todo o curso usa como caso real o **Costa Lima Piscinas**, um ERP completo:

- **Stack**: Node.js / Express / Prisma / PostgreSQL / Next.js / PWA
- **Infra**: Railway + Neon + Vercel + AWS S3
- **Integrações**: Conta Azul, RD Station, Trello, Z-API (WhatsApp)
- **Resultado**: ROI 1.610% (R$820/mês custo → R$14.020/mês economia)

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript + JSX
- **Styling**: Inline styles (design system dark theme)
- **Font**: JetBrains Mono
- **Deploy**: Vercel-ready

## 📖 Sobre

Este material foi desenvolvido como curso completo de AI Engineering, cobrindo desde fundamentos teóricos até segurança avançada em produção. Cada módulo combina teoria densa com laboratório interativo que roda no browser.

A tese central: **AI Engineering não é saber usar uma API. É saber construir, deployar, monitorar, proteger, medir e melhorar um sistema completo que gera valor real para o negócio.**

## 📄 Licença

MIT
