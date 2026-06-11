/**
 * eslint.config.mjs
 *
 * ESLint configuration for the project.
 * Uses Next.js core web vitals and custom rules.
 */
import nextConfig from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**"]
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off"
    }
  }
];

export default eslintConfig;
