import { prisma } from "../config/prisma";

export type NotificationType =
  | "EVENT_APPROVED"
  | "EVENT_REJECTED"
  | "EVENT_CANCELLED"
  | "NEW_EVENT"
  | "SYSTEM";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Create an in-app notification. Never throws — notification failures must
 * not break the main flow (same contract as emails).
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notification] failed:", err instanceof Error ? err.message : err);
  }
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  for (const input of inputs) {
    await notify(input);
  }
}
