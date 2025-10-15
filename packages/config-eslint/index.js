module.exports = {
    env: {
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "prettier",
    ],
    settings: {
        react: {
            version: "detect",
        },
    },
    ignorePatterns: ["node_modules/", "dist/"],
    overrides: [
        {
            files: ["**/*.{ts,tsx}"],
            extends: ["plugin:@typescript-eslint/recommended"],
            parser: "@typescript-eslint/parser",
            plugins: ["@typescript-eslint/eslint-plugin"],
            rules: {
                "no-unused-vars": "off",
                "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            },
        },
    ],
};
