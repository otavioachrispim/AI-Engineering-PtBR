import { useState, useCallback, useMemo } from "react";

var C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#2563eb", orange: "#f97316",
};

// ============================================================
// SIMULATED EMBEDDINGS (simplified 8D for visualization)
// In production: 1536 dimensions via Voyage AI or OpenAI
// ============================================================
var DOCUMENTS = [
  { id: 1, type: "politica", title: "Garantia estrutural", content: "Garantia estrutural de piscinas: 5 anos cobrindo trincas, infiltracoes e problemas na estrutura de concreto. Valida com manutencao preventiva semestral.", tags: ["garantia", "estrutura", "anos"], embedding: [0.82, 0.15, -0.3, 0.1, 0.65, -0.2, 0.4, 0.55] },
  { id: 2, type: "politica", title: "Garantia equipamentos", content: "Garantia de equipamentos (bomba, filtro, clorador): 2 anos. Cobre defeitos de fabricacao. Nao cobre mau uso ou falta de manutencao.", tags: ["garantia", "equipamento", "bomba"], embedding: [0.78, 0.12, -0.25, 0.3, 0.58, -0.15, 0.35, 0.5] },
  { id: 3, type: "politica", title: "Garantia vinil", content: "Garantia do revestimento em vinil: 3 anos. Cobre descolamento, rasgos na solda e desbotamento excessivo. Nao cobre danos por objetos cortantes.", tags: ["garantia", "vinil", "revestimento"], embedding: [0.75, 0.18, -0.28, 0.15, 0.6, -0.18, 0.38, 0.48] },
  { id: 4, type: "manual", title: "Procedimento vazamento", content: "Em caso de vazamento: 1) Desligar bomba pelo disjuntor. 2) Marcar nivel da agua. 3) Verificar perda em 24h. 4) Se perda > 3cm/dia: provavel infiltracao. 5) Acionar equipe tecnica para teste de estanqueidade.", tags: ["vazamento", "emergencia", "bomba"], embedding: [-0.2, 0.75, 0.6, -0.1, -0.3, 0.8, 0.15, -0.25] },
  { id: 5, type: "manual", title: "Manutencao preventiva", content: "Manutencao preventiva mensal: verificar pH (7.2-7.6), cloro (1-3 ppm), limpar skimmer, verificar pressao do filtro, testar bomba. Custo medio: R$350-500/mes.", tags: ["manutencao", "preventiva", "mensal"], embedding: [-0.15, 0.65, 0.5, 0.2, -0.25, 0.7, 0.1, -0.3] },
  { id: 6, type: "tabela", title: "Precos piscinas", content: "Piscina vinil 6x3: R$45-55k. Piscina vinil 8x4: R$75-95k. Piscina alvenaria 6x3: R$55-70k. Prainha: +R$8-12k. Aquecimento solar: +R$8-15k. LED: +R$2-4k.", tags: ["preco", "valor", "orcamento"], embedding: [0.1, -0.3, 0.15, 0.85, 0.2, -0.1, 0.7, 0.6] },
  { id: 7, type: "tabela", title: "Prazos de obra", content: "Piscina vinil 6x3: 30 dias uteis. Piscina vinil 8x4: 45-60 dias. Reforma geral: 15-20 dias. Manutencao simples: 1-3 dias. Prazo pode variar com chuvas e fornecedores.", tags: ["prazo", "tempo", "dias"], embedding: [0.05, -0.2, 0.2, 0.75, 0.3, -0.05, 0.65, 0.55] },
  { id: 8, type: "faq", title: "Agua verde", content: "Agua verde indica proliferacao de algas. Causas: cloro insuficiente, pH desregulado, falta de filtragem. Solucao: tratamento de choque com cloro + algicida. Tempo de recuperacao: 24-48h.", tags: ["agua", "verde", "algas", "tratamento"], embedding: [-0.3, 0.55, 0.7, -0.2, -0.4, 0.65, 0.05, -0.15] },
  { id: 9, type: "faq", title: "Melhor epoca para construir", content: "Melhor epoca: outono e inverno (abril-agosto). Menos chuva facilita escavacao e concretagem. Piscina fica pronta para o verao. Evitar: dezembro-fevereiro (chuvas intensas).", tags: ["epoca", "construir", "clima"], embedding: [0.5, -0.1, -0.15, 0.6, 0.45, -0.3, 0.55, 0.3] },
  { id: 10, type: "diario", title: "Obra OBR-034 - Atraso cimento", content: "28/02/2026: Fornecedor de cimento atrasou entrega. Obra parada. Previsao de retorno: 05/03. Impacto estimado: 5 dias de atraso no cronograma.", tags: ["atraso", "cimento", "fornecedor", "obra"], embedding: [0.35, 0.4, -0.5, 0.2, 0.1, 0.3, -0.15, -0.4] },
];

