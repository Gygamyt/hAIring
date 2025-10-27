module.exports = {
    root: true,
    extends: ["@hairing/config-eslint"],
    env: { browser: true, es2020: true },
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname
    },
    plugins: ["react-refresh"],
    rules: {
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
        "react/react-in-jsx-scope": "off",
    },
};