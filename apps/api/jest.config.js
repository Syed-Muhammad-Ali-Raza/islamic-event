/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  globalSetup: "<rootDir>/tests/global-setup.ts",
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "node",
          rootDir: ".",
          esModuleInterop: true,
        },
      },
    ],
  },
};
