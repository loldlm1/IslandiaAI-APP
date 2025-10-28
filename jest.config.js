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
    "^until-async$": "<rootDir>/tests/mocks/untilAsync.ts",
    "^.+\\.(svg)$": "<rootDir>/tests/mocks/svgMock.tsx",
  },
  testMatch: ["<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)", "<rootDir>/app/**/?(*.)+(spec|test).[jt]s?(x)"],
  transformIgnorePatterns: ["node_modules/(?!msw|@mswjs/interceptors)", "^.+\\.module\\.(css|sass|scss)$"],
};

module.exports = createJestConfig(customJestConfig);
