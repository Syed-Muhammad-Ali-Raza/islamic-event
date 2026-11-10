/**
 * Brevo SMTP setup + validation in one command.
 *
 *   npm run brevo:smtp --workspace apps/api -- <login> <smtp-key> <sender@example.com> [--push] [--to you@example.com]
 *
 * What it does:
 *   1. writes SMTP_HOST/PORT/SECURE/USER/PASS and EMAIL_FROM to apps/api/.env
 *   2. opens a real STARTTLS connection and authenticates (nodemailer verify)
 *   3. with --to, sends a real message and waits for Brevo to accept it
 *   4. with --push, updates the API project's Vercel Production env vars
 *
 * Values: Brevo -> SMTP & API -> SMTP. The login looks like
 * `c20fba001@smtp-brevo.com`; the key starts with `xsmtpsib-`. The API key
 * (`xkeysib-`) is a different credential and does not work over SMTP.
 * The From address must be verified under Senders & IP -> Senders.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import nodemailer from "nodemailer";

const ENV_FILE = path.resolve(__dirname, "..", ".env");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const VERCEL_PROJECT = "islamic-event-api";
const HOST = "smtp-relay.brevo.com";
const PORT = "587";

function upsertEnv(key: string, value: string): void {
  const line = `${key}=${/[\s#]/.test(value) ? `"${value}"` : value}`;
  const existing = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : "";
  const lines = existing.split(/\r?\n/);
  const idx = lines.findIndex((l) => new RegExp(`^\\s*#?\\s*${key}\\s*=`).test(l));
  if (idx >= 0) {
    lines[idx] = line;
  } else {
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    lines.push(line, "");
  }
  fs.writeFileSync(ENV_FILE, lines.join("\n"), "utf8");
}

function pushEnv(name: string, value: string): boolean {
  const res = spawnSync(
    `npx vercel env add ${name} --environment production --force --yes --project ${VERCEL_PROJECT}`,
    { cwd: REPO_ROOT, stdio: ["pipe", "inherit", "inherit"], input: value, shell: true }
  );
  return res.status === 0;
}

async function main() {
  const args = process.argv.slice(2);
  const push = args.includes("--push");
  const toIdx = args.indexOf("--to");
  const to = toIdx >= 0 ? args[toIdx + 1] : undefined;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--to") {
      i++;
      continue;
    }
    if (args[i].startsWith("--")) continue;
    positional.push(args[i]);
  }
  const [login, key, sender] = positional;

  if (!login || !key || !sender) {
    console.error(
      [
        "Usage: npm run brevo:smtp --workspace apps/api -- <login> <smtp-key> <sender@example.com> [--push] [--to you@example.com]",
        "",
        "Brevo -> SMTP & API -> SMTP gives you the login (…@smtp-brevo.com) and",
        "the key (starts with xsmtpsib-). The From address must be verified under",
        "Senders & IP -> Senders.",
      ].join("\n")
    );
    process.exit(1);
  }

  const from = sender.includes("<") ? sender : `Community Events <${sender.trim()}>`;

  upsertEnv("SMTP_HOST", HOST);
  upsertEnv("SMTP_PORT", PORT);
  upsertEnv("SMTP_SECURE", "false");
  upsertEnv("SMTP_USER", login);
  upsertEnv("SMTP_PASS", key);
  upsertEnv("EMAIL_FROM", from);

  console.log(`Host:   ${HOST}:${PORT} (STARTTLS)`);
  console.log(`Login:  ${login}`);
  console.log(`Key:    ...${key.slice(-4)}`);
  console.log(`From:   ${from}`);
  console.log("");

  const transport = nodemailer.createTransport({
    host: HOST,
    port: Number(PORT),
    secure: false,
    auth: { user: login, pass: key },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
  });

  try {
    await transport.verify();
    console.log("PASS  STARTTLS connection + authentication");
  } catch (err) {
    console.error(`FAIL  SMTP verify: ${err instanceof Error ? err.message : String(err)}`);
    console.error("      Check the login/key pair (the API key xkeysib- will NOT work here).");
    process.exit(1);
  }

  if (to) {
    try {
      const info = await transport.sendMail({
        from,
        to,
        subject: "Community Events — Brevo SMTP test",
        html: `<p>Brevo SMTP delivery works.</p><p>Sent at ${new Date().toISOString()}</p>`,
        text: `Brevo SMTP delivery works. Sent at ${new Date().toISOString()}`,
      });
      console.log(`PASS  Test message accepted by Brevo (id ${info.messageId ?? "n/a"})`);
    } catch (err) {
      console.error(`FAIL  Send: ${err instanceof Error ? err.message : String(err)}`);
      console.error("      A 400 usually means the From address is not a verified sender.");
      process.exit(1);
    }
  }

  if (push) {
    const values: [string, string][] = [
      ["SMTP_HOST", HOST],
      ["SMTP_PORT", PORT],
      ["SMTP_SECURE", "false"],
      ["SMTP_USER", login],
      ["SMTP_PASS", key],
      ["EMAIL_FROM", from],
    ];
    for (const [name, value] of values) {
      if (!pushEnv(name, value)) {
        console.error(`FAIL  Could not push ${name} to Vercel.`);
        process.exit(1);
      }
      console.log(`PASS  Pushed ${name} to Vercel Production.`);
    }
    console.log("\nRedeploy so the new env vars take effect:\n  npx vercel deploy --prod --archive=tgz");
  } else {
    console.log(
      [
        "",
        "Next: push these to Vercel and redeploy:",
        "",
        `  npm run brevo:smtp --workspace apps/api -- ${login} <key> ${sender} --push`,
        "",
      ].join("\n")
    );
  }
}

main().catch((err) => {
  console.error("Brevo SMTP setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
