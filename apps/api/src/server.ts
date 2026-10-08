import app from "./app";
import { config } from "./config";
import { prisma } from "./config/prisma";

async function main() {
  // Verify database connection before binding
  try {
    await prisma.$connect();
    console.log("✓ Database connected");
  } catch (err) {
    console.error("✗ Database connection failed:", err);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`✓ API running on http://localhost:${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  API prefix:  ${config.apiPrefix}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Database disconnected. Goodbye.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
