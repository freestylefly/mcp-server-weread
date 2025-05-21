/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      babelConfig: true, // Tells ts-jest to use babel.config.js
    }],
  },
  // extensionsToTreatAsEsm: ['.ts'], // Optional: ts-jest with useESM should handle this
  // moduleNameMapper: { // Optional: if you need path mapping
  //   '^(\\.{1,2}/.*)\\.js$': '$1',
  // },
};
