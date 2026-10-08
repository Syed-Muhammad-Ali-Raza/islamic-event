import { api, registerUser, authHeader, TestUser } from "./helpers";
import { prisma } from "../src/config/prisma";

interface ListBody {
  data: Array<{ id: string; readAt: string | null }>;
  unreadCount: number;
}

describe("Notifications", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await registerUser("notif");
  });

  it("requires auth (401)", async () => {
    expect((await api().get("/api/v1/notifications")).status).toBe(401);
    expect((await api().get("/api/v1/notifications/unread-count")).status).toBe(401);
  });

  it("sends a welcome notification on registration", async () => {
    const count = await prisma.notification.count({ where: { userId: user.id } });
    expect(count).toBeGreaterThan(0);
  });

  it("lists notifications with an unread count", async () => {
    const res = await api().get("/api/v1/notifications").set(authHeader(user.token));
    expect(res.status).toBe(200);
    const body = res.body as ListBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.unreadCount).toBe("number");
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.unreadCount).toBeGreaterThan(0);
  });

  it("reports the unread count", async () => {
    const res = await api().get("/api/v1/notifications/unread-count").set(authHeader(user.token));
    expect(res.status).toBe(200);
    expect(typeof res.body.data.unreadCount).toBe("number");
    expect(res.body.data.unreadCount).toBeGreaterThan(0);
  });

  it("marks a single notification as read", async () => {
    const list = await api().get("/api/v1/notifications").set(authHeader(user.token));
    const body = list.body as ListBody;
    const first = body.data[0];
    const before = body.unreadCount;

    const res = await api()
      .patch(`/api/v1/notifications/${first.id}/read`)
      .set(authHeader(user.token));
    expect(res.status).toBe(200);

    const after = await api().get("/api/v1/notifications/unread-count").set(authHeader(user.token));
    expect(after.body.data.unreadCount).toBe(Math.max(0, before - 1));
  });

  it("marks all notifications as read", async () => {
    const res = await api()
      .patch("/api/v1/notifications/read-all")
      .set(authHeader(user.token));
    expect(res.status).toBe(200);

    const after = await api().get("/api/v1/notifications/unread-count").set(authHeader(user.token));
    expect(after.body.data.unreadCount).toBe(0);
  });

  it("404s when touching another user's notification", async () => {
    const other = await registerUser("notif2");
    const list = await api().get("/api/v1/notifications").set(authHeader(other.token));
    const theirNotification = (list.body as ListBody).data[0];

    const res = await api()
      .patch(`/api/v1/notifications/${theirNotification.id}/read`)
      .set(authHeader(user.token));
    expect(res.status).toBe(404);
  });
});
