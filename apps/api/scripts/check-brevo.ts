/**
 * Brevo setup + validation in one command.
 *
 *   npm run brevo:check --workspace apps/api -- <BREVO_API_KEY> [sender@example.com]
 *
 * With a key it:
 *   1. saves BREVO_API_KEY (and EMAIL_FROM when a sender is given) to apps/api/.env
 *   2. calls GET /v3/account to prove the key works
 *   3. calls GET /v3/senders and confirms the From address is verified
 *   4. prints the exact Vercel commands to finish the production setup
 *
 * Without arguments it validates whatever is already in .env.
 *
 * Brevo's free plan sends 300 emails/day and needs no credit card. The account
 * itself must be created by a human (email verification), and the sender
 * address must be verified in Senders & IP -> Senders.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { config } from "../src/config";
import { parseSender } from "../src/services/email.service";

const API = "https://api.brevo.com/v3";
const ENV_FILE = path.resolve(__dirname, "..", ".env");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const VERCEL_PROJECT = "islamic-event-api";

function upsertEnv(key: string, value: string): void {
  // EMAIL_FROM contains spaces ("Name <a@b>") and must be quoted.
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

async function brevoGet(
  apiKey: string,
  pathname: string
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${API}${pathname}`, {
    headers: { "api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

function currentSender(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (fromEnv) return fromEnv;
  const smtpUser = process.env.SMTP_USER?.trim();
  if (smtpUser) return `Community Events <${smtpUser}>`;
  return config.smtp.from;
}

async function main() {
  const args = process.argv.slice(2);
  const push = args.includes("--push");
  const [argKey, argSender] = args.filter((a) => !a.startsWith("--"));

  if (argKey) upsertEnv("BREVO_API_KEY", argKey.trim());
  if (argSender) {
    const from = argSender.includes("<") ? argSender : `Community Events <${argSender.trim()}>`;
    upsertEnv("EMAIL_FROM", from);
    process.env.EMAIL_FROM = from;
  }

  const apiKey = argKey?.trim() || process.env.BREVO_API_KEY?.trim() || "";
  if (!apiKey) {
    console.error(
      [
        "BREVO_API_KEY is not set.",
        "",
        "Setup (5 minutes, no card):",
        "  1. Sign up at https://app.brevo.com/",
        "  2. Senders & IP -> Senders -> add and verify the address you will send from",
        "  3. SMTP & API -> API Keys -> create a v3 API key",
        "  4. Run: npm run brevo:check --workspace apps/api -- <key> <verified-sender@example.com>",
      ].join("\n")
    );
    process.exit(1);
  }

  const sender = parseSender(currentSender());
  console.log(`Key:    ...${apiKey.slice(-4)}`);
  console.log(`Sender: ${sender.name ? `${sender.name} <${sender.email}>` : sender.email}`);
  console.log("");

  const account = await brevoGet(apiKey, "/account");
  if (!account.ok) {
    console.error(`FAIL  Account check (HTTP ${account.status}): ${JSON.stringify(account.body)}`);
    console.error("      A 401 means the key is wrong or revoked.");
    process.exit(1);
  }
  const acct = account.body as {
    email?: string;
    companyName?: string;
    plan?: { type?: string }[];
  };
  console.log(
    `PASS  Account: ${acct.email ?? "unknown"} (${acct.companyName ?? "no company"}) ` +
      `plan=${acct.plan?.[0]?.type ?? "?"}`
  );

  const senders = await brevoGet(apiKey, "/senders");
  if (!senders.ok) {
    console.error(`FAIL  Senders check (HTTP ${senders.status}): ${JSON.stringify(senders.body)}`);
    process.exit(1);
  }
  const list = (senders.body as { senders?: { email?: string; active?: boolean }[] }).senders ?? [];
  console.log(`INFO  Verified senders: ${list.map((s) => s.email).join(", ") || "(none)"}`);

  const match = list.find((s) => s.email?.toLowerCase() === sender.email.toLowerCase());
  if (!match) {
    console.error(
      `FAIL  Sender ${sender.email} is not verified. Add it in Brevo -> Senders & IP -> Senders, ` +
        "then rerun this command."
    );
    process.exit(1);
  }
  console.log(`PASS  Sender verified: ${match.email}${match.active === false ? " (INACTIVE)" : ""}`);

  if (push) {
    // Non-interactive: --value + --force updates Production in place. Needs a
    // logged-in Vercel CLI (`npx vercel login`) with access to the team.
    for (const [name, value] of [
      ["BREVO_API_KEY", apiKey],
      ["EMAIL_FROM", currentSender()],
    ] as const) {
      const res = spawnSync(
        `npx vercel env add ${name} --environment production --force --yes --project ${VERCEL_PROJECT}`,
        {
          cwd: REPO_ROOT,
          stdio: ["pipe", "inherit", "inherit"],
          input: value,
          shell: true,
        }
      );
      if (res.status !== 0) {
        console.error(`FAIL  Could not push ${name} to Vercel (exit ${res.status}).`);
        process.exit(1);
      }
      console.log(`PASS  Pushed ${name} to Vercel Production.`);
    }
    console.log(
      "\nEnv vars updated. Redeploy for them to take effect:\n  npx vercel deploy --prod --archive=tgz"
    );
    return;
  }

  console.log(
    [
      "",
      "Next: add the same values to the API Vercel project, then redeploy.",
      "Let this script do it (requires a logged-in Vercel CLI):",
      "",
      "  npm run brevo:check --workspace apps/api -- <key> <sender> --push",
      "",
      "Or do it by hand:",
      "",
      "  vercel env add BREVO_API_KEY production",
      '  vercel env add EMAIL_FROM production   # "Community Events <' + sender.email + '>"',
      "  vercel deploy --prod",
      "",
      "Then verify a real message:",
      "  npm run email:test --workspace apps/api -- you@example.com",
    ].join("\n")
  );
}

main().catch((err) => {
  console.error("Brevo check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
