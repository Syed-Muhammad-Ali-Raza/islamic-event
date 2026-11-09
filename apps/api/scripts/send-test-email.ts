/**
 * One-off delivery check: proves the configured transport actually sends.
 *
 *   npm run email:test --workspace apps/api -- you@example.com
 *
 * Reads the same env vars as the API (or apps/api/.env locally). Delivery goes
 * through Brevo when BREVO_API_KEY is set, otherwise SMTP. With neither, the
 * command fails instead of silently writing to the dev outbox.
 */
import { config } from "../src/config";
import { emailProvider, sendEmailStrict } from "../src/services/email.service";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test --workspace apps/api -- you@example.com");
    process.exit(1);
  }

  const provider = emailProvider();
  console.log(`Transport: ${provider}`);
  console.log(`From:      ${config.smtp.from}`);
  if (provider === "smtp") {
    console.log(`SMTP:      ${config.smtp.host}:${config.smtp.port} (secure=${config.smtp.secure})`);
  }

  try {
    await sendEmailStrict({
      to,
      subject: "Community Events — email delivery test",
      html: `<p>This is a test message from the Community Events API.</p>
             <p>If you can read this, outbound email works from this environment.</p>
             <p>Sent at ${new Date().toISOString()}</p>`,
      text: `Community Events email test — sent at ${new Date().toISOString()}`,
    });
    console.log("Done. Check the inbox (and spam) for the test message.");
  } catch (err) {
    console.error("Email test failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Email test failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
