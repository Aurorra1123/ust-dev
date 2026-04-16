import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const baseConfig = [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", ".turbo/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_"
        }
      ]
    }
  }
];

export default baseConfig;
