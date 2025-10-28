const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@tailadmin/(.*)$": "<rootDir>/src/tailadmin/$1",
  },
  testMatch: ["<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)", "<rootDir>/app/**/?(*.)+(spec|test).[jt]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
