import { useState, useCallback, useRef, useMemo } from "react";

// ============================================================
// MINI NEURAL NETWORK ENGINE (from scratch, no libraries)
// ============================================================

// Activation functions
const relu = x => Math.max(0, x);
const reluDeriv = x => x > 0 ? 1 : 0;
const sigmoid = x => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));

// Softmax for output layer
function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
}

// Xavier initialization
function xavier(fanIn, fanOut) {
  const limit = Math.sqrt(6 / (fanIn + fanOut));
  return () => (Math.random() * 2 - 1) * limit;
}

function createNetwork(layerSizes) {
  const layers = [];
  for (let i = 0; i < layerSizes.length - 1; i++) {
    const init = xavier(layerSizes[i], layerSizes[i + 1]);
    const weights = [];
    const biases = [];
    for (let j = 0; j < layerSizes[i + 1]; j++) {
      const w = [];
      for (let k = 0; k < layerSizes[i]; k++) {
        w.push(init());
      }
      weights.push(w);
      biases.push(0.01);
    }
    layers.push({ weights, biases });
  }
  return layers;
}

function forward(network, input) {
  const activations = [input];
  const rawOutputs = [input];
  let current = input;

  for (let l = 0; l < network.length; l++) {
    const layer = network[l];
    const isOutput = l === network.length - 1;
    const raw = [];
    const activated = [];

    for (let j = 0; j < layer.weights.length; j++) {
      let sum = layer.biases[j];
      for (let k = 0; k < current.length; k++) {
        sum += layer.weights[j][k] * current[k];
      }
      raw.push(sum);
      activated.push(isOutput ? sum : relu(sum));
    }

    if (isOutput) {
      const sm = softmax(raw);
      rawOutputs.push(raw);
      activations.push(sm);
      current = sm;
    } else {
      rawOutputs.push(raw);
      activations.push(activated);
      current = activated;
    }
  }

  return { activations, rawOutputs, output: current };
}

function crossEntropyLoss(predicted, label) {
  const p = Math.max(1e-10, predicted[label]);
  return -Math.log(p);
}

function trainStep(network, input, label, lr) {
  const { activations, rawOutputs } = forward(network, input);
  const output = activations[activations.length - 1];

  // Output layer gradient (softmax + cross-entropy)
  const outputGrad = output.map((p, i) => p - (i === label ? 1 : 0));

  const gradients = [outputGrad];

  // Backprop through hidden layers
  for (let l = network.length - 2; l >= 0; l--) {
    const nextGrad = gradients[0];
    const nextLayer = network[l + 1];
    const currentRaw = rawOutputs[l + 1];
    const grad = [];

    for (let j = 0; j < network[l].weights.length; j++) {
      let sum = 0;
      for (let k = 0; k < nextLayer.weights.length; k++) {
        sum += nextGrad[k] * nextLayer.weights[k][j];
      }
      grad.push(sum * reluDeriv(currentRaw[j]));
    }
    gradients.unshift(grad);
  }

  // Update weights
  for (let l = 0; l < network.length; l++) {
    const grad = gradients[l];
    const input_l = activations[l];

    for (let j = 0; j < network[l].weights.length; j++) {
      for (let k = 0; k < network[l].weights[j].length; k++) {
        network[l].weights[j][k] -= lr * grad[j] * input_l[k];
      }
      network[l].biases[j] -= lr * grad[j];
    }
  }

  return crossEntropyLoss(output, label);
}

// ============================================================
// DATASET - Iris-inspired flower classification
// ============================================================
function generateFlowerDataset() {
  const rng = (min, max) => min + Math.random() * (max - min);
  const data = [];

  // Setosa (small petals)
  for (let i = 0; i < 35; i++) {
    data.push({
      features: [rng(4.3, 5.8), rng(2.3, 4.4), rng(1.0, 1.9), rng(0.1, 0.6)],
      label: 0, species: "Setosa"
    });
  }
  // Versicolor (medium)
  for (let i = 0; i < 35; i++) {
    data.push({
      features: [rng(4.9, 7.0), rng(2.0, 3.4), rng(3.0, 5.1), rng(1.0, 1.8)],
      label: 1, species: "Versicolor"
    });
  }
  // Virginica (large petals)
  for (let i = 0; i < 35; i++) {
    data.push({
      features: [rng(4.9, 7.9), rng(2.2, 3.8), rng(4.5, 6.9), rng(1.4, 2.5)],
      label: 2, species: "Virginica"
    });
  }

  // Shuffle
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }

  return data;
}

