// ─────────────────────────────────────────────────────────────────────────────
// Vercel serverless entrypoint.
//
// The whole Express app is exported as one function and every request is
// rewritten to it (see vercel.json). Express keeps doing its own routing,
// CORS, rate limiting and error handling — nothing about the API changes,
// it just runs inside a Lambda instead of a long-lived process.
//
// Not part of the tsc build (apps/api/tsconfig.json only includes src/**);
// Vercel compiles this file itself with esbuild.
// ─────────────────────────────────────────────────────────────────────────────
import app from "../src/app";

export default app;
