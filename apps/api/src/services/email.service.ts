import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import { config } from "../config";

// ─── Transport ────────────────────────────────────────────────────────────────
// If SMTP_HOST is not configured, emails are written to logs/outbox/ as HTML
// files (dev outbox) so flows are fully testable without real credentials.

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

function outboxDir(): string {
  const dir = path.resolve(process.cwd(), "logs", "outbox");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export interface RawEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(email: RawEmail): Promise<void> {
  try {
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

    // Dev outbox — no SMTP configured
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
