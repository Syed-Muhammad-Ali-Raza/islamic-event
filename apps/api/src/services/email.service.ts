import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import os from "os";
import path from "path";
import { config } from "../config";

// ─── Transport ────────────────────────────────────────────────────────────────
// Delivery priority:
//   1. Brevo HTTP API (BREVO_API_KEY) — one HTTPS POST, ideal for serverless:
//      no SMTP handshake, no socket timeouts, works on hosts that block 25/587.
//   2. SMTP relay (SMTP_HOST) via nodemailer.
//   3. Dev outbox — writes logs/outbox/*.html so flows stay testable with no
//      credentials at all.

let transporter: Transporter | null = null;

export type EmailProvider = "brevo" | "smtp" | "outbox";

export function emailProvider(): EmailProvider {
  if (config.brevo.apiKey) return "brevo";
  if (config.smtp.host) return "smtp";
  return "outbox";
}

// Loud, once-per-process signal for production deploys with no delivery path.
// Without it every verification/reset/moderation email is written to /tmp and
// lost, and nothing in the logs says so at boot.
if (config.nodeEnv === "production" && emailProvider() === "outbox") {
  console.warn(
    "[email] No email transport configured — outbound email is disabled. " +
      "Set BREVO_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS, plus EMAIL_FROM."
  );
}

function getTransporter(): Transporter | null {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      // Fail fast with a clear log instead of hanging a request worker.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    // Surface auth/host problems in the API log at startup.
    transporter
      .verify()
      .then(() => console.log(`[email] SMTP ready (${config.smtp.host}:${config.smtp.port})`))
      .catch((err: unknown) =>
        console.error(
          "[email] SMTP connection failed:",
          err instanceof Error ? err.message : err
        )
      );
  }
  return transporter;
}

function outboxDir(): string {
  // Local dev gets logs/outbox/ under the repo. Serverless hosts (Vercel /
  // Lambda) mount the deployment bundle read-only, so the only writable path
  // is the OS temp dir — try the nice location first, fall back to /tmp.
  for (const dir of [
    path.resolve(process.cwd(), "logs", "outbox"),
    path.join(os.tmpdir(), "outbox"),
  ]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // read-only filesystem — try the next candidate
    }
  }
  return os.tmpdir();
}

export interface RawEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ─── Brevo HTTP API ───────────────────────────────────────────────────────────
// Free tier: 300 emails/day, no credit card. The sender address must be
// verified in Brevo (Senders & IP → Senders) or the API answers 400.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** `"Name <user@example.com>"` or `"user@example.com"` → Brevo sender object. */
export function parseSender(value: string): { email: string; name?: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, "").trim();
    return { email: match[2].trim(), ...(name ? { name } : {}) };
  }
  return { email: value.trim() };
}

async function sendViaBrevo(email: RawEmail): Promise<string> {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": config.brevo.apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: parseSender(config.smtp.from),
      to: [{ email: email.to }],
      subject: email.subject,
      htmlContent: email.html,
      ...(email.text ? { textContent: email.text } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    // Brevo returns {"code":"...","message":"..."} — keep it in the log.
    throw new Error(`Brevo HTTP ${res.status}: ${body.slice(0, 400)}`);
  }

  let messageId = "";
  try {
    messageId = JSON.parse(body)?.messageId ?? "";
  } catch {
    // ignore — success is the 2xx status
  }
  return messageId;
}

