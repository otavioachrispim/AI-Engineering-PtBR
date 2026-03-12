import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
