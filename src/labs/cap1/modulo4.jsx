import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// COLORS
// ============================================================
const C = {
  bg: "#06090f",
  surface: "#0d1219",
  surfaceAlt: "#131b28",
  border: "#182035",
  text: "#dfe8f5",
  textMuted: "#738096",
  textDim: "#3e4d64",
  orange: "#f97316",
  orangeBg: "rgba(249,115,22,0.08)",
  cyan: "#22d3ee",
  green: "#10b981",
  purple: "#a78bfa",
  red: "#ef4444",
  amber: "#fbbf24",
  blue: "#60a5fa",
};

// ============================================================
// EXPERIMENT 1: DRAWING CLASSIFIER
// Simple CNN-like classifier trained on basic shapes
// ============================================================

function extractFeatures(imageData, w, h) {
  const data = imageData;
  const cellsX = 4, cellsY = 4;
  const cellW = Math.floor(w / cellsX);
  const cellH = Math.floor(h / cellsY);
  const features = [];

  // Grid density features
  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      let count = 0;
      let total = 0;
      for (let y = cy * cellH; y < (cy + 1) * cellH; y++) {
        for (let x = cx * cellW; x < (cx + 1) * cellW; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 3] > 50) count++;
          total++;
        }
      }
      features.push(count / total);
    }
  }

  // Aspect ratio of bounding box
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let totalPixels = 0;
  let sumX = 0, sumY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 50) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        totalPixels++;
        sumX += x;
        sumY += y;
      }
    }
  }

  const bw = maxX - minX + 1 || 1;
  const bh = maxY - minY + 1 || 1;
  features.push(bw / bh); // aspect ratio
  features.push(totalPixels / (w * h)); // fill ratio
  features.push(totalPixels / (bw * bh)); // bounding box fill
  features.push(sumX / (totalPixels || 1) / w); // center x
  features.push(sumY / (totalPixels || 1) / h); // center y

  // Edge detection - count transitions
  let edges = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const curr = data[idx + 3] > 50 ? 1 : 0;
      const right = data[(y * w + x + 1) * 4 + 3] > 50 ? 1 : 0;
      const down = data[((y + 1) * w + x) * 4 + 3] > 50 ? 1 : 0;
      if (curr !== right) edges++;
      if (curr !== down) edges++;
    }
  }
  features.push(edges / (w * h));

  // Symmetry (horizontal)
  let symMatch = 0, symTotal = 0;
  const cx = Math.floor(w / 2);
  for (let y = 0; y < h; y++) {
    for (let dx = 0; dx < cx; dx++) {
      const left = data[(y * w + (cx - dx)) * 4 + 3] > 50 ? 1 : 0;
      const right = data[(y * w + (cx + dx)) * 4 + 3] > 50 ? 1 : 0;
      if (left === right) symMatch++;
      symTotal++;
    }
  }
  features.push(symMatch / (symTotal || 1));

  return features;
}

const SHAPES = [
  { name: "Círculo", color: C.cyan, hint: "Desenhe uma forma redonda" },
  { name: "Quadrado", color: C.orange, hint: "Desenhe um quadrado ou retângulo" },
  { name: "Triângulo", color: C.purple, hint: "Desenhe um triângulo" },
  { name: "Linha", color: C.green, hint: "Desenhe uma linha reta" },
  { name: "X", color: C.red, hint: "Desenhe um X" },
];

