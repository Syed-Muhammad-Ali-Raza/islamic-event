import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";

export async function listNotifications(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, page, limit, total, unreadCount };
}

export async function getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
  const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });
  return { unreadCount };
}

export async function markRead(userId: string, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw Errors.notFound("Notification");
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
  });
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
