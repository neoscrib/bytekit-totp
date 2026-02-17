// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "yarn",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  checkers: ["typescript"],
  coverageAnalysis: "perTest",
  thresholds: {
    high: 80,
    low: 60,
    break: 80
  }
};
export default config;