function classifyDrawing(features) {
  const [g0,g1,g2,g3,g4,g5,g6,g7,g8,g9,g10,g11,g12,g13,g14,g15,
    aspectRatio, fillRatio, bboxFill, centerX, centerY, edgeRatio, symmetry] = features;

  const scores = [0, 0, 0, 0, 0]; // circle, square, triangle, line, X

  // Circle: high symmetry, bbox fill ~0.78 (pi/4), aspect ratio ~1
  scores[0] += symmetry * 2;
  scores[0] += (1 - Math.abs(aspectRatio - 1)) * 1.5;
  scores[0] += (bboxFill > 0.4 && bboxFill < 0.9) ? 1.5 : 0;
  scores[0] += (edgeRatio > 0.02 && edgeRatio < 0.12) ? 1 : 0;

  // Square: high symmetry, high bbox fill, aspect ratio ~1
  scores[1] += (bboxFill > 0.6) ? 2 : 0;
  scores[1] += (1 - Math.abs(aspectRatio - 1)) * 1;
  scores[1] += symmetry * 1;
  scores[1] += (edgeRatio > 0.03 && edgeRatio < 0.15) ? 1 : 0;

  // Triangle: lower bbox fill, moderate symmetry
  scores[2] += (bboxFill > 0.2 && bboxFill < 0.65) ? 2 : 0;
  scores[2] += (centerY > 0.45) ? 1 : 0; // center of mass lower
  const topDensity = (g0 + g1 + g2 + g3) / 4;
  const bottomDensity = (g12 + g13 + g14 + g15) / 4;
  scores[2] += (bottomDensity > topDensity * 1.3) ? 1.5 : 0;

  // Line: very low bbox fill OR extreme aspect ratio
  scores[3] += (aspectRatio > 2.5 || aspectRatio < 0.4) ? 3 : 0;
  scores[3] += (bboxFill < 0.3) ? 1.5 : 0;
  scores[3] += (fillRatio < 0.1) ? 1.5 : 0;

  // X: moderate fill, high edge ratio, spread across grid
  const cornerDensity = (g0 + g3 + g12 + g15) / 4;
  const centerDensity = (g5 + g6 + g9 + g10) / 4;
  scores[4] += (cornerDensity > 0.05 && centerDensity > 0.05) ? 2 : 0;
  scores[4] += (edgeRatio > 0.06) ? 1.5 : 0;
  scores[4] += (bboxFill > 0.15 && bboxFill < 0.55) ? 1 : 0;

  // Softmax
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function DrawingClassifier() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [featureViz, setFeatureViz] = useState(null);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (200 / rect.width),
      y: (touch.clientY - rect.top) * (200 / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const endDraw = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    classify();
  };

  const classify = () => {
    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(0, 0, 200, 200);
    const features = extractFeatures(imgData.data, 200, 200);
    const probs = classifyDrawing(features);
    setPrediction(probs);
    setFeatureViz({
      aspectRatio: features[16],
      fillRatio: features[17],
      bboxFill: features[18],
      edgeRatio: features[21],
      symmetry: features[22],
    });
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, 200, 200);
    setPrediction(null);
    setFeatureViz(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            style={{
              background: C.surfaceAlt,
              borderRadius: "12px",
              border: `2px solid ${C.border}`,
              cursor: "crosshair",
              touchAction: "none",
              display: "block",
              width: "200px",
              height: "200px",
            }}
          />
          <button onClick={clear} style={{
            marginTop: "8px", width: "100%", padding: "8px",
            borderRadius: "8px", border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMuted, fontSize: "11px",
            fontFamily: "inherit", cursor: "pointer",
          }}>
            Limpar
          </button>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          {prediction ? (
            <>
              {SHAPES.map((shape, i) => {
                const prob = prediction[i];
                const isMax = prob === Math.max(...prediction);
                return (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", fontSize: "12px",
                      marginBottom: "3px",
                    }}>
                      <span style={{ color: isMax ? shape.color : C.textMuted, fontWeight: isMax ? 800 : 400 }}>
                        {isMax ? "→ " : ""}{shape.name}
                      </span>
                      <span style={{ color: isMax ? shape.color : C.textDim, fontWeight: 700 }}>
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      height: "6px", background: C.border, borderRadius: "3px", overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${(prob * 100).toFixed(0)}%`, height: "100%",
                        background: isMax ? shape.color : C.textDim,
                        borderRadius: "3px", transition: "width 0.3s",
                      }} />
                    </div>
                  </div>
                );
              })}

              {featureViz && (
                <div style={{
                  marginTop: "14px", padding: "10px 12px", borderRadius: "8px",
                  background: C.surfaceAlt, fontSize: "10px", color: C.textDim,
                  lineHeight: 1.8,
                }}>
                  <span style={{ fontWeight: 700, color: C.textMuted }}>Features extraídas:</span><br />
                  Aspect Ratio: {featureViz.aspectRatio.toFixed(2)} · 
                  Fill: {(featureViz.fillRatio * 100).toFixed(1)}% · 
                  BBox Fill: {(featureViz.bboxFill * 100).toFixed(1)}%<br />
                  Edges: {(featureViz.edgeRatio * 100).toFixed(2)}% · 
                  Simetria: {(featureViz.symmetry * 100).toFixed(1)}%
                </div>
              )}
            </>
          ) : (
            <div style={{ color: C.textDim, fontSize: "12px", lineHeight: 1.8, padding: "8px 0" }}>
              {SHAPES.map((s, i) => (
                <div key={i} style={{ marginBottom: "4px" }}>
                  <span style={{ color: s.color, fontWeight: 700 }}>●</span> {s.name}: {s.hint}
                </div>
              ))}
              <div style={{ marginTop: "12px", color: C.textDim, fontSize: "11px", fontStyle: "italic" }}>
                Desenhe algo no canvas ao lado →
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EXPERIMENT 2: COLOR DETECTOR
// Simulates real-time color detection from a "captured" image
// ============================================================

function ColorDetector() {
  const canvasRef = useRef(null);
  const [analysis, setAnalysis] = useState(null);
  const [hoveredColor, setHoveredColor] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Generate a colorful test scene
    const w = 320, h = 200;
    
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, "#1a1a4e");
    skyGrad.addColorStop(1, "#4a6fa5");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    groundGrad.addColorStop(0, "#2d5a1e");
    groundGrad.addColorStop(1, "#1a3d12");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.6, w, h);

    // Sun
    ctx.beginPath();
    ctx.arc(260, 50, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();

    // Buildings
    const buildColors = ["#3a3a5c", "#4a4a6c", "#2a2a4c", "#5a3a3a"];
    for (let i = 0; i < 6; i++) {
      const bx = i * 55 + 5;
      const bh = 40 + Math.random() * 60;
      ctx.fillStyle = buildColors[i % buildColors.length];
      ctx.fillRect(bx, h * 0.6 - bh, 48, bh);
      // Windows
      ctx.fillStyle = Math.random() > 0.3 ? "#ffeebb" : "#333";
      for (let wy = 0; wy < bh - 10; wy += 14) {
        for (let wx = 8; wx < 40; wx += 14) {
          ctx.fillStyle = Math.random() > 0.4 ? "#ffeebb" : "#2a2a3c";
          ctx.fillRect(bx + wx, h * 0.6 - bh + 8 + wy, 8, 8);
        }
      }
    }

    // Trees
    for (let i = 0; i < 3; i++) {
      const tx = 40 + i * 120;
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(tx, h * 0.6 - 15, 6, 20);
      ctx.beginPath();
      ctx.arc(tx + 3, h * 0.6 - 22, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#1a5a1a";
      ctx.fill();
    }

    // Analyze the image
    analyzeImage(ctx, w, h);
  }, []);

  const analyzeImage = (ctx, w, h) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const colorBuckets = {};
    const step = 4; // Sample every 4th pixel for speed

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;
      colorBuckets[key] = (colorBuckets[key] || 0) + 1;
    }

    const sorted = Object.entries(colorBuckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    
    const total = sorted.reduce((s, [, c]) => s + c, 0);
    
    const dominantColors = sorted.map(([key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      let name = getColorName(r, g, b);
      return {
        rgb: `rgb(${r},${g},${b})`,
        hex: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
        percentage: ((count / total) * 100).toFixed(1),
        name,
      };
    });

    // Scene classification based on dominant colors
    const avgBrightness = sorted.reduce((s, [key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return s + ((r + g + b) / 3) * count;
    }, 0) / total;

    const greenAmount = sorted.reduce((s, [key, count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return s + (g > r && g > b ? count : 0);
    }, 0) / total;

    const scene = avgBrightness < 80 ? "Cena noturna/escura"
      : avgBrightness < 150 ? "Cena com iluminação moderada"
      : "Cena clara/diurna";

    setAnalysis({ dominantColors, scene, avgBrightness: avgBrightness.toFixed(0), greenRatio: (greenAmount * 100).toFixed(1) });
  };

  const getColorName = (r, g, b) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    
    if (brightness < 40) return "Preto";
    if (brightness > 220 && max - min < 30) return "Branco";
    if (max - min < 30) return brightness < 128 ? "Cinza escuro" : "Cinza claro";
    if (r > g && r > b) return g > 150 ? "Amarelo" : "Vermelho";
    if (g > r && g > b) return "Verde";
    if (b > r && b > g) return r > 100 ? "Roxo" : "Azul";
    if (r > 200 && g > 150) return "Amarelo/Dourado";
    return "Misto";
  };

  const handleHover = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (320 / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (200 / rect.height));
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setHoveredColor({
      rgb: `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`,
      hex: `#${pixel[0].toString(16).padStart(2,"0")}${pixel[1].toString(16).padStart(2,"0")}${pixel[2].toString(16).padStart(2,"0")}`,
      x, y,
    });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            onMouseMove={handleHover}
            onMouseLeave={() => setHoveredColor(null)}
            style={{
              borderRadius: "12px",
              border: `2px solid ${C.border}`,
              display: "block",
              width: "320px",
              height: "200px",
              cursor: "crosshair",
            }}
          />
          {hoveredColor && (
            <div style={{
              marginTop: "8px", display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px", borderRadius: "8px", background: C.surfaceAlt,
              fontSize: "11px", color: C.textMuted,
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "4px",
                background: hoveredColor.rgb, border: `1px solid ${C.border}`,
                flexShrink: 0,
              }} />
              <span>{hoveredColor.hex}</span>
              <span style={{ color: C.textDim }}>({hoveredColor.x}, {hoveredColor.y})</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          {analysis && (
            <>
              <div style={{
                padding: "10px 14px", borderRadius: "8px", background: C.surfaceAlt,
                fontSize: "11px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.7,
              }}>
                <span style={{ fontWeight: 700, color: C.text }}>Classificação da cena:</span> {analysis.scene}<br />
                <span style={{ fontWeight: 700, color: C.text }}>Brilho médio:</span> {analysis.avgBrightness}/255<br />
                <span style={{ fontWeight: 700, color: C.text }}>Presença de verde:</span> {analysis.greenRatio}%
              </div>

              <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700 }}>
                Cores dominantes
              </div>
              {analysis.dominantColors.map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "6px", fontSize: "11px",
                }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "3px",
                    background: c.rgb, border: `1px solid ${C.border}`, flexShrink: 0,
                  }} />
                  <span style={{ color: C.textMuted, width: "70px" }}>{c.name}</span>
                  <span style={{ color: C.textDim, fontSize: "10px" }}>{c.hex}</span>
                  <span style={{ color: C.textMuted, marginLeft: "auto", fontWeight: 700 }}>{c.percentage}%</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EXPERIMENT 3: INTERACTIVE PARTICLE TRACKING
// Simulates pose/motion tracking with reactive particles
// ============================================================

function ParticleTracker() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);
  const [stats, setStats] = useState({ fps: 0, particles: 0, avgDist: 0 });
  const [mode, setMode] = useState("attract");
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  const W = 400, H = 250;

  useEffect(() => {
    // Initialize particles
    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 2 + Math.random() * 3,
        hue: Math.random() * 60 + 170, // cyan-blue range
      });
    }
    particlesRef.current = particles;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      ctx.fillStyle = "rgba(6, 9, 15, 0.15)";
      ctx.fillRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;
      let totalDist = 0;

      particles.forEach(p => {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        totalDist += dist;

        const force = Math.min(5, 80 / (dist + 1));

        if (mode === "attract") {
          p.vx += (dx / dist) * force * 0.03;
          p.vy += (dy / dist) * force * 0.03;
        } else if (mode === "repel") {
          p.vx -= (dx / dist) * force * 0.05;
          p.vy -= (dy / dist) * force * 0.05;
        } else {
          // orbit
          p.vx += (-dy / dist) * force * 0.02;
          p.vy += (dx / dist) * force * 0.02;
        }

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
        if (p.x > W) { p.x = W; p.vx *= -0.5; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
        if (p.y > H) { p.y = H; p.vy *= -0.5; }

        // Color based on distance
        const proximity = Math.min(1, dist / 150);
        const hue = mode === "attract" ? 170 + proximity * 40
          : mode === "repel" ? 0 + proximity * 30
          : 260 + proximity * 60;
        const alpha = 0.4 + (1 - proximity) * 0.6;
        const size = p.size * (1 + (1 - proximity) * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
        ctx.fill();

        // Connection lines to nearby particles
        particles.forEach(other => {
          if (other === p) return;
          const d = Math.sqrt((p.x - other.x) ** 2 + (p.y - other.y) ** 2);
          if (d < 40) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(${hue}, 60%, 50%, ${0.15 * (1 - d / 40)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // FPS counter
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current > 500) {
        const fps = Math.round(frameCountRef.current / ((now - lastTimeRef.current) / 1000));
        setStats({
          fps,
          particles: particles.length,
          avgDist: Math.round(totalDist / particles.length),
        });
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // Mouse indicator
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [mode]);

  const handleMouse = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onMouseMove={handleMouse}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = canvasRef.current.getBoundingClientRect();
          mouseRef.current = {
            x: (touch.clientX - rect.left) * (W / rect.width),
            y: (touch.clientY - rect.top) * (H / rect.height),
          };
        }}
        style={{
          width: "100%",
          maxWidth: "500px",
          borderRadius: "12px",
          border: `2px solid ${C.border}`,
          display: "block",
          cursor: "none",
          touchAction: "none",
        }}
      />
      <div style={{
        display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap",
        alignItems: "center",
      }}>
        {[
          { id: "attract", label: "Atrair", color: C.cyan },
          { id: "repel", label: "Repelir", color: C.red },
          { id: "orbit", label: "Orbitar", color: C.purple },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: "6px 14px", borderRadius: "6px", fontSize: "11px",
            fontFamily: "inherit", cursor: "pointer",
            border: mode === m.id ? `1px solid ${m.color}` : `1px solid ${C.border}`,
            background: mode === m.id ? `${m.color}18` : "transparent",
            color: mode === m.id ? m.color : C.textDim,
            fontWeight: 600,
          }}>
            {m.label}
          </button>
        ))}
        <div style={{
          marginLeft: "auto", fontSize: "10px", color: C.textDim,
          display: "flex", gap: "12px",
        }}>
          <span><span style={{ color: C.green, fontWeight: 700 }}>{stats.fps}</span> FPS</span>
          <span><span style={{ color: C.cyan, fontWeight: 700 }}>{stats.particles}</span> partículas</span>
          <span>dist média: <span style={{ color: C.amber, fontWeight: 700 }}>{stats.avgDist}px</span></span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function WebMLLab() {
  const [activeTab, setActiveTab] = useState("draw");

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <div style={{ maxWidth: "660px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: C.orange,
            padding: "4px 10px", borderRadius: "4px",
            background: C.orangeBg, border: `1px solid ${C.orange}33`,
          }}>
            Cap 1 · Módulo 4
          </span>
          <h1 style={{
            fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px",
            margin: "10px 0 4px", lineHeight: 1.2,
            background: `linear-gradient(135deg, ${C.text}, ${C.orange})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            IA no Browser
          </h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
            Visão computacional e ML rodando 100% no cliente
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", marginBottom: "20px",
          background: C.surface, borderRadius: "10px", padding: "3px",
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: "draw", label: "✏️ Classificador" },
            { id: "color", label: "🎨 Cor & Cena" },
            { id: "track", label: "✨ Tracking" },
            { id: "learn", label: "📖 Conceitos" },
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

        {/* DRAW TAB */}
        {activeTab === "draw" && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.cyan, margin: "0 0 6px" }}>
              Classificador de Desenhos
            </h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Desenhe uma forma no canvas. O classificador extrai features geométricas (aspect ratio, simetria, 
              densidade por região, edges) e classifica usando regras ponderadas — similar a como feature 
              engineering funcionava antes de deep learning.
            </p>
            <DrawingClassifier />
            <div style={{
              marginTop: "16px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "11px", color: C.textDim, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Pipeline:</span> Canvas → getImageData() → 
              extração de features (grid 4×4, bounding box, edges, simetria) → classificador por scores ponderados → 
              softmax → probabilidades por classe.
              <br /><br />
              <span style={{ color: C.amber, fontWeight: 700 }}>Lição:</span> Este classificador usa features 
              engenheiradas manualmente. Um modelo CNN faria a extração de features automaticamente, 
              aprendendo os filtros ideais durante o treino. A vantagem aqui: você entende exatamente o que o modelo 
              "olha" — transparência total.
            </div>
          </div>
        )}

        {/* COLOR TAB */}
        {activeTab === "color" && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: "0 0 6px" }}>
              Detecção de Cores e Classificação de Cena
            </h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              Análise de uma cena gerada proceduralmente. Extrai cores dominantes, classifica a cena por 
              brilho, e mostra a cor de cada pixel ao passar o mouse — o mesmo pipeline usado em 
              processamento de imagem real.
            </p>
            <ColorDetector />
            <div style={{
              marginTop: "16px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "11px", color: C.textDim, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Pipeline:</span> Canvas → getImageData() → 
              quantização de cores (agrupamento em buckets RGB) → ordenação por frequência → 
              classificação de cena por brilho médio + proporção de cor.
              <br /><br />
              <span style={{ color: C.amber, fontWeight: 700 }}>Em produção:</span> esse mesmo pipeline com 
              imagens reais de câmera alimenta sistemas de detecção de objetos, análise de sentimento visual, 
              controle de qualidade industrial e filtros de redes sociais.
            </div>
          </div>
        )}

        {/* TRACK TAB */}
        {activeTab === "track" && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.purple, margin: "0 0 6px" }}>
              Sistema de Partículas Reativas
            </h3>
            <p style={{ fontSize: "11px", color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
              120 partículas reagem à posição do mouse usando física simulada. 
              Demonstra o loop de tracking em tempo real: captura posição → calcula forças → atualiza estado → renderiza. 
              O mesmo padrão usado em pose tracking e gesture recognition.
            </p>
            <ParticleTracker />
            <div style={{
              marginTop: "16px", padding: "12px 14px", borderRadius: "8px",
              background: C.surfaceAlt, fontSize: "11px", color: C.textDim, lineHeight: 1.7,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>Pipeline:</span> Input (mouse/touch) → 
              cálculo de forças por partícula → atualização de velocidade/posição → detecção de colisões → 
              renderização com Canvas 2D → loop a 60 FPS via requestAnimationFrame.
              <br /><br />
              <span style={{ color: C.amber, fontWeight: 700 }}>Analogia real:</span> em pose tracking (MediaPipe), 
              o "mouse" são os 33 keypoints do corpo. Cada keypoint gera forças que atualizam um esqueleto virtual. 
              O frame budget é o mesmo: ~16ms pra captura + inferência + renderização.
            </div>
          </div>
        )}

        {/* LEARN TAB */}
        {activeTab === "learn" && (
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.8 }}>
            {[
              {
                title: "O Pipeline de Visão no Browser",
                color: C.cyan,
                content: `Câmera/Canvas → getImageData() → Tensor/Array → Modelo → Pós-processamento → Renderização

Cada etapa tem custo. O frame budget é 16ms (60 FPS) ou 33ms (30 FPS). Se uma inferência leva 50ms, você precisa pular frames ou reduzir resolução.

APIs chave: getUserMedia (câmera), Canvas 2D/WebGL (renderização), WebGL/WebGPU (aceleração de modelo).`
              },
              {
                title: "Browser vs Servidor — Trade-offs",
                color: C.orange,
                content: `Browser: latência zero, privacidade, custo zero de infra, funciona offline.
Mas: modelos pequenos (<50MB), hardware variável, sem CUDA.

Servidor: modelos grandes, GPU dedicada, consistência.
Mas: latência de rede, custo por inferência, dados saem do dispositivo.

Regra: se a experiência é interativa e o modelo cabe no browser → cliente.
Se precisa de modelo grande ou precisão crítica → servidor.`
              },
              {
                title: "Feature Engineering vs Deep Learning",
                color: C.green,
                content: `No classificador de desenhos, nós escolhemos as features manualmente: simetria, aspect ratio, densidade por região. Isso é feature engineering.

Com deep learning (CNN), a rede aprende as features sozinha a partir dos dados. Os filtros convolucionais descobrem edges, texturas e formas automaticamente.

Feature engineering dá mais controle e transparência.
Deep learning dá mais precisão e escala.

Em muitos problemas reais, a combinação vence: features manuais + modelo ML.`
              },
              {
                title: "Performance em Tempo Real",
                color: C.red,
                content: `O sistema de partículas mostra o desafio central: manter 60 FPS enquanto processa.

Estratégias que funcionam em produção:
- requestAnimationFrame em vez de setInterval
- Web Workers para inferência em thread separada
- Offscreen Canvas para renderização paralela
- Skip frames: processar a cada 2-3 frames, interpolar
- Quantização de modelos: int8 em vez de float32
- WebGPU (quando disponível): 10-50x mais rápido que WebGL`
              },
              {
                title: "Aplicações Reais",
                color: C.purple,
                content: `Filtros de câmera (Instagram, Snapchat) → segmentação + tracking + overlay
Background blur (Google Meet, Zoom) → BodyPix / Selfie Segmentation
OCR no celular (Google Lens) → detecção de texto + reconhecimento
Fitness apps → pose estimation com MediaPipe BlazePose
Jogos AR → detecção de superfícies + tracking de objetos
Acessibilidade → descrição de imagens, leitura de texto, detecção de objetos

Todas rodam inferência no dispositivo. Todas usam o mesmo pipeline: captura → modelo → renderização.`
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
