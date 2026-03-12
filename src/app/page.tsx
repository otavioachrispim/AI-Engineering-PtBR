import Link from "next/link";
import { CHAPTERS, CAPSTONE, getTotalModules, getTotalLabs } from "@/lib/chapters";

export default function Home() {
  const totalModules = getTotalModules();
  const totalLabs = getTotalLabs();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060911",
        color: "#e0e8f5",
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "3px",
              color: "#f59e0b",
              padding: "4px 12px",
              borderRadius: "4px",
              background: "#f59e0b12",
              border: "1px solid #f59e0b33",
              display: "inline-block",
              marginBottom: "16px",
            }}
          >
            CURSO COMPLETO
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            AI Engineering
          </h1>
          <p style={{ fontSize: "16px", color: "#7589a8", margin: "0 0 20px" }}>
            Do Conceito à Produção
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "24px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#22d3ee" }}>
              <strong>{CHAPTERS.length + 1}</strong> capítulos
            </span>
            <span style={{ color: "#22c55e" }}>
              <strong>{totalModules}</strong> módulos
            </span>
            <span style={{ color: "#8b5cf6" }}>
              <strong>{totalLabs}</strong> laboratórios
            </span>
          </div>
        </div>

        {/* Chapters Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {CHAPTERS.map((ch) => (
            <Link
              key={ch.num}
              href={`/capitulo/${ch.num}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "#0c1119",
                  border: `1px solid ${ch.color}22`,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: `${ch.color}20`,
                    border: `2px solid ${ch.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: ch.color,
                    flexShrink: 0,
                  }}
                >
                  {ch.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: ch.color,
                    }}
                  >
                    {ch.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#3d506b" }}>
                    {ch.subtitle}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#3d506b",
                    textAlign: "right",
                  }}
                >
                  {ch.modules.length} módulos
                  <br />
                  {ch.modules.length + (ch.integrator ? 1 : 0)} labs
                </div>
              </div>
            </Link>
          ))}

          {/* Capstone */}
          <Link
            href="/capstone"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 20px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, #2563eb12, #8b5cf612, #22d3ee12)",
                border: "1px solid #f59e0b33",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#f59e0b20",
                  border: "2px solid #f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#f59e0b",
                  flexShrink: 0,
                }}
              >
                11
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#f59e0b",
                  }}
                >
                  Capstone: {CAPSTONE.title}
                </div>
                <div style={{ fontSize: "11px", color: "#3d506b" }}>
                  O sistema completo em um único painel
                </div>
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "4px",
                  background: "#f59e0b15",
                  color: "#f59e0b",
                }}
              >
                PROJETO FINAL
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            fontSize: "11px",
            color: "#3d506b",
            lineHeight: 1.8,
          }}
        >
          Projeto aplicado: Costa Lima Piscinas — ERP real
          <br />
          Node.js / Express / Prisma / PostgreSQL / Next.js / PWA / AWS S3
        </div>
      </div>
    </div>
  );
}
