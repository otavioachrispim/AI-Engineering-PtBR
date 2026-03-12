import { useState, useRef, useCallback, useEffect } from "react";

const C = {
  bg: "#060911", surface: "#0c1119", surfaceAlt: "#121a27",
  border: "#1a2540", text: "#e0e8f5", textMuted: "#7589a8", textDim: "#3d506b",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", cyan: "#22d3ee",
  purple: "#8b5cf6", blue: "#3b82f6", orange: "#f97316",
};

function drawPool(canvas, scenario) {
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, w, h * 0.3);
  ctx.fillStyle = "#d4a574";
  ctx.fillRect(0, h * 0.3, w, h * 0.7);
  var px = w * 0.15, py = h * 0.35, pw = w * 0.7, ph = h * 0.5;
  ctx.fillStyle = "#8B8682";
  ctx.fillRect(px - 6, py - 6, pw + 12, ph + 12);
  if (scenario === "clean") {
    ctx.fillStyle = "#4FA4E0";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 20 + i * 40, py + 15 + i * 12);
      ctx.lineTo(px + 60 + i * 40, py + 18 + i * 12);
      ctx.stroke();
    }
  } else if (scenario === "algae") {
    ctx.fillStyle = "#3A6A2A";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "rgba(30,80,10,0.5)";
    for (var j = 0; j < 8; j++) {
      ctx.beginPath();
      ctx.arc(px + 20 + (j * pw / 8), py + 10 + (j % 3) * ph / 3, 8 + (j % 4) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#5A4A3A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py + 8);
    ctx.lineTo(px + pw, py + 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(139,134,130,0.5)";
    ctx.fillRect(px, py, pw, ph * 0.15);
  } else {
    ctx.fillStyle = "#A0908A";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    for (var x = px + 15; x < px + pw; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, py + 10); ctx.lineTo(x, py + ph - 10); ctx.stroke();
    }
    for (var y = py + 15; y < py + ph; y += 20) {
      ctx.beginPath(); ctx.moveTo(px + 10, y); ctx.lineTo(px + pw - 10, y); ctx.stroke();
    }
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(w * 0.05, h * 0.65, 22, 18);
  }
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(5, h - 22, 130, 18);
  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  var label = scenario === "clean" ? "Piscina OK" : scenario === "algae" ? "Problemas detectados" : "Obra em andamento";
  ctx.fillText(label, 10, h - 8);
}

function drawNF(canvas) {
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 13px monospace";
  ctx.fillText("NOTA FISCAL ELETRONICA", 20, 28);
  ctx.font = "10px monospace";
  ctx.fillStyle = "#333";
  ctx.fillText("NF-e: 001.234.567", 20, 48);
  ctx.fillText("CNPJ: 12.345.678/0001-90", 20, 62);
  ctx.fillText("PoolTech Equipamentos Ltda", 20, 76);
  ctx.fillText("Data: 10/03/2026", 20, 90);
  ctx.strokeStyle = "#ccc";
  ctx.beginPath(); ctx.moveTo(20, 100); ctx.lineTo(w - 20, 100); ctx.stroke();
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#666";
  ctx.fillText("ITEM                    QTD  VALOR", 20, 116);
  ctx.font = "10px monospace";
  ctx.fillStyle = "#333";
  var items = [
    "Bomba centrifuga 1/2cv   1  R$1.250",
    "Filtro quartzo 19L       1  R$  890",
    "Clorador automatico      1  R$  650",
    "Mangueira 38mm 10m       2  R$  170",
    "Kit conexoes PVC         1  R$  120",
  ];
  for (var i = 0; i < items.length; i++) {
    ctx.fillText(items[i], 20, 134 + i * 17);
  }
  ctx.beginPath(); ctx.moveTo(20, 225); ctx.lineTo(w - 20, 225); ctx.stroke();
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#1a1a2e";
  ctx.fillText("TOTAL: R$ 3.080,00", w - 190, 245);
  ctx.font = "9px monospace";
  ctx.fillStyle = "#888";
  ctx.fillText("Pgto: 30/60/90 dias", 20, 268);
}

function getVistoriaData(scenario) {
  if (scenario === "clean") return { nota: 9, estado: "Bom", rec: "Nenhuma acao corretiva necessaria.", probs: [], acoes: [] };
  if (scenario === "algae") return {
    nota: 3, estado: "Requer atencao urgente",
    rec: "Tratamento de choque prioritario, seguido de reparo no rejunte.",
    probs: [
      { tipo: "Agua verde / algas", sev: "alta", local: "Toda a piscina", acao: "Tratamento de choque + algicida", custo: "R$ 350-500" },
      { tipo: "Rejunte deteriorado", sev: "media", local: "Linha d'agua", acao: "Refazer rejunte impermeavel", custo: "R$ 800-1.200" },
      { tipo: "Nivel de agua baixo", sev: "baixa", local: "~15cm abaixo do ideal", acao: "Completar e verificar vazamento", custo: "R$ 50-200" },
    ],
    acoes: [
      { mod: "OS", desc: "Criar OS de manutencao corretiva - ALTA prioridade" },
      { mod: "ORC", desc: "Gerar orcamento: tratamento + rejunte (~R$1.550)" },
      { mod: "ZAP", desc: "Notificar cliente: problemas + proposta" },
      { mod: "AGENDA", desc: "Agendar visita tecnica em 48h" },
    ],
  };
  return {
    nota: 6, estado: "Em construcao - fase de ferragem",
    rec: "Verificar EPI e confirmar malha com engenheiro.",
    probs: [{ tipo: "Verificar espacamento da malha", sev: "media", local: "Fundo da piscina", acao: "Engenheiro confirmar conformidade", custo: "Incluso" }],
    acoes: [
      { mod: "DIARIO", desc: "Registrar: ferragem 80%" },
      { mod: "ALERTA", desc: "Verificar uso de EPI" },
      { mod: "ETAPA", desc: "Atualizar Ferragem para 80%" },
    ],
  };
}

function getNFData() {
  return {
    numero: "001.234.567", cnpj: "12.345.678/0001-90",
    fornecedor: "PoolTech Equipamentos Ltda", data: "2026-03-10",
    itens: [
      { desc: "Bomba centrifuga 1/2cv", qtd: 1, unit: 1250, total: 1250, cat: "Equipamentos > Bombas" },
      { desc: "Filtro quartzo 19L", qtd: 1, unit: 890, total: 890, cat: "Equipamentos > Filtros" },
      { desc: "Clorador automatico", qtd: 1, unit: 650, total: 650, cat: "Equipamentos > Tratamento" },
      { desc: "Mangueira 38mm (10m)", qtd: 2, unit: 85, total: 170, cat: "Materiais > Hidraulica" },
      { desc: "Kit conexoes PVC", qtd: 1, unit: 120, total: 120, cat: "Materiais > Hidraulica" },
    ],
    total: 3080,
    parcelas: [
      { n: 1, valor: 1026.67, venc: "10/04/2026" },
      { n: 2, valor: 1026.67, venc: "10/05/2026" },
      { n: 3, valor: 1026.66, venc: "10/06/2026" },
    ],
    acoes: [
      { mod: "Estoque", desc: "Dar entrada em 5 itens (EquipamentoCatalogo)" },
      { mod: "Financeiro", desc: "Criar 3 parcelas em ContaPagar" },
      { mod: "ContaAzul", desc: "Sincronizar produtos e lancamentos" },
    ],
  };
}

var sevColors = { alta: C.red, media: C.amber, baixa: C.blue };
var modColors = { OS: C.red, ORC: C.amber, ZAP: C.green, AGENDA: C.blue, DIARIO: C.cyan, ALERTA: C.red, ETAPA: C.purple };

var PIPE_STEPS = [
  "Capturando foto do PWA",
  "Upload para S3",
  "Redimensionando (768x768)",
  "Enviando para Claude Vision",
  "Analise recebida",
  "Validando schema",
  "Acoes automaticas executadas",
];

function PhotoAnalyzer() {
  var canvasRef = useRef(null);
  var [scenario, setScenario] = useState("algae");
  var [analysis, setAnalysis] = useState(null);
  var [loading, setLoading] = useState(false);
  var [pipeStep, setPipeStep] = useState(0);

  useEffect(function() {
    drawPool(canvasRef.current, scenario);
    setAnalysis(null);
    setPipeStep(0);
  }, [scenario]);

  var analyze = useCallback(function() {
    setLoading(true);
    setAnalysis(null);
    setPipeStep(1);
    setTimeout(function() { setPipeStep(2); }, 300);
    setTimeout(function() { setPipeStep(3); }, 700);
    setTimeout(function() { setPipeStep(4); }, 1100);
    setTimeout(function() { setPipeStep(5); }, 1800);
    setTimeout(function() { setPipeStep(6); }, 2200);
    setTimeout(function() {
      setPipeStep(7);
      setAnalysis(getVistoriaData(scenario));
      setLoading(false);
    }, 2600);
  }, [scenario]);

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {[
          { id: "clean", label: "Piscina OK", color: C.green },
          { id: "algae", label: "Com problemas", color: C.red },
          { id: "construction", label: "Obra em andamento", color: C.amber },
        ].map(function(s) {
          return (
            <button key={s.id} onClick={function() { setScenario(s.id); }} style={{
              flex: 1, padding: "8px", borderRadius: "8px", fontSize: "11px",
              fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
              border: "1px solid " + (scenario === s.id ? s.color : C.border),
              background: scenario === s.id ? s.color + "12" : "transparent",
              color: scenario === s.id ? s.color : C.textDim,
            }}>
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ flexShrink: 0 }}>
          <canvas ref={canvasRef} width={340} height={220} style={{
            borderRadius: "10px", border: "2px solid " + C.border, display: "block",
          }} />
          <button onClick={analyze} disabled={loading} style={{
            width: "100%", marginTop: "8px", padding: "10px", borderRadius: "8px", border: "none",
            background: loading ? C.surfaceAlt : C.green,
            color: loading ? C.textDim : "#fff", fontSize: "12px", fontWeight: 700,
            fontFamily: "inherit", cursor: loading ? "default" : "pointer",
          }}>
            {loading ? "Processando..." : "Analisar Foto"}
          </button>
          {pipeStep > 0 && (
            <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "8px", background: C.surfaceAlt, fontSize: "10px" }}>
              {PIPE_STEPS.map(function(s, i) {
                return (
                  <div key={i} style={{
                    color: i < pipeStep ? C.green : C.textDim,
                    opacity: i < pipeStep ? 1 : 0.3,
                    marginBottom: "3px",
                    fontWeight: i === pipeStep - 1 ? 700 : 400,
                  }}>
                    {i < pipeStep ? "\u2713" : "\u25CB"} {s}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "250px" }}>
          {analysis ? (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                marginBottom: "12px", padding: "12px", borderRadius: "8px",
                background: (analysis.nota >= 7 ? C.green : analysis.nota >= 4 ? C.amber : C.red) + "08",
                border: "1px solid " + (analysis.nota >= 7 ? C.green : analysis.nota >= 4 ? C.amber : C.red) + "22",
              }}>
                <div style={{
                  fontSize: "28px", fontWeight: 800,
                  color: analysis.nota >= 7 ? C.green : analysis.nota >= 4 ? C.amber : C.red,
                }}>
                  {analysis.nota}/10
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{analysis.estado}</div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>{analysis.rec}</div>
                </div>
              </div>

              {analysis.probs.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>PROBLEMAS</div>
                  {analysis.probs.map(function(p, i) {
                    return (
                      <div key={i} style={{
                        padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
                        background: C.surfaceAlt, fontSize: "11px",
                        borderLeft: "3px solid " + (sevColors[p.sev] || C.textDim),
                      }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: "2px" }}>{p.tipo}</div>
                        <div style={{ color: C.textMuted, lineHeight: 1.5 }}>
                          {"Local: " + p.local}
                          <br />{"Acao: " + p.acao}
                          <br />{"Custo: "}
                          <span style={{ color: C.amber }}>{p.custo}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {analysis.acoes.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>ACOES AUTOMATICAS</div>
                  {analysis.acoes.map(function(a, i) {
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "6px 10px", borderRadius: "6px", marginBottom: "4px",
                        background: C.surfaceAlt, fontSize: "10px",
                      }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: 800,
                          background: (modColors[a.mod] || C.textDim) + "15",
                          color: modColors[a.mod] || C.textDim,
                        }}>{a.mod}</span>
                        <span style={{ color: C.textMuted }}>{a.desc}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.textDim, fontSize: "12px" }}>
              Selecione um cenario e clique "Analisar Foto"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceExtractor() {
  var canvasRef = useRef(null);
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);

  useEffect(function() { drawNF(canvasRef.current); }, []);

  var extract = useCallback(function() {
    setLoading(true);
    setTimeout(function() { setData(getNFData()); setLoading(false); }, 2000);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ flexShrink: 0 }}>
          <canvas ref={canvasRef} width={340} height={280} style={{
            borderRadius: "10px", border: "2px solid " + C.border, display: "block",
          }} />
          <button onClick={extract} disabled={loading} style={{
            width: "100%", marginTop: "8px", padding: "10px", borderRadius: "8px", border: "none",
            background: loading ? C.surfaceAlt : C.purple,
            color: loading ? C.textDim : "#fff", fontSize: "12px", fontWeight: 700,
            fontFamily: "inherit", cursor: loading ? "default" : "pointer",
          }}>
            {loading ? "Extraindo dados..." : "Extrair Dados da NF"}
          </button>
        </div>

        <div style={{ flex: 1, minWidth: "270px" }}>
          {data ? (
            <div>
              <div style={{
                padding: "12px", borderRadius: "8px", background: C.surfaceAlt,
                marginBottom: "10px", fontSize: "11px", lineHeight: 1.7,
              }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: "4px" }}>Nota Fiscal Eletronica</div>
                <div style={{ color: C.textMuted }}>
                  {"NF: "}<span style={{ color: C.cyan }}>{data.numero}</span>{" | CNPJ: "}<span style={{ color: C.cyan }}>{data.cnpj}</span>
                  <br />{data.fornecedor + " | " + data.data}
                </div>
              </div>

              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid " + C.border, fontSize: "9px", fontWeight: 700, color: C.textDim }}>ITENS EXTRAIDOS</div>
                {data.itens.map(function(item, i) {
                  return (
                    <div key={i} style={{
                      padding: "8px 12px", fontSize: "10px",
                      borderBottom: i < data.itens.length - 1 ? "1px solid " + C.border : "none",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: C.text, fontWeight: 600 }}>{item.desc}</div>
                        <div style={{ color: C.textDim, fontSize: "9px" }}>{item.cat}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ color: C.amber, fontWeight: 700 }}>{"R$ " + item.total.toFixed(2)}</div>
                        <div style={{ color: C.textDim, fontSize: "9px" }}>{item.qtd + "x R$" + item.unit.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: "10px 12px", background: C.surfaceAlt, display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800 }}>
                  <span style={{ color: C.text }}>TOTAL</span>
                  <span style={{ color: C.green }}>{"R$ " + data.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderRadius: "8px", background: C.surfaceAlt, marginBottom: "10px", fontSize: "10px" }}>
                <div style={{ fontWeight: 700, color: C.textMuted, marginBottom: "6px" }}>Pagamento: 30/60/90 dias</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {data.parcelas.map(function(p, i) {
                    return (
                      <div key={i} style={{ flex: 1, padding: "6px", borderRadius: "6px", background: C.bg, textAlign: "center" }}>
                        <div style={{ color: C.textDim, fontSize: "9px" }}>{"Parcela " + p.n}</div>
                        <div style={{ color: C.amber, fontWeight: 700 }}>{"R$" + p.valor.toFixed(2)}</div>
                        <div style={{ color: C.textDim, fontSize: "9px" }}>{p.venc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 700, marginBottom: "6px" }}>ACOES SUGERIDAS</div>
                {data.acoes.map(function(a, i) {
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "6px 10px", borderRadius: "6px", marginBottom: "4px",
                      background: C.surfaceAlt, fontSize: "10px",
                    }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: 800, background: C.cyan + "15", color: C.cyan }}>{a.mod}</span>
                      <span style={{ color: C.textMuted }}>{a.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.textDim, fontSize: "12px" }}>
              Clique em "Extrair Dados da NF" para simular o OCR inteligente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

var ARCH_ITEMS = [
  { title: "Pipeline Multimodal", color: C.orange, text: "PWA (camera) -> S3 (upload existente) -> Backend Express -> aiService.analyzeImage(s3Key, template) -> Busca imagem do S3 -> Redimensiona (sharp) -> base64 -> Claude Vision -> JSON estruturado -> Valida Zod -> Executa acoes (OS, orcamento) -> Prisma (salva) -> Frontend (mostra). Zero mudanca no fluxo de upload existente." },
  { title: "Integracao com modulos existentes", color: C.cyan, text: "Vistoria + Foto: AI identifica problemas -> Cria Tarefa (OS) -> Gera ItemOrcamento -> Envia WhatsApp (Z-API) -> Agenda. NF + Foto: AI extrai itens -> MovimentacaoEstoque -> ContaPagar -> contaAzulService. Diario + Foto: AI descreve progresso -> EtapaObra (%) -> DiarioObra -> Alerta seguranca." },
  { title: "Otimizacoes de custo", color: C.amber, text: "1. Redimensionar no PWA antes do upload (canvas.toDataURL 768x768, economia ~60% tokens). 2. Cache por hash da imagem (SHA256). 3. Processamento assincrono (job queue). 4. Model routing: comprovante -> Haiku, vistoria -> Sonnet, juridico -> Opus. 5. Batch com Promise.allSettled." },
  { title: "Seguranca e LGPD", color: C.red, text: "Fotos podem conter rostos, enderecos, CPF. Mitigacoes: nao logar base64 em producao, TTL curto, DPA com provedor, opt-in do cliente, S3 URLs pre-assinadas (15min). Para NF/contratos: processar e descartar base64, guardar apenas JSON extraido, TLS em transito (ja existe)." },
];

export default function MultimodalLab() {
  var [activeTab, setActiveTab] = useState("vistoria");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            color: C.orange, padding: "4px 10px", borderRadius: "4px",
            background: C.orange + "12", border: "1px solid " + C.orange + "33",
          }}>Cap 2 - Modulo 4</span>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 4px", color: C.text }}>
            Multimodal e Aplicacoes Praticas
          </h1>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
            Visao | OCR inteligente | Foto para analise para acao automatica
          </p>
        </div>

        <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: C.surface, borderRadius: "10px", padding: "3px", border: "1px solid " + C.border }}>
          {[
            { id: "vistoria", label: "Vistoria" },
            { id: "invoice", label: "Nota Fiscal" },
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

        {activeTab === "vistoria" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 6px" }}>Analise de Vistoria por Foto</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Colaborador tira foto no PWA - Claude Vision analisa - identifica problemas - cria OS e orcamento automaticamente.
            </p>
            <PhotoAnalyzer />
          </div>
        )}

        {activeTab === "invoice" && (
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.purple, margin: "0 0 6px" }}>OCR Inteligente de Nota Fiscal</h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Foto/PDF da NF - Claude extrai dados estruturados - itens vao pro estoque, parcelas pro financeiro.
            </p>
            <InvoiceExtractor />
          </div>
        )}

        {activeTab === "arch" && (
          <div>
            {ARCH_ITEMS.map(function(section) {
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
