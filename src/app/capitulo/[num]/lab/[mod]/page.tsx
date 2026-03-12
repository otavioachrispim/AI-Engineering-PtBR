"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { getChapter, CHAPTERS } from "@/lib/chapters";

// Dynamic imports for all labs — lazy loaded
const labMap: Record<string, ReturnType<typeof dynamic>> = {};

// Cap 1 (uses different filenames)
for (let m = 1; m <= 4; m++) {
  labMap[`1-${m}`] = dynamic(() => import(`@/labs/cap1/modulo${m}`), { ssr: false });
}
labMap["1-integrador"] = dynamic(() => import("@/labs/cap1/integrador"), { ssr: false });

// Caps 2-10
for (let c = 2; c <= 10; c++) {
  const ch = CHAPTERS.find((ch) => ch.num === c);
  if (ch) {
    for (let m = 1; m <= ch.modules.length; m++) {
      labMap[`${c}-${m}`] = dynamic(() => import(`@/labs/cap${c}/modulo${m}`), { ssr: false });
    }
    if (ch.integrator) {
      labMap[`${c}-integrador`] = dynamic(() => import(`@/labs/cap${c}/integrador`), { ssr: false });
    }
  }
}

export default function LabPage() {
  const params = useParams();
  const capNum = parseInt(params.num as string);
  const modId = params.mod as string;

  const chapter = getChapter(capNum);
  const key = `${capNum}-${modId}`;
  const LabComponent = labMap[key];

  const moduleTitle = useMemo(() => {
    if (!chapter) return "";
    if (modId === "integrador") return chapter.integrator?.title || "Projeto Integrador";
    const mod = chapter.modules.find((m) => m.num === parseInt(modId));
    return mod ? `M${mod.num}: ${mod.title}` : "";
  }, [chapter, modId]);

  if (!chapter || !LabComponent) {
    return (
      <div style={{ minHeight: "100vh", background: "#060911", color: "#e0e8f5", fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Lab não encontrado</div>
          <Link href={chapter ? `/capitulo/${capNum}` : "/"} style={{ color: "#22d3ee", fontSize: "12px" }}>
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top nav bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#060911ee",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1a2540",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "11px",
        }}
      >
        <Link
          href={`/capitulo/${capNum}`}
          style={{ color: "#3d506b", textDecoration: "none" }}
        >
          ← Cap {capNum}
        </Link>
        <span style={{ color: "#1a2540" }}>|</span>
        <span style={{ color: chapter.color, fontWeight: 700 }}>
          {chapter.title}
        </span>
        <span style={{ color: "#3d506b" }}>→</span>
        <span style={{ color: "#7589a8" }}>{moduleTitle}</span>
      </div>

      {/* Lab content */}
      <div className="lab-container">
        <LabComponent />
      </div>
    </div>
  );
}