function normalize(data) {
  const nFeats = data[0].features.length;
  const mins = Array(nFeats).fill(Infinity);
  const maxs = Array(nFeats).fill(-Infinity);

  data.forEach(d => {
    d.features.forEach((v, i) => {
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    });
  });

  return data.map(d => ({
    ...d,
    features: d.features.map((v, i) => (maxs[i] - mins[i]) > 0 ? (v - mins[i]) / (maxs[i] - mins[i]) : 0),
    original: d.features,
  }));
}

function splitData(data, trainRatio = 0.7, valRatio = 0.15) {
  const n = data.length;
  const trainEnd = Math.floor(n * trainRatio);
  const valEnd = Math.floor(n * (trainRatio + valRatio));
  return {
    train: data.slice(0, trainEnd),
    val: data.slice(trainEnd, valEnd),
    test: data.slice(valEnd),
  };
}

function evaluate(network, data) {
  let correct = 0;
  let totalLoss = 0;
  data.forEach(d => {
    const { output } = forward(network, d.features);
    const predicted = output.indexOf(Math.max(...output));
    if (predicted === d.label) correct++;
    totalLoss += crossEntropyLoss(output, d.label);
  });
  return {
    accuracy: correct / data.length,
    loss: totalLoss / data.length,
  };
}

// ============================================================
// COLORS
// ============================================================
const C = {
  bg: "#080c12",
  surface: "#0f1420",
  surfaceAlt: "#151c2c",
  border: "#1a2338",
  borderHover: "#283654",
  text: "#e0e7f1",
  textMuted: "#7a8da8",
  textDim: "#48566c",
  green: "#10b981",
  greenBg: "rgba(16,185,129,0.08)",
  red: "#f43f5e",
  redBg: "rgba(244,63,94,0.06)",
  amber: "#f59e0b",
  amberBg: "rgba(245,158,11,0.08)",
  cyan: "#06b6d4",
  cyanBg: "rgba(6,182,212,0.08)",
  purple: "#8b5cf6",
  purpleBg: "rgba(139,92,246,0.08)",
  blue: "#3b82f6",
  blueBg: "rgba(59,130,246,0.08)",
};

const SPECIES_COLORS = [C.cyan, C.amber, C.purple];
const SPECIES_NAMES = ["Setosa", "Versicolor", "Virginica"];
const FEATURE_NAMES = ["Sépala (comp.)", "Sépala (larg.)", "Pétala (comp.)", "Pétala (larg.)"];

// ============================================================
// COMPONENTS
// ============================================================

