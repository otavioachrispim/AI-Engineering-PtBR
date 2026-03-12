"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Capstone = dynamic(() => import("@/labs/capstone"), { ssr: false });

export default function CapstonePage() {
  return (
    <div>
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
        <Link href="/" style={{ color: "#3d506b", textDecoration: "none" }}>
          ← Índice
        </Link>
        <span style={{ color: "#1a2540" }}>|</span>
        <span style={{ color: "#f59e0b", fontWeight: 700 }}>
          Capstone: AI Engineering Command Center
        </span>
      </div>
      <div className="lab-container">
        <Capstone />
      </div>
    </div>
  );
}
