import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10212d",
        sand: "#f6f1e8",
        ember: "#b4552d",
        moss: "#456b5a",
        mist: "#d8e3e7"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 33, 45, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
