import { Router } from "express";
import { config } from "../../config";
import { runEventReminders } from "../../services/reminder.service";

// ─── Machine-to-machine endpoints (Vercel Cron) ──────────────────────────────
// Vercel attaches "Authorization: Bearer <CRON_SECRET>" to scheduled requests
// when CRON_SECRET is configured on the project. Anyone else gets a 401, so
// the sweep can't be triggered by the public.

const router = Router();

function authorized(req: import("express").Request): boolean {
  const secret = config.cron.secret;
  if (!secret) return false;
  return req.header("authorization") === `Bearer ${secret}`;
}

router.get("/reminders", async (req, res, next) => {
  if (!config.cron.secret) {
    res.status(503).json({
      success: false,
      message: "CRON_SECRET is not configured on this deployment.",
    });
    return;
  }

  if (!authorized(req)) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  try {
    const { sent } = await runEventReminders();
    res.json({ success: true, data: { sent } });
  } catch (err) {
    next(err);
  }
});

export default router;
