import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        slate: "#243041",
        paper: "#F8FAFC",
        accent: "#00A6A6",
        warning: "#F59E0B",
        danger: "#DC2626"
      }
    }
  },
  plugins: []
};

export default config;
