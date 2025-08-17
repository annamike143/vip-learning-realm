// --- eslint.config.mjs (THE DEFINITIVE GRANDMASTER VERSION) ---
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

const config = [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // <-- The critical instruction: "Understand JSX"
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react: pluginReact,
      "@next/next": nextPlugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Our custom rule to allow apostrophes and quotes
      "react/no-unescaped-entities": "off",
      // A rule to prevent React from being marked as unused (common in Next.js)
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
  },
];

export default config;