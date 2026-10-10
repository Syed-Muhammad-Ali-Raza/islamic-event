import app from "./app";
import { config } from "./config";
import { prisma } from "./config/prisma";
import { runEventReminders } from "./services/reminder.service";

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

  // Phase 22: event reminder sweep (24h window), hourly + once shortly after boot
  if (config.nodeEnv !== "test") {
    const sweep = async () => {
      try {
        const { sent } = await runEventReminders();
        if (sent > 0) console.log(`[reminders] sent ${sent} event reminder(s)`);
      } catch (err) {
        console.error("[reminders] sweep failed:", err instanceof Error ? err.message : err);
      }
    };
    setTimeout(sweep, 15_000);
    setInterval(sweep, 60 * 60 * 1000);
  }

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
