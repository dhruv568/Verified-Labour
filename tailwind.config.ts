import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf3",
          100: "#d7f7e2",
          200: "#b3eec9",
          300: "#7ee0a5",
          400: "#44cb7e",
          500: "#35d37a",
          600: "#0B9B5A", // Marketplace verified green
          700: "#08783b", // Verified Labour primary brand green
          800: "#0b6232",
          900: "#0b502b",
          950: "#032c16",
        },
        navy: {
          50: "#f0f4f9",
          100: "#dde6f2",
          200: "#c1d3e7",
          300: "#97b9d7",
          400: "#6797c3",
          500: "#467bb0",
          600: "#336193",
          700: "#2a4f78",
          800: "#0F2A5F", // Deep Navy token
          900: "#0b2046",
          950: "#06132b",
        },
        marketplace: {
          navy: "#0F2A5F",
          blue: "#1464D2",
          green: "#0B9B5A",
          surface: "#F7F9FC",
          text: "#10213F",
          muted: "#64748B",
          border: "#E2E8F0",
        },
        accent: {
          amber: "#f59e0b",
          gold: "#eab308",
          blue: "#1464D2",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "'Noto Sans Devanagari'", "system-ui", "sans-serif"],
        devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
