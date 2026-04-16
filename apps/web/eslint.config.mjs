import reactConfig from "@campusbook/eslint-config/react";

export default [
  {
    ignores: ["postcss.config.cjs"]
  },
  ...reactConfig
];
