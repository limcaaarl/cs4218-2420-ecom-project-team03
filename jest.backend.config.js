export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",
  
  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/controllers/*.integration.test.js"
  ],

  transform: {},

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "helpers/**",  "middlewares/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
