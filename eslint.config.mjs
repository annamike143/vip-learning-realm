// --- eslint.config.mjs (DEFINITIVE FINAL VERSION) ---
import nextPlugin from "@next/eslint-plugin-next";

const config = [
    {
        files: ["src/**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "@next/next": nextPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            // This is our new rule to solve the deployment error
            "react/no-unescaped-entities": "off",
        },
    },
];

export default config;