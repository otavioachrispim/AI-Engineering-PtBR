import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAPTERS, getChapter } from "@/lib/chapters";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ num: String(c.num) }));
}

export default function ChapterPage({ params }: { params: { num: string } }) {
  const chapter = getChapter(parseInt(params.num));
  if (!chapter) return notFound();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060911",
        color: "#e0e8f5",
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}>
        {/* Back */}
        <Link
          href="/"
          style={{
            fontSize: "11px",
            color: "#3d506b",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          ← Voltar ao índice
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: chapter.color,
              padding: "4px 10px",
              borderRadius: "4px",
              background: `${chapter.color}12`,
              border: `1px solid ${chapter.color}33`,
              display: "inline-block",
            }}
          >
            CAPÍTULO {chapter.num}
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              margin: "12px 0 4px",
              color: "#e0e8f5",
            }}
          >
            {chapter.title}
          </h1>
          <p style={{ fontSize: "13px", color: "#7589a8", margin: 0 }}>
            {chapter.subtitle}
          </p>
        </div>

        {/* Modules */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              color: "#3d506b",
              fontWeight: 700,
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            MÓDULOS
          </div>
          {chapter.modules.map((mod) => (
            <Link
              key={mod.num}
              href={`/capitulo/${chapter.num}/lab/${mod.num}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "#0c1119",
                  border: "1px solid #1a2540",
                  marginBottom: "6px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `${chapter.color}15`,
                    border: `1px solid ${chapter.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: chapter.color,
                    flexShrink: 0,
                  }}
                >
                  {mod.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#e0e8f5" }}>
                    {mod.title}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#22c55e",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "#22c55e12",
                  }}
                >
                  ABRIR LAB →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Integrator */}
        {chapter.integrator && (
          <div>
            <div
              style={{
                fontSize: "10px",
                color: "#3d506b",
                fontWeight: 700,
                letterSpacing: "1px",
                marginBottom: "10px",
              }}
            >
              PROJETO INTEGRADOR
            </div>
            <Link
              href={`/capitulo/${chapter.num}/lab/integrador`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: `${chapter.color}08`,
                  border: `1px solid ${chapter.color}22`,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: chapter.color,
                  }}
                >
                  ★
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: chapter.color,
                    }}
                  >
                    {chapter.integrator.title}
                  </div>
                  <div style={{ fontSize: "10px", color: "#3d506b" }}>
                    Projeto que combina todos os módulos do capítulo
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#f59e0b",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "#f59e0b12",
                  }}
                >
                  ABRIR →
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "28px",
            fontSize: "11px",
          }}
        >
          {chapter.num > 1 ? (
            <Link
              href={`/capitulo/${chapter.num - 1}`}
              style={{ color: "#7589a8", textDecoration: "none" }}
            >
              ← Cap {chapter.num - 1}
            </Link>
          ) : (
            <span />
          )}
          {chapter.num < 10 ? (
            <Link
              href={`/capitulo/${chapter.num + 1}`}
              style={{ color: "#7589a8", textDecoration: "none" }}
            >
              Cap {chapter.num + 1} →
            </Link>
          ) : (
            <Link
              href="/capstone"
              style={{ color: "#f59e0b", textDecoration: "none" }}
            >
              Capstone →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
