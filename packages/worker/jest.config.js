/* eslint-disable no-undef */
module.exports = {
  testEnvironment: 'miniflare',
  testMatch: [
    '**/test/**/*.+(ts|tsx|js)',
    '**/src/**/(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'esbuild-jest',
  },
}