// Simulated query embeddings
var QUERY_EMBEDDINGS = {
  "qual a garantia da piscina": [0.8, 0.14, -0.28, 0.12, 0.62, -0.19, 0.39, 0.52],
  "problema com agua verde": [-0.28, 0.58, 0.68, -0.18, -0.38, 0.62, 0.08, -0.12],
  "quanto custa uma piscina 8x4": [0.12, -0.28, 0.18, 0.82, 0.22, -0.08, 0.68, 0.58],
  "a bomba esta vazando": [-0.18, 0.72, 0.58, -0.08, -0.28, 0.78, 0.12, -0.22],
  "qual o prazo de uma obra": [0.08, -0.18, 0.22, 0.72, 0.32, -0.02, 0.62, 0.52],
  "melhor epoca para fazer piscina": [0.48, -0.08, -0.12, 0.58, 0.42, -0.28, 0.52, 0.28],
  "obra do carlos atrasou": [0.38, 0.38, -0.48, 0.22, 0.12, 0.28, -0.12, -0.38],
};

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  var dot = 0, magA = 0, magB = 0;
  for (var i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Search documents by query
function searchDocs(queryKey) {
  var qEmb = QUERY_EMBEDDINGS[queryKey];
  if (!qEmb) return [];
  return DOCUMENTS.map(function(doc) {
    return { doc: doc, similarity: cosineSimilarity(qEmb, doc.embedding) };
  }).sort(function(a, b) { return b.similarity - a.similarity; });
}

// ============================================================
// CHUNKING DEMO
// ============================================================
var CHUNK_DEMO = {
  original: "POLITICA DE GARANTIA - COSTA LIMA PISCINAS\n\nGarantia Estrutural\nA estrutura da piscina (concreto armado) possui garantia de 5 (cinco) anos contra trincas, infiltracoes e problemas estruturais. Esta garantia e valida mediante a realizacao de manutencao preventiva semestral conforme orientacoes da empresa.\n\nGarantia de Equipamentos\nBombas, filtros, cloradores e demais equipamentos possuem garantia de 2 (dois) anos contra defeitos de fabricacao. Nao estao cobertos: danos por mau uso, falta de manutencao ou instalacao por terceiros.\n\nGarantia do Revestimento (Vinil)\nO revestimento em vinil possui garantia de 3 (tres) anos contra descolamento, rasgos na solda e desbotamento excessivo. Nao cobre danos causados por objetos cortantes, produtos quimicos nao recomendados ou animais.\n\nCondicoes Gerais\nTodas as garantias estao condicionadas ao uso adequado da piscina e realizacao de manutencao preventiva. O acionamento deve ser feito por escrito com descricao do problema e fotos.",
  chunks: [
    { id: 1, text: "Garantia Estrutural: A estrutura da piscina (concreto armado) possui garantia de 5 anos contra trincas, infiltracoes e problemas estruturais. Valida mediante manutencao preventiva semestral.", tokens: 42, overlap: false },
    { id: 2, text: "Garantia de Equipamentos: Bombas, filtros, cloradores possuem garantia de 2 anos contra defeitos de fabricacao. Nao cobertos: danos por mau uso, falta de manutencao ou instalacao por terceiros.", tokens: 38, overlap: false },
    { id: 3, text: "Garantia do Revestimento (Vinil): 3 anos contra descolamento, rasgos na solda e desbotamento excessivo. Nao cobre danos por objetos cortantes ou produtos quimicos nao recomendados.", tokens: 36, overlap: false },
    { id: 4, text: "Condicoes Gerais: Todas as garantias condicionadas ao uso adequado e manutencao preventiva. Acionamento por escrito com descricao e fotos.", tokens: 28, overlap: false },
  ],
};

// ============================================================
// TYPE STYLES
// ============================================================
var TYPE_COLORS = { politica: C.purple, manual: C.red, tabela: C.amber, faq: C.cyan, diario: C.orange };
var TYPE_LABELS = { politica: "POLITICA", manual: "MANUAL", tabela: "TABELA", faq: "FAQ", diario: "DIARIO" };

// ============================================================
// COMPONENTS
// ============================================================

function SimilarityBar(props) {
  var sim = props.similarity;
  var pct = Math.max(0, Math.min(100, sim * 100));
  var color = sim >= 0.8 ? C.green : sim >= 0.5 ? C.amber : C.textDim;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "120px" }}>
      <div style={{ flex: 1, height: "6px", background: C.bg, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "10px", fontWeight: 700, color: color, width: "35px", textAlign: "right" }}>
        {(sim * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function VectorViz(props) {
  var embedding = props.embedding;
  var label = props.label;
  var color = props.color || C.cyan;
  var maxAbs = Math.max.apply(null, embedding.map(function(v) { return Math.abs(v); }));

  return (
    <div style={{ marginBottom: "6px" }}>
      {label && <div style={{ fontSize: "9px", color: color, fontWeight: 700, marginBottom: "3px" }}>{label}</div>}
      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
        {embedding.map(function(v, i) {
          var h = Math.abs(v) / maxAbs * 24;
          var isPos = v >= 0;
          return (
            <div key={i} style={{
              width: "20px", height: "28px", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "14px", height: h + "px",
                background: isPos ? color : C.red,
                borderRadius: "2px",
                opacity: 0.6 + Math.abs(v) * 0.4,
                position: "absolute",
                bottom: isPos ? "14px" : "auto",
                top: isPos ? "auto" : "14px",
              }} />
              <div style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                width: "100%", height: "1px", background: C.border,
              }} />
            </div>
          );
        })}
        <span style={{ fontSize: "7px", color: C.textDim, marginLeft: "4px" }}>[{embedding.length}D]</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function EmbeddingsLab() {
  var [activeTab, setActiveTab] = useState("search");
  var [selectedQuery, setSelectedQuery] = useState("qual a garantia da piscina");
  var [showVectors, setShowVectors] = useState(false);

  var queryKeys = Object.keys(QUERY_EMBEDDINGS);
  var results = searchDocs(selectedQuery);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 16px" }}>

        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.purple, padding: "4px 10px", borderRadius: "4px",
            background: C.purple + "12", border: "1px solid " + C.purple + "33",
          }}>Cap 8 - Modulo 1</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Embeddings e Busca Semantica
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Vetores de significado | Similaridade de cosseno | pgvector | Chunking
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "search", label: "Busca Semantica" },
            { id: "vectors", label: "Visualizar Vetores" },
            { id: "chunking", label: "Chunking" },
            { id: "index", label: "Base Indexada" },
            { id: "guide", label: "Guia" },
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

        {/* SEARCH */}
        {activeTab === "search" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Selecione uma pergunta e veja o ranking de documentos por similaridade semantica. O sistema encontra respostas por SIGNIFICADO, nao por palavras exatas.
            </p>

            {/* Query selector */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
              {queryKeys.map(function(q) {
                var isSel = selectedQuery === q;
                return (
                  <button key={q} onClick={function() { setSelectedQuery(q); }} style={{
                    padding: "6px 12px", borderRadius: "6px", fontSize: "10px",
                    fontFamily: "inherit", cursor: "pointer",
                    border: "1px solid " + (isSel ? C.cyan : C.border),
                    background: isSel ? C.cyan + "12" : "transparent",
                    color: isSel ? C.cyan : C.textMuted,
                    fontWeight: isSel ? 700 : 400,
                  }}>{q}</button>
                );
              })}
            </div>

            {/* Query display */}
            <div style={{
              padding: "10px 14px", borderRadius: "8px", marginBottom: "14px",
              background: C.blue + "10", border: "1px solid " + C.blue + "22",
              fontSize: "12px", color: C.cyan,
            }}>
              <span style={{ color: C.blue, fontWeight: 700, fontSize: "9px" }}>QUERY: </span>
              "{selectedQuery}"
            </div>

            {/* Results */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {results.map(function(r, i) {
                var tc = TYPE_COLORS[r.doc.type] || C.textDim;
                var isRelevant = r.similarity >= 0.7;
                return (
                  <div key={r.doc.id} style={{
                    padding: "12px 14px", fontSize: "11px",
                    borderBottom: i < results.length - 1 ? "1px solid " + C.border : "none",
                    background: isRelevant ? C.green + "04" : "transparent",
                    opacity: r.similarity < 0.3 ? 0.4 : 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: C.textDim, width: "18px" }}>#{i + 1}</span>
                      <span style={{
                        fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                        background: tc + "15", color: tc,
                      }}>{TYPE_LABELS[r.doc.type]}</span>
                      <span style={{ fontWeight: 700, color: C.text }}>{r.doc.title}</span>
                      <div style={{ marginLeft: "auto" }}>
                        <SimilarityBar similarity={r.similarity} />
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.5, paddingLeft: "26px" }}>
                      {r.doc.content.length > 150 ? r.doc.content.substring(0, 150) + "..." : r.doc.content}
                    </div>
                    {isRelevant && (
                      <div style={{ fontSize: "8px", color: C.green, paddingLeft: "26px", marginTop: "4px" }}>
                        {"\u2713"} Relevante (similarity {"\u2265"} 70%)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
            }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>Como funciona: </span>
              A query vira um vetor (embedding). Cada documento ja tem seu vetor armazenado. pgvector calcula a similaridade de cosseno entre o vetor da query e todos os documentos, ordenando por proximidade semantica.
            </div>
          </div>
        )}

        {/* VECTORS */}
        {activeTab === "vectors" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Visualizacao simplificada de embeddings (8 dimensoes). Em producao: 1.536 dimensoes. Barras para cima = valor positivo, para baixo = negativo.
            </p>

            {/* Query vector */}
            <div style={{
              background: C.surface, border: "1px solid " + C.blue + "22",
              borderRadius: "10px", padding: "14px", marginBottom: "14px",
            }}>
              <div style={{ fontSize: "10px", color: C.blue, fontWeight: 700, marginBottom: "8px" }}>QUERY: "{selectedQuery}"</div>
              <VectorViz embedding={QUERY_EMBEDDINGS[selectedQuery]} label="" color={C.blue} />
            </div>

            {/* Top 5 document vectors */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "8px" }}>DOCUMENTOS (ordenados por similaridade)</div>
            {results.slice(0, 5).map(function(r, i) {
              var tc = TYPE_COLORS[r.doc.type] || C.textDim;
              return (
                <div key={r.doc.id} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "8px", padding: "10px 14px", marginBottom: "6px",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "8px", fontWeight: 800, color: tc, padding: "1px 5px", borderRadius: "3px", background: tc + "15" }}>{TYPE_LABELS[r.doc.type]}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: C.text }}>{r.doc.title}</span>
                    </div>
                    <VectorViz embedding={r.doc.embedding} color={r.similarity >= 0.7 ? C.green : r.similarity >= 0.4 ? C.amber : C.textDim} />
                  </div>
                  <SimilarityBar similarity={r.similarity} />
                </div>
              );
            })}

            <div style={{
              marginTop: "10px", padding: "10px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.6,
            }}>
              Observe como vetores similares tem barras no mesmo padrao (mesmas dimensoes altas/baixas). Vetores de garantia tem dimensoes 1 e 5 altas. Vetores de procedimentos tem dimensoes 2 e 6 altas. A matematica captura o significado.
            </div>
          </div>
        )}

        {/* CHUNKING */}
        {activeTab === "chunking" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Documentos longos sao divididos em chunks antes de virar embeddings. Cada chunk e uma unidade independente de busca.
            </p>

            {/* Original */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>DOCUMENTO ORIGINAL (144 tokens)</div>
            <pre style={{
              margin: "0 0 14px", padding: "14px", borderRadius: "8px",
              background: C.surface, border: "1px solid " + C.border,
              fontSize: "10px", color: C.textMuted, lineHeight: 1.6,
              whiteSpace: "pre-wrap", fontFamily: "inherit",
              maxHeight: "200px", overflowY: "auto",
            }}>
              {CHUNK_DEMO.original}
            </pre>

            {/* Chunks */}
            <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>
              CHUNKS ({CHUNK_DEMO.chunks.length} pedacos, ~35 tokens cada)
            </div>
            {CHUNK_DEMO.chunks.map(function(chunk) {
              return (
                <div key={chunk.id} style={{
                  background: C.surface, border: "1px solid " + C.border,
                  borderRadius: "8px", padding: "12px 14px", marginBottom: "6px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: C.purple + "20", border: "1px solid " + C.purple,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 800, color: C.purple,
                    }}>{chunk.id}</span>
                    <span style={{ fontSize: "9px", color: C.textDim }}>{chunk.tokens} tokens</span>
                    <span style={{ fontSize: "9px", color: C.green, marginLeft: "auto" }}>embedding gerado</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.textMuted, lineHeight: 1.5, paddingLeft: "30px" }}>
                    {chunk.text}
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: "10px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "10px", color: C.textDim, lineHeight: 1.7,
            }}>
              <span style={{ color: C.purple, fontWeight: 700 }}>Regras de chunking: </span>
              200-500 tokens por chunk. Quebrar em fronteiras naturais (paragrafos, secoes). Overlap de 50-100 tokens entre chunks consecutivos. Cada chunk vira um embedding independente no pgvector.
            </div>
          </div>
        )}

        {/* INDEX */}
        {activeTab === "index" && (
          <div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.6 }}>
              Base de conhecimento do Costa Lima indexada como embeddings. {DOCUMENTS.length} documentos em 5 categorias.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Documentos", value: DOCUMENTS.length, color: C.text },
                { label: "Dimensoes", value: "1.536", color: C.purple },
                { label: "Vector store", value: "pgvector", color: C.cyan },
                { label: "Custo indexar", value: "~$0.02", color: C.green },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{
                    flex: 1, minWidth: "90px", padding: "10px 8px",
                    background: C.surface, border: "1px solid " + C.border,
                    borderRadius: "8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "8px", color: C.textDim }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Document list */}
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "10px", overflow: "hidden" }}>
              {DOCUMENTS.map(function(doc, i) {
                var tc = TYPE_COLORS[doc.type] || C.textDim;
                return (
                  <div key={doc.id} style={{
                    padding: "10px 14px", fontSize: "10px",
                    borderBottom: i < DOCUMENTS.length - 1 ? "1px solid " + C.border : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "7px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px", background: tc + "15", color: tc }}>{TYPE_LABELS[doc.type]}</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{doc.title}</span>
                      <span style={{ color: C.textDim, fontSize: "8px", marginLeft: "auto" }}>tags: {doc.tags.join(", ")}</span>
                    </div>
                    <div style={{ color: C.textMuted, lineHeight: 1.4, fontSize: "9px" }}>
                      {doc.content.length > 120 ? doc.content.substring(0, 120) + "..." : doc.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GUIDE */}
        {activeTab === "guide" && (
          <div>
            {[
              {
                title: "Embeddings: texto vira vetor de significado",
                color: C.purple,
                text: "Embedding = representacao numerica do significado.\n1.536 numeros que capturam o 'sentido' do texto.\nTextos similares ficam proximos no espaco vetorial.\n\n'Quero piscina' ~ 'Desejo construir piscina' (0.94)\n'Quero piscina' != 'Preciso trocar filtro' (0.31)\n\nModelos: Voyage AI voyage-3-lite ($0.02/1M tokens)\n         OpenAI text-embedding-3-small ($0.02/1M tokens)",
              },
              {
                title: "pgvector: zero infra nova para o Costa Lima",
                color: C.cyan,
                text: "pgvector e extensao do PostgreSQL. O Costa Lima ja usa Neon PostgreSQL. Basta:\n\n1. CREATE EXTENSION vector;\n2. Coluna embedding vector(1536) na tabela\n3. Indice ivfflat para busca rapida\n4. Query com operador <=> (distancia de cosseno)\n\nPerformance: <50ms para busca em 10.000 documentos.\nCusto adicional: $0 (ja incluido no Neon).",
              },
              {
                title: "O que indexar no Costa Lima",
                color: C.green,
                text: "DOCUMENTOS DA EMPRESA:\n  Politica de garantia, manual de procedimentos,\n  tabela de precos, FAQ, termos de contrato\n\nDADOS OPERACIONAIS:\n  Diarios de obra, historico de atendimento,\n  descricoes de OS, notas de vistoria\n\nCONHECIMENTO TACITO:\n  Respostas que vendedores deram e converteram,\n  solucoes para problemas recorrentes\n\nTotal estimado: ~100-200 documentos (chunks).\nCusto de indexacao: ~$0.02 (uma vez).",
              },
              {
                title: "Chunking: dividir para buscar melhor",
                color: C.amber,
                text: "REGRAS:\n  200-500 tokens por chunk\n  Quebrar em fronteiras naturais (paragrafos)\n  Overlap 50-100 tokens entre chunks\n  Cada chunk = 1 embedding independente\n\nExemplo: 'Politica de Garantia' (2000 tokens)\n  -> 4 chunks (~400 tokens cada)\n  -> 4 embeddings no pgvector\n  -> Busca retorna o chunk mais relevante\n\nNunca indexe o documento inteiro como 1 embedding.\nO significado se dilui em textos longos.",
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
