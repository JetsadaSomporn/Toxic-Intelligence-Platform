import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: "#a855f7",
          cyan: "#22d3ee",
          pink: "#ec4899",
        },
        dark: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#252532",
        },
      },
      boxShadow: {
        "neon-purple": "0 0 20px rgba(168, 85, 247, 0.5)",
        "neon-cyan": "0 0 20px rgba(34, 211, 238, 0.5)",
        "neon-pink": "0 0 20px rgba(236, 72, 153, 0.5)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        glass: "16px",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(168, 85, 247, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
