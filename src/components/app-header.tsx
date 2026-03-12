"use client";

import { useEffect, useState } from "react";

function readCurrentLang() {
  if (typeof document === "undefined") return "pt";

  var match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return "pt";

  return match[1].endsWith("/en") ? "en" : "pt";
}

function setTranslateCookie(value: string) {
  document.cookie = "googtrans=" + value + ";path=/";
  document.cookie = "googtrans=" + value + ";path=/;domain=" + window.location.hostname;
}

export default function AppHeader() {
  var [lang, setLang] = useState("pt");

  useEffect(function syncLangFromCookie() {
    setLang(readCurrentLang());
  }, []);

  function handleTranslate(nextLang: string) {
    if (nextLang === lang) return;

    setTranslateCookie(nextLang === "en" ? "/pt/en" : "/pt/pt");
    setLang(nextLang);
    window.location.reload();
  }

  return (
    <header
      style={{
        position: "relative",
        zIndex: 60,
        borderBottom: "1px solid #1a2540",
        background: "rgba(6, 9, 17, 0.92)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#3d506b", fontWeight: 700 }}>
            AI ENGINEERING
          </div>
          <div style={{ fontSize: "13px", color: "#e0e8f5", fontWeight: 700 }}>
            PT-BR / English
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", color: "#7589a8", fontWeight: 700 }}>
            Translate
          </span>
          <div
            style={{
              display: "inline-flex",
              padding: "4px",
              borderRadius: "999px",
              border: "1px solid #1a2540",
              background: "#0c1119",
              gap: "4px",
            }}
          >
            {["pt", "en"].map(function (option) {
              var active = lang === option;
              var label = option.toUpperCase();

              return (
                <button
                  key={option}
                  type="button"
                  onClick={function () {
                    handleTranslate(option);
                  }}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "999px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    background: active ? "#22d3ee" : "transparent",
                    color: active ? "#041019" : "#7589a8",
                    transition: "all 0.2s ease",
                  }}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div id="google_translate_element" style={{ display: "none" }} />
    </header>
  );
}