function MiniChart({ data, color, label, height = 80, width = "100%" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 85 - 5;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ width }}>
      <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "4px", letterSpacing: "0.5px" }}>
        {label}: <span style={{ color, fontWeight: 700 }}>{data[data.length - 1]?.toFixed(4)}</span>
      </div>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height }} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function NetworkViz({ layerSizes, network }) {
  const maxNeurons = Math.max(...layerSizes);
  const w = 280;
  const h = 160;
  const layerSpacing = w / (layerSizes.length + 1);

  const positions = layerSizes.map((size, li) => {
    const x = layerSpacing * (li + 1);
    return Array.from({ length: size }, (_, ni) => {
      const spacing = h / (size + 1);
      return { x, y: spacing * (ni + 1) };
    });
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxHeight: "160px" }}>
      {/* Connections */}
      {positions.slice(0, -1).map((layer, li) =>
        layer.map((from, fi) =>
          positions[li + 1].map((to, ti) => {
            const weight = network?.[li]?.weights?.[ti]?.[fi] || 0;
            const opacity = Math.min(Math.abs(weight) * 0.8, 0.6);
            const color = weight > 0 ? C.cyan : C.red;
            return (
              <line key={`${li}-${fi}-${ti}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={color} strokeWidth="0.5" opacity={opacity + 0.05}
              />
            );
          })
        )
      )}
      {/* Neurons */}
      {positions.map((layer, li) =>
        layer.map((pos, ni) => (
          <g key={`n-${li}-${ni}`}>
            <circle cx={pos.x} cy={pos.y} r={li === 0 || li === layerSizes.length - 1 ? 6 : 5}
              fill={li === 0 ? C.surfaceAlt : li === layerSizes.length - 1 ? SPECIES_COLORS[ni] || C.blue : C.surfaceAlt}
              stroke={li === 0 ? C.cyan : li === layerSizes.length - 1 ? SPECIES_COLORS[ni] || C.blue : C.textDim}
              strokeWidth="1"
            />
          </g>
        ))
      )}
      {/* Labels */}
      <text x={positions[0][0].x} y={h - 2} textAnchor="middle" fontSize="7" fill={C.textDim}>Input(4)</text>
      {positions.slice(1, -1).map((layer, i) => (
        <text key={`hl-${i}`} x={layer[0].x} y={h - 2} textAnchor="middle" fontSize="7" fill={C.textDim}>
          Hidden({layerSizes[i + 1]})
        </text>
      ))}
      <text x={positions[positions.length - 1][0].x} y={h - 2} textAnchor="middle" fontSize="7" fill={C.textDim}>Output(3)</text>
    </svg>
  );
}

function ConfusionMatrix({ network, data }) {
  if (!network || !data || data.length === 0) return null;

  const matrix = [[0,0,0],[0,0,0],[0,0,0]];
  data.forEach(d => {
    const { output } = forward(network, d.features);
    const predicted = output.indexOf(Math.max(...output));
    matrix[d.label][predicted]++;
  });

  return (
    <div>
      <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
        Matriz de Confusão (teste)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "70px repeat(3, 1fr)", gap: "2px", fontSize: "11px" }}>
        <div />
        {SPECIES_NAMES.map((n, i) => (
          <div key={i} style={{ textAlign: "center", color: SPECIES_COLORS[i], fontWeight: 700, fontSize: "9px", padding: "4px" }}>
            {n.slice(0, 4)}
          </div>
        ))}
        {matrix.map((row, ri) => (
          <>
            <div key={`l-${ri}`} style={{ color: SPECIES_COLORS[ri], fontWeight: 700, fontSize: "9px", padding: "4px", textAlign: "right" }}>
              {SPECIES_NAMES[ri].slice(0, 4)}
            </div>
            {row.map((val, ci) => (
              <div key={`${ri}-${ci}`} style={{
                textAlign: "center", padding: "6px",
                background: ri === ci ? `${SPECIES_COLORS[ri]}18` : val > 0 ? C.redBg : "transparent",
                borderRadius: "4px",
                color: ri === ci ? SPECIES_COLORS[ri] : val > 0 ? C.red : C.textDim,
                fontWeight: val > 0 ? 700 : 400,
              }}>
                {val}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function NeuralNetLab() {
  const [activeTab, setActiveTab] = useState("train");
  const [dataset, setDataset] = useState(null);
  const [splits, setSplits] = useState(null);
  const [network, setNetwork] = useState(null);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [trainHistory, setTrainHistory] = useState([]);
  const [valHistory, setValHistory] = useState([]);
  const [trainAcc, setTrainAcc] = useState([]);
  const [valAcc, setValAcc] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [lr, setLr] = useState(0.01);
  const [hiddenSize, setHiddenSize] = useState(8);
  const [hiddenLayers, setHiddenLayers] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [predInputs, setPredInputs] = useState([5.0, 3.0, 1.5, 0.3]);
  const trainingRef = useRef(false);

  const layerSizes = useMemo(() => {
    const sizes = [4];
    for (let i = 0; i < hiddenLayers; i++) sizes.push(hiddenSize);
    sizes.push(3);
    return sizes;
  }, [hiddenSize, hiddenLayers]);

  const initDataset = useCallback(() => {
    const raw = generateFlowerDataset();
    const normalized = normalize(raw);
    const sp = splitData(normalized);
    setDataset(normalized);
    setSplits(sp);
    const net = createNetwork(layerSizes);
    setNetwork(net);
    setEpoch(0);
    setTrainHistory([]);
    setValHistory([]);
    setTrainAcc([]);
    setValAcc([]);
    setTestResult(null);
    setPrediction(null);
    trainingRef.current = false;
    setTraining(false);
  }, [layerSizes]);

  const trainEpoch = useCallback(() => {
    if (!network || !splits) return;

    // Shuffle train data
    const shuffled = [...splits.train].sort(() => Math.random() - 0.5);
    let totalLoss = 0;
    shuffled.forEach(d => {
      totalLoss += trainStep(network, d.features, d.label, lr);
    });

    const tLoss = totalLoss / shuffled.length;
    const vEval = evaluate(network, splits.val);
    const tEval = evaluate(network, splits.train);

    setTrainHistory(prev => [...prev, tLoss]);
    setValHistory(prev => [...prev, vEval.loss]);
    setTrainAcc(prev => [...prev, tEval.accuracy]);
    setValAcc(prev => [...prev, vEval.accuracy]);
    setEpoch(prev => prev + 1);
    setNetwork({ ...network });
  }, [network, splits, lr]);

  const startTraining = useCallback(() => {
    if (!network || !splits) {
      initDataset();
      return;
    }
    trainingRef.current = true;
    setTraining(true);

    let localEpoch = epoch;
    const run = () => {
      if (!trainingRef.current || localEpoch >= 200) {
        trainingRef.current = false;
        setTraining(false);
        return;
      }
      trainEpoch();
      localEpoch++;
      requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [network, splits, epoch, trainEpoch, initDataset]);

  const stopTraining = useCallback(() => {
    trainingRef.current = false;
    setTraining(false);
  }, []);

  const runTest = useCallback(() => {
    if (!network || !splits) return;
    const result = evaluate(network, splits.test);
    setTestResult(result);
  }, [network, splits]);

  const runPrediction = useCallback(() => {
    if (!network || !dataset) return;
    // Normalize prediction inputs using dataset range
    const mins = [4.3, 2.0, 1.0, 0.1];
    const maxs = [7.9, 4.4, 6.9, 2.5];
    const normalized = predInputs.map((v, i) => (maxs[i] - mins[i]) > 0 ? (v - mins[i]) / (maxs[i] - mins[i]) : 0);
    const { output } = forward(network, normalized);
    setPrediction(output);
  }, [network, dataset, predInputs]);

  const overfitWarning = useMemo(() => {
    if (trainAcc.length < 20) return null;
    const recentTrainAcc = trainAcc.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const recentValAcc = valAcc.slice(-10).reduce((a, b) => a + b, 0) / 10;
    if (recentTrainAcc - recentValAcc > 0.15) return true;
    return false;
  }, [trainAcc, valAcc]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: C.green,
            padding: "4px 10px", borderRadius: "4px",
            background: C.greenBg, border: `1px solid ${C.green}33`,
          }}>
            Cap 1 · Módulo 3
          </span>
          <h1 style={{
            fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.2,
            background: `linear-gradient(135deg, ${C.text}, ${C.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Rede Neural do Zero
          </h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
            Classificação de flores · Treino interativo · Sem bibliotecas externas
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "train", label: "Treinar" },
            { id: "predict", label: "Inferência" },
            { id: "data", label: "Dataset" },
            { id: "learn", label: "Conceitos" },
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

        {/* TRAIN TAB */}
        {activeTab === "train" && (
          <div>
            {/* Config */}
            <div style={{
              display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap",
            }}>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "14px 18px", flex: 1, minWidth: "200px",
              }}>
                <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "10px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Hiperparâmetros
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <label style={{ fontSize: "11px", color: C.textMuted }}>
                    Learning Rate
                    <select value={lr} onChange={e => setLr(Number(e.target.value))} style={{
                      display: "block", marginTop: "4px", padding: "6px 10px", borderRadius: "6px",
                      background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text,
                      fontSize: "12px", fontFamily: "inherit",
                    }}>
                      <option value={0.001}>0.001 (lento)</option>
                      <option value={0.005}>0.005</option>
                      <option value={0.01}>0.01 (padrão)</option>
                      <option value={0.05}>0.05 (rápido)</option>
                      <option value={0.1}>0.1 (agressivo)</option>
                    </select>
                  </label>
                  <label style={{ fontSize: "11px", color: C.textMuted }}>
                    Hidden Neurons
                    <select value={hiddenSize} onChange={e => setHiddenSize(Number(e.target.value))} style={{
                      display: "block", marginTop: "4px", padding: "6px 10px", borderRadius: "6px",
                      background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text,
                      fontSize: "12px", fontFamily: "inherit",
                    }}>
                      <option value={4}>4 (simples)</option>
                      <option value={8}>8 (padrão)</option>
                      <option value={16}>16 (complexo)</option>
                      <option value={32}>32 (grande)</option>
                    </select>
                  </label>
                  <label style={{ fontSize: "11px", color: C.textMuted }}>
                    Hidden Layers
                    <select value={hiddenLayers} onChange={e => setHiddenLayers(Number(e.target.value))} style={{
                      display: "block", marginTop: "4px", padding: "6px 10px", borderRadius: "6px",
                      background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text,
                      fontSize: "12px", fontFamily: "inherit",
                    }}>
                      <option value={1}>1 camada</option>
                      <option value={2}>2 camadas</option>
                      <option value={3}>3 camadas</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <button onClick={initDataset} style={{
                padding: "10px 20px", borderRadius: "8px", border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontSize: "12px", fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer",
              }}>
                🔄 Novo Dataset + Reset
              </button>
              {!training ? (
                <button onClick={startTraining} style={{
                  padding: "10px 20px", borderRadius: "8px", border: "none",
                  background: `linear-gradient(135deg, #065f46, ${C.green})`,
                  color: "#fff", fontSize: "12px", fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer",
                }}>
                  ▶ Treinar (até 200 epochs)
                </button>
              ) : (
                <button onClick={stopTraining} style={{
                  padding: "10px 20px", borderRadius: "8px", border: "none",
                  background: `linear-gradient(135deg, #7f1d1d, ${C.red})`,
                  color: "#fff", fontSize: "12px", fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer",
                }}>
                  ⏸ Parar
                </button>
              )}
              <button onClick={() => { if (network && splits) trainEpoch(); }} disabled={!network || training}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: `1px solid ${C.border}`,
                  background: C.surface, color: !network || training ? C.textDim : C.amber,
                  fontSize: "12px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                }}>
                +1 Epoch
              </button>
              <button onClick={runTest} disabled={!network}
                style={{
                  padding: "10px 20px", borderRadius: "8px", border: `1px solid ${C.border}`,
                  background: C.surface, color: !network ? C.textDim : C.purple,
                  fontSize: "12px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                }}>
                🧪 Avaliar Teste
              </button>
            </div>

            {/* Network Viz */}
            {network && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "16px", marginBottom: "16px",
              }}>
                <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Arquitetura: [{layerSizes.join(" → ")}]
                </div>
                <NetworkViz layerSizes={layerSizes} network={network} />
              </div>
            )}

            {/* Metrics */}
            {trainHistory.length > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px",
              }}>
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px",
                }}>
                  <MiniChart data={trainHistory} color={C.green} label="Train Loss" height={70} />
                  <MiniChart data={valHistory} color={C.amber} label="Val Loss" height={70} />
                </div>
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px",
                }}>
                  <MiniChart data={trainAcc} color={C.cyan} label="Train Accuracy" height={70} />
                  <MiniChart data={valAcc} color={C.purple} label="Val Accuracy" height={70} />
                </div>
              </div>
            )}

            {/* Stats row */}
            {epoch > 0 && (
              <div style={{
                display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px",
              }}>
                {[
                  { label: "Epoch", value: epoch, color: C.text },
                  { label: "Train Loss", value: trainHistory[trainHistory.length - 1]?.toFixed(4), color: C.green },
                  { label: "Val Loss", value: valHistory[valHistory.length - 1]?.toFixed(4), color: C.amber },
                  { label: "Train Acc", value: `${(trainAcc[trainAcc.length - 1] * 100).toFixed(1)}%`, color: C.cyan },
                  { label: "Val Acc", value: `${(valAcc[valAcc.length - 1] * 100).toFixed(1)}%`, color: C.purple },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px",
                    padding: "10px 14px", textAlign: "center", minWidth: "90px", flex: 1,
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: C.textDim, marginTop: "2px", letterSpacing: "0.5px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Overfit warning */}
            {overfitWarning && (
              <div style={{
                padding: "12px 16px", borderRadius: "8px",
                background: C.redBg, border: `1px solid ${C.red}22`,
                fontSize: "12px", color: C.red, marginBottom: "16px",
              }}>
                ⚠️ <strong>Possível overfitting detectado!</strong> A acurácia de treino está significativamente acima da validação. O modelo pode estar decorando os dados.
              </div>
            )}

            {/* Test result + confusion */}
            {testResult && (
              <div style={{
                display: "flex", gap: "12px", flexWrap: "wrap",
              }}>
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                  padding: "18px", flex: 1, minWidth: "200px",
                }}>
                  <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "10px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Resultado no Teste
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: testResult.accuracy > 0.9 ? C.green : testResult.accuracy > 0.7 ? C.amber : C.red }}>
                    {(testResult.accuracy * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: "11px", color: C.textMuted }}>
                    Loss: {testResult.loss.toFixed(4)}
                  </div>
                </div>
                <div style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                  padding: "18px", flex: 1, minWidth: "240px",
                }}>
                  <ConfusionMatrix network={network} data={splits?.test || []} />
                </div>
              </div>
            )}

            {!network && (
              <div style={{
                textAlign: "center", padding: "48px 20px",
                color: C.textDim, fontSize: "13px",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>⊛</div>
                Clique em "Novo Dataset + Reset" para gerar dados e inicializar a rede
              </div>
            )}
          </div>
        )}

        {/* PREDICT TAB */}
        {activeTab === "predict" && (
          <div>
            <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "20px", lineHeight: 1.6 }}>
              Use o modelo treinado para classificar uma flor nova. Ajuste as medidas e veja a previsão.
              {!network && <span style={{ color: C.red }}> Treine o modelo primeiro na aba "Treinar".</span>}
            </p>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
              padding: "20px", marginBottom: "16px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {FEATURE_NAMES.map((name, i) => (
                  <label key={i} style={{ fontSize: "11px", color: C.textMuted }}>
                    {name}: <strong style={{ color: C.text }}>{predInputs[i].toFixed(1)} cm</strong>
                    <input
                      type="range"
                      min={i < 2 ? 4 : i === 2 ? 1 : 0.1}
                      max={i < 2 ? 8 : i === 2 ? 7 : 2.5}
                      step="0.1"
                      value={predInputs[i]}
                      onChange={e => {
                        const v = [...predInputs];
                        v[i] = Number(e.target.value);
                        setPredInputs(v);
                      }}
                      style={{ width: "100%", marginTop: "4px", accentColor: C.green }}
                    />
                  </label>
                ))}
              </div>
              <button onClick={runPrediction} disabled={!network} style={{
                marginTop: "16px", padding: "10px 24px", borderRadius: "8px", border: "none",
                background: network ? `linear-gradient(135deg, #065f46, ${C.green})` : C.surfaceAlt,
                color: network ? "#fff" : C.textDim, fontSize: "12px", fontWeight: 700,
                fontFamily: "inherit", cursor: network ? "pointer" : "not-allowed",
              }}>
                Classificar
              </button>
            </div>

            {prediction && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                padding: "20px",
              }}>
                <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Probabilidades (softmax output)
                </div>
                {SPECIES_NAMES.map((name, i) => {
                  const prob = prediction[i];
                  const isMax = prob === Math.max(...prediction);
                  return (
                    <div key={i} style={{ marginBottom: "12px" }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: "4px",
                      }}>
                        <span style={{
                          fontSize: "13px", fontWeight: isMax ? 800 : 400,
                          color: isMax ? SPECIES_COLORS[i] : C.textMuted,
                        }}>
                          {isMax ? "→ " : ""}{name}
                        </span>
                        <span style={{
                          fontSize: "13px", fontWeight: 700,
                          color: isMax ? SPECIES_COLORS[i] : C.textDim,
                        }}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{
                        width: "100%", height: "8px", background: `${C.border}`,
                        borderRadius: "4px", overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${(prob * 100).toFixed(0)}%`, height: "100%",
                          background: isMax ? SPECIES_COLORS[i] : C.textDim,
                          borderRadius: "4px", transition: "width 0.3s",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === "data" && (
          <div>
            <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.6 }}>
              {dataset ? `${dataset.length} amostras geradas e normalizadas.` : "Clique em 'Novo Dataset' na aba Treinar para gerar dados."}
              {splits && ` Split: ${splits.train.length} treino, ${splits.val.length} validação, ${splits.test.length} teste.`}
            </p>
            {splits && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {[
                  { label: "Treino", count: splits.train.length, color: C.green },
                  { label: "Validação", count: splits.val.length, color: C.amber },
                  { label: "Teste", count: splits.test.length, color: C.purple },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px",
                    padding: "12px 18px", textAlign: "center", flex: 1,
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: "10px", color: C.textDim }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {dataset && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px",
                overflow: "hidden", maxHeight: "400px", overflowY: "auto",
              }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "40px repeat(4, 1fr) 80px",
                  gap: "0", fontSize: "10px", position: "sticky", top: 0,
                  background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ padding: "8px", color: C.textDim, fontWeight: 700 }}>#</div>
                  {FEATURE_NAMES.map(n => (
                    <div key={n} style={{ padding: "8px", color: C.textDim, fontWeight: 700 }}>{n}</div>
                  ))}
                  <div style={{ padding: "8px", color: C.textDim, fontWeight: 700 }}>Espécie</div>
                </div>
                {dataset.slice(0, 50).map((d, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "40px repeat(4, 1fr) 80px",
                    fontSize: "11px", borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{ padding: "6px 8px", color: C.textDim }}>{i + 1}</div>
                    {d.features.map((f, fi) => (
                      <div key={fi} style={{ padding: "6px 8px", color: C.textMuted }}>
                        {f.toFixed(3)}
                      </div>
                    ))}
                    <div style={{ padding: "6px 8px", color: SPECIES_COLORS[d.label], fontWeight: 600 }}>
                      {d.species}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEARN TAB */}
        {activeTab === "learn" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "O Ciclo de Treino",
                color: C.green,
                content: `1. Forward Pass — dados entram, passam pelas camadas, geram previsão.
2. Loss — comparamos previsão com a resposta correta (cross-entropy).
3. Backpropagation — calculamos quanto cada peso contribuiu pro erro.
4. Otimização — ajustamos os pesos na direção que reduz o erro.
5. Repetir por N epochs até convergir.

Cada epoch processa TODO o dataset de treino uma vez.`
              },
              {
                title: "Overfitting — o inimigo silencioso",
                color: C.red,
                content: `Quando a loss de treino cai mas a de validação sobe, o modelo está decorando os dados em vez de aprender padrões generalizáveis.

Experimente no lab: use 32 neurons + 3 hidden layers + learning rate 0.05. Observe o gap entre train e val accuracy crescer — isso é overfitting.

Depois tente 4 neurons + 1 hidden layer. Menos capacidade = menos overfitting, mas talvez underfitting (modelo simples demais).`
              },
              {
                title: "Hiperparâmetros — o que você controla",
                color: C.amber,
                content: `Learning Rate — quão rápido os pesos mudam. Alto = instável. Baixo = lento.
Hidden Neurons — capacidade do modelo. Mais = mais complexo.
Hidden Layers — profundidade. Mais camadas = padrões mais abstratos.
Epochs — quantas vezes o modelo vê os dados. Mais = risco de overfit.

Não existe configuração universal. O segredo é experimentar e medir.`
              },
              {
                title: "Train / Validation / Test — por quê três?",
                color: C.purple,
                content: `Train (70%) — usado pra ajustar os pesos. O modelo vê esses dados.
Validation (15%) — monitora overfitting DURANTE o treino. Não ajusta pesos.
Test (15%) — avaliação FINAL. Usado uma única vez. Simula dados novos.

Se você usar o teste pra ajustar hiperparâmetros, ele vira validação e você perde a avaliação imparcial.`
              },
              {
                title: "Inferência — o modelo em produção",
                color: C.cyan,
                content: `Depois de treinar, os pesos ficam fixos. Inferência é um único forward pass — rápido e barato.

Na aba "Inferência" você faz exatamente isso: ajusta features de uma flor e vê as probabilidades. O modelo não está aprendendo — está aplicando o que já aprendeu.

Em produção real, inferência pode rodar no browser (TensorFlow.js), no celular (Core ML, ONNX) ou em servidores (GPU inference endpoints).`
              },
            ].map(section => (
              <div key={section.title} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "20px", marginBottom: "12px",
              }}>
                <h3 style={{
                  fontSize: "14px", fontWeight: 700, color: section.color,
                  margin: "0 0 10px",
                }}>
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
