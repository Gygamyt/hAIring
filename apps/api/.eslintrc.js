module.exports = {
    root: true,
    extends: ["@hairing/config-eslint"],
    parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
    },
};