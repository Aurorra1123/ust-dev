import reactConfig from "@campusbook/eslint-config/react";

export default [
  {
    ignores: ["postcss.config.cjs", "public/config.js"]
  },
  {
    files: ["test/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  ...reactConfig
];
