import reactConfig from "@campusbook/eslint-config/react";

export default [
  {
    ignores: ["postcss.config.cjs", "public/config.js"]
  },
  ...reactConfig
];
