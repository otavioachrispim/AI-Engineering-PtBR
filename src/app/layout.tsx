import type { Metadata } from "next";
import Script from "next/script";
import AppHeader from "@/components/app-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "AI Engineering: Do Conceito à Produção",
  description:
    "Curso completo de engenharia de IA aplicada — 11 capítulos, 35 módulos, 45 laboratórios interativos. Aplicado ao Costa Lima Piscinas, um ERP real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppHeader />
        {children}

        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            window.googleTranslateElementInit = function () {
              if (!window.google || !window.google.translate) return;

              new window.google.translate.TranslateElement(
                {
                  pageLanguage: "pt",
                  includedLanguages: "pt,en",
                  autoDisplay: false,
                },
                "google_translate_element"
              );
            };
          `}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