/** Sends an email and surfaces failures — used by the CLI checks, never by app flows. */
export async function sendEmailStrict(email: RawEmail): Promise<EmailProvider> {
  if (emailProvider() === "brevo") {
    const id = await sendViaBrevo(email);
    console.log(`[email] sent via Brevo to ${email.to}: ${email.subject}${id ? ` (${id})` : ""}`);
    return "brevo";
  }
  const transport = getTransporter();
  if (transport) {
    await transport.sendMail({
      from: config.smtp.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    console.log(`[email] sent via SMTP to ${email.to}: ${email.subject}`);
    return "smtp";
  }
  throw new Error(
    "No email transport configured — set BREVO_API_KEY or SMTP_HOST before sending."
  );
}

export async function sendEmail(email: RawEmail): Promise<void> {
  try {
    // 1. Brevo HTTP API — preferred on serverless.
    if (config.brevo.apiKey) {
      await sendViaBrevo(email);
      console.log(`[email] sent via Brevo to ${email.to}: ${email.subject}`);
      return;
    }

    // 2. SMTP relay.
    const transport = getTransporter();
    if (transport) {
      await transport.sendMail({
        from: config.smtp.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      console.log(`[email] sent to ${email.to}: ${email.subject}`);
      return;
    }

    // 3. No transport configured. In production this means the email is NOT
    // delivered, so make it loud in the logs instead of failing silently.
    if (config.nodeEnv === "production") {
      console.error(
        `[email] No email transport configured — "${email.subject}" to ${email.to} was NOT sent. ` +
          "Set BREVO_API_KEY (preferred) or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS."
      );
    }

    // Dev outbox — inspectable HTML on disk.
    const safeName = email.to.replace(/[^a-z0-9@._-]/gi, "_");
    const file = path.join(outboxDir(), `${Date.now()}-${safeName}.html`);
    const content = `<!-- To: ${email.to} | Subject: ${email.subject} -->\n${email.html}`;
    fs.writeFileSync(file, content, "utf8");
    console.log(`[email:outbox] ${email.subject} -> ${file}`);
  } catch (err) {
    // Emails must never break the main request flow
    console.error("[email] failed to send:", err instanceof Error ? err.message : err);
  }
}

// ─── Template ─────────────────────────────────────────────────────────────────

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1020;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#141a33;border-radius:12px;overflow:hidden;border:1px solid #232b4d;">
        <tr>
          <td style="padding:20px 28px;background:linear-gradient(135deg,#6d5ae6,#9b5de5);">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">Community<span style="color:#d8d4ff;">Events</span></span>
          </td>
        </tr>
        <tr><td style="padding:28px;">
          <h1 style="color:#ffffff;font-size:20px;margin:0 0 16px;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #232b4d;">
          <p style="color:#6b7399;font-size:12px;margin:0;">
            ${config.app.name} · <a href="${config.app.url}" style="color:#8b7ef8;">${config.app.url}</a><br/>
            Questions? Contact <a href="mailto:${config.app.supportEmail}" style="color:#8b7ef8;">${config.app.supportEmail}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="color:#c3c9e8;font-size:14px;line-height:1.6;margin:0 0 16px;">${text}</p>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="background:#6d5ae6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block;">${label}</a>
  </p>`;
}

function smallNote(text: string): string {
  return `<p style="color:#6b7399;font-size:12px;line-height:1.6;margin:16px 0 0;">${text}</p>`;
}

// ─── Email senders ────────────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const link = `${config.app.url}/verify-email?token=${encodeURIComponent(opts.token)}`;
  await sendEmail({
    to: opts.to,
    subject: "Verify your email — Community Events",
    html: layout(
      "Verify your email address",
      paragraph(`Assalamu Alaikum ${opts.name},`) +
        paragraph("Welcome to Community Events! Please confirm your email address to secure your account.") +
        button(link, "Verify Email") +
        smallNote(`This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`)
    ),
    text: `Verify your email: ${link}`,
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const link = `${config.app.url}/reset-password?token=${encodeURIComponent(opts.token)}`;
  await sendEmail({
    to: opts.to,
    subject: "Reset your password — Community Events",
    html: layout(
      "Reset your password",
      paragraph(`Assalamu Alaikum ${opts.name},`) +
        paragraph("We received a request to reset your password. Click the button below to choose a new one.") +
        button(link, "Reset Password") +
        smallNote(`This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not change.`)
    ),
    text: `Reset your password: ${link}`,
  });
}

export async function sendEventStatusEmail(opts: {
  to: string;
  name: string;
  eventTitle: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED";
  eventUrl: string;
  reason?: string;
}): Promise<void> {
  const titles: Record<string, string> = {
    APPROVED: "Your event has been approved",
    REJECTED: "Your event needs changes",
    CANCELLED: "Your event has been cancelled",
  };
  const bodies: Record<string, string> = {
    APPROVED: "Great news! Your event has been reviewed and approved. It is now live and visible to the community.",
    REJECTED: "Your event was reviewed and could not be approved at this time. Please review the feedback below, make the needed changes, and resubmit.",
    CANCELLED: "Your event has been cancelled by the moderation team.",
  };
  await sendEmail({
    to: opts.to,
    subject: `${titles[opts.status]} — ${opts.eventTitle}`,
    html: layout(
      titles[opts.status],
      paragraph(`Assalamu Alaikum ${opts.name},`) +
        paragraph(bodies[opts.status]) +
        paragraph(`<strong>${opts.eventTitle}</strong>`) +
        (opts.reason ? paragraph(`<em>Reason: ${opts.reason}</em>`) : "") +
        button(opts.eventUrl, "View Event")
    ),
    text: `${titles[opts.status]}: ${opts.eventTitle}`,
  });
}

export async function sendNewEventAdminEmail(opts: {
  to: string;
  adminName: string;
  eventTitle: string;
  eventUrl: string;
  creatorName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `New event awaiting review — ${opts.eventTitle}`,
    html: layout(
      "New event awaiting review",
      paragraph(`Assalamu Alaikum ${opts.adminName},`) +
        paragraph(`<strong>${opts.creatorName}</strong> submitted a new event that needs moderation:`) +
        paragraph(`<strong>${opts.eventTitle}</strong>`) +
        button(opts.eventUrl, "Review Event")
    ),
    text: `New event pending review: ${opts.eventTitle}`,
  });
}

export async function sendRsvpOrganizerEmail(opts: {
  to: string;
  organizerName: string;
  attendeeName: string;
  eventTitle: string;
  eventUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `New attendee for ${opts.eventTitle}`,
    html: layout(
      "Someone is attending your event",
      paragraph(`Assalamu Alaikum ${opts.organizerName},`) +
        paragraph(`<strong>${opts.attendeeName}</strong> marked themselves as <strong>Attending</strong>:`) +
        paragraph(`<strong>${opts.eventTitle}</strong>`) +
        button(opts.eventUrl, "View Event") +
        smallNote(`You can see your full attendee list and check people in from My Events.`)
    ),
    text: `${opts.attendeeName} is attending ${opts.eventTitle}`,
  });
}

export async function sendEventReminderEmail(opts: {
  to: string;
  name: string;
  eventTitle: string;
  eventUrl: string;
  whenLabel: string;
  venue: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Reminder: ${opts.eventTitle} is coming up`,
    html: layout(
      "Event reminder",
      paragraph(`Assalamu Alaikum ${opts.name},`) +
        paragraph("This is a friendly reminder that an event you're attending is coming up:") +
        paragraph(`<strong>${opts.eventTitle}</strong>`) +
        paragraph(`${opts.whenLabel}${opts.venue ? ` · ${opts.venue}` : ""}`) +
        button(opts.eventUrl, "View Event") +
        smallNote(`Please show the QR code on the event page at the entrance for quick check-in.`)
    ),
    text: `Reminder: ${opts.eventTitle} — ${opts.whenLabel}`,
  });
}
