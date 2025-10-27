const jestPreset = require('@hairing/config-jest/jest.preset');

module.exports = {
    ...jestPreset,
    rootDir: 'src',
    displayName: 'transcription',
};