/**
 * One-off SMTP check: confirms the configured relay accepts mail.
 *
 *   npm run email:test --workspace apps/api -- you@example.com
 *
 * Reads the same env vars as the API (or apps/api/.env locally). If SMTP_* is
 * missing it prints a warning and writes the message to the dev outbox instead
 * of delivering it.
 */
import { config } from "../src/config";
import { sendEmail } from "../src/services/email.service";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test --workspace apps/api -- you@example.com");
    process.exit(1);
  }

  if (config.smtp.host) {
    console.log(`SMTP: ${config.smtp.host}:${config.smtp.port} (secure=${config.smtp.secure})`);
    console.log(`From: ${config.smtp.from}`);
  } else {
    console.warn("SMTP_HOST is empty — the message will be written to the dev outbox, NOT delivered.");
  }

  await sendEmail({
    to,
    subject: "Community Events — SMTP test",
    html: `<p>This is a test message from the Community Events API.</p>
           <p>If you can read this, outbound email works from this environment.</p>
           <p>Sent at ${new Date().toISOString()}</p>`,
    text: `Community Events SMTP test — sent at ${new Date().toISOString()}`,
  });

  console.log("Done. Check the inbox (and spam) for the test message.");
}

main().catch((err) => {
  console.error("SMTP test failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
