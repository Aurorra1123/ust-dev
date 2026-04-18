import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#142033",
        sand: "#f7f8fb",
        ember: "#a88337",
        moss: "#1d4f92",
        mist: "#edf2f8",
        navy: "#002f6b",
        gold: "#c8b388",
        slate: "#61708a",
        danger: "#cc415c"
      },
      boxShadow: {
        panel: "0 28px 80px rgba(0, 47, 107, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
