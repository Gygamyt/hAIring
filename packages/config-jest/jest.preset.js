const { join } = require("node:path");

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts', 'mjs'],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j|mj)s$': 'ts-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!pdf-parse|pdfjs-dist)',
    ],
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
};