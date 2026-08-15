import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae3",
          300: "#b1bacb",
          400: "#8794ae",
          500: "#687695",
          600: "#535e7b",
          700: "#444c64",
          800: "#3b4254",
          900: "#343948",
          950: "#23262f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
