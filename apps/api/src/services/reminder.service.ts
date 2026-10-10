import { prisma } from "../config/prisma";
import { config } from "../config";
import { notify } from "./notification.service";
import { sendEventReminderEmail } from "./email.service";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function whenLabel(date: Date, startTime: string | null): string {
  const day = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return startTime ? `${day} at ${startTime}` : day;
}

/**
 * Phase 22: send a reminder (in-app + email) to everyone who marked themselves
 * as ATTENDING an APPROVED event starting within the next 24 hours. Each RSVP
 * is reminded at most once via `reminderSentAt`.
 */
export async function runEventReminders(now = new Date()): Promise<{ sent: number }> {
  // Events starting between now and 24h from now (calendar-day dates are
  // stored at midnight, so an exact +24h instant window covers "tomorrow").
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      date: { gte: startOfDay(now), lte: windowEnd },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      date: true,
      startTime: true,
      venue: true,
      rsvps: {
        where: { type: "ATTENDING", reminderSentAt: null },
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  let sent = 0;
  const nowIso = new Date().toISOString();

  for (const event of events) {
    const label = whenLabel(event.date, event.startTime);
    const eventUrl = `${config.app.url}/events/${event.slug}`;

    for (const rsvp of event.rsvps) {
      await notify({
        userId: rsvp.user.id,
        type: "EVENT_REMINDER",
        title: "Event reminder",
        body: `"${event.title}" is coming up — ${label}`,
        link: `/events/${event.slug}`,
      });
      await sendEventReminderEmail({
        to: rsvp.user.email,
        name: rsvp.user.name,
        eventTitle: event.title,
        eventUrl,
        whenLabel: label,
        venue: event.venue ?? "",
      });
      await prisma.eventRsvp.update({
        where: { id: rsvp.id },
        data: { reminderSentAt: nowIso },
      });
      sent += 1;
    }
  }

  return { sent };
}
