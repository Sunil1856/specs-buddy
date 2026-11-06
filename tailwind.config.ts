import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#25D366", // WhatsApp Green
          600: "#128C7E", // Dark WhatsApp Green
          700: "#075E54", // Deep Teal
          800: "#0B4F45",
          900: "#063A33",
        },
        navy: {
          850: "#111827",
          900: "#0F172A",
          950: "#090D16",
        },
        sidebar: {
          bg: "#0B132B",
          hover: "#1C2541",
          active: "#1E293B",
          border: "#1E293B",
        }
      },
    },
  },
  plugins: [],
};
export default config;
