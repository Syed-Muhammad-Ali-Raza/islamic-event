/**
 * SMTP setup + validation in one command.
 *
 *   npm run smtp:setup --workspace apps/api -- gmail  you@gmail.com <app-password>  you@gmail.com [--to you@gmail.com] [--push]
 *   npm run smtp:setup --workspace apps/api -- brevo  c20fba001@smtp-brevo.com <smtp-key> sender@example.com [--push]
 *   npm run smtp:setup --workspace apps/api -- smtp.example.com:587 user pass sender@example.com
 *
 * What it does:
 *   1. writes SMTP_HOST/PORT/SECURE/USER/PASS and EMAIL_FROM to apps/api/.env
 *   2. opens a real STARTTLS connection and authenticates (nodemailer verify)
 *   3. with --to, sends a real message and waits for the server to accept it
 *   4. with --push, updates the API project's Vercel Production env vars
 *
 * Gmail (best option without a domain): Google Account -> Security -> 2-Step
 * Verification ON, then App passwords -> create one. Google signs the message,
 * so SPF/DKIM align and it lands in inboxes; the From address must be the
 * account itself. Free Gmail allows ~500 recipients/day.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import nodemailer from "nodemailer";

const ENV_FILE = path.resolve(__dirname, "..", ".env");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const VERCEL_PROJECT = "islamic-event-api";

const PRESETS: Record<string, { host: string; port: string; secure: string; hint: string }> = {
  gmail: {
    host: "smtp.gmail.com",
    port: "587",
    secure: "false",
    hint: "Use a 16-character App Password (2-Step Verification must be on), not your Google password.",
  },
  brevo: {
    host: "smtp-relay.brevo.com",
    port: "587",
    secure: "false",
    hint: "The key starts with xsmtpsib- (SMTP key, not the xkeysib- API key). Verify the sender in Senders & IP -> Senders.",
  },
};

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

function resolveTransport(target: string): { host: string; port: string; secure: string; hint: string } {
  const preset = PRESETS[target.toLowerCase()];
  if (preset) return preset;

  // Host:port form for any other relay.
  const match = target.match(/^([a-z0-9.-]+\.[a-z]{2,})(?::(\d+))?$/i);
  if (match) {
    const port = match[2] ?? "587";
    return {
      host: match[1],
      port,
      secure: port === "465" ? "true" : "false",
      hint: "Check the provider's SMTP credentials.",
    };
  }

  console.error(
    `Unknown target "${target}". Use gmail, brevo, or host[:port] (e.g. smtp.example.com:587).`
  );
  process.exit(1);
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
  const [target, user, rawPass, sender] = positional;

  if (!target || !user || !rawPass || !sender) {
    console.error(
      [
        "Usage: npm run smtp:setup --workspace apps/api -- <gmail|brevo|host:port> <user> <password> <sender> [--to addr] [--push]",
        "",
        "Gmail example:",
        "  npm run smtp:setup --workspace apps/api -- gmail you@gmail.com <app-password> you@gmail.com --to you@gmail.com --push",
        "",
        "Brevo example:",
        "  npm run smtp:setup --workspace apps/api -- brevo c20fba001@smtp-brevo.com <smtp-key> you@gmail.com --push",
      ].join("\n")
    );
    process.exit(1);
  }

  // Google shows App Passwords as "abcd efgh ijkl mnop".
  const transport = resolveTransport(target);
  const pass = transport.host === "smtp.gmail.com" ? rawPass.replace(/\s+/g, "") : rawPass;
  const from = sender.includes("<") ? sender : `Community Events <${sender.trim()}>`;

  if (transport.host === "smtp.gmail.com" && pass.length !== 16) {
    console.warn(
      `WARN  App Passwords are 16 characters; got ${pass.length}. ` +
        "A normal account password will be rejected by Gmail."
    );
  }

  upsertEnv("SMTP_HOST", transport.host);
  upsertEnv("SMTP_PORT", transport.port);
  upsertEnv("SMTP_SECURE", transport.secure);
  upsertEnv("SMTP_USER", user);
  upsertEnv("SMTP_PASS", pass);
  upsertEnv("EMAIL_FROM", from);

  console.log(`Host:   ${transport.host}:${transport.port} (${transport.secure === "true" ? "implicit TLS" : "STARTTLS"})`);
  console.log(`Login:  ${user}`);
  console.log(`Key:    ...${pass.slice(-4)}`);
  console.log(`From:   ${from}`);
  console.log("");

  const mailer = nodemailer.createTransport({
    host: transport.host,
    port: Number(transport.port),
    secure: transport.secure === "true",
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
  });

  try {
    await mailer.verify();
    console.log("PASS  TLS connection + authentication");
  } catch (err) {
    console.error(`FAIL  SMTP verify: ${err instanceof Error ? err.message : String(err)}`);
    console.error(`      ${transport.hint}`);
    process.exit(1);
  }

  if (to) {
    try {
      const info = await mailer.sendMail({
        from,
        to,
        subject: "Community Events — email delivery test",
        html: `<p>Email delivery works.</p><p>Sent at ${new Date().toISOString()}</p>`,
        text: `Email delivery works. Sent at ${new Date().toISOString()}`,
      });
      console.log(`PASS  Message accepted (id ${info.messageId ?? "n/a"}) — check ${to}`);
    } catch (err) {
      console.error(`FAIL  Send: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`      ${transport.hint}`);
      process.exit(1);
    }
  }

  if (push) {
    const values: [string, string][] = [
      ["SMTP_HOST", transport.host],
      ["SMTP_PORT", transport.port],
      ["SMTP_SECURE", transport.secure],
      ["SMTP_USER", user],
      ["SMTP_PASS", pass],
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
        `  npm run smtp:setup --workspace apps/api -- ${target} ${user} <password> ${sender} --push`,
        "",
      ].join("\n")
    );
  }
}

main().catch((err) => {
  console.error("SMTP setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
