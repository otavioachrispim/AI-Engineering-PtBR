import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        course: {
          bg: "#060911",
          surface: "#0c1119",
          surfaceAlt: "#121a27",
          border: "#1a2540",
          text: "#e0e8f5",
          muted: "#7589a8",
          dim: "#3d506b",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'SF Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
