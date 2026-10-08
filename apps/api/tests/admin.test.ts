import { api, registerUser, createAdmin, createCategory, createEventAs, authHeader, TestUser, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

describe("Admin moderation & management", () => {
  let admin: TestUser;
  let creator: TestUser;
  let categoryId: string;

  beforeAll(async () => {
    admin = await createAdmin();
    creator = await registerUser("modcreator");
    const category = await createCategory();
    categoryId = category.id;
  });

  describe("access control", () => {
    it("requires authentication (401)", async () => {
      expect((await api().get("/api/v1/admin/dashboard")).status).toBe(401);
    });

    it("forbids regular users (403)", async () => {
      const res = await api().get("/api/v1/admin/dashboard").set(authHeader(creator.token));
      expect(res.status).toBe(403);
    });
  });

  describe("dashboard", () => {
    it("returns counts for an admin", async () => {
      const res = await api().get("/api/v1/admin/dashboard").set(authHeader(admin.token));
      expect(res.status).toBe(200);
      expect(typeof res.body.data.totalEvents).toBe("number");
      expect(typeof res.body.data.pendingEvents).toBe("number");
      expect(typeof res.body.data.totalUsers).toBe("number");
    });

    it("lists events with pagination", async () => {
      const res = await api().get("/api/v1/admin/events").set(authHeader(admin.token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe("event moderation", () => {
    it("approves an event, notifies the creator, and sets publishedAt", async () => {
      const event = await createEventAs(creator.id, categoryId);
      const res = await api()
        .patch(`/api/v1/admin/events/${event.id}/approve`)
        .set(authHeader(admin.token))
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("APPROVED");
      expect(res.body.data.rejectionReason).toBeNull();

      const notifications = await prisma.notification.findMany({
        where: { userId: creator.id, type: "EVENT_APPROVED" },
      });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it("rejects an event with a reason, persists it, and notifies the creator", async () => {
      const event = await createEventAs(creator.id, categoryId);
      const reason = `Policy violation ${unique("r")}`;

      const res = await api()
        .patch(`/api/v1/admin/events/${event.id}/reject`)
        .set(authHeader(admin.token))
        .send({ reason });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("REJECTED");
      expect(res.body.data.rejectionReason).toBe(reason);

      const stored = await prisma.event.findUnique({ where: { id: event.id } });
      expect(stored!.rejectionReason).toBe(reason);

      const notifications = await prisma.notification.findMany({
        where: { userId: creator.id, type: "EVENT_REJECTED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      });
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].body).toContain(reason);
    });

    it("rejects approval of a non-existent event with 404", async () => {
      const res = await api()
        .patch(`/api/v1/admin/events/${unique("missing")}/approve`)
        .set(authHeader(admin.token))
        .send({});
      expect(res.status).toBe(404);
    });
  });

  describe("user management", () => {
    it("lists users", async () => {
      const res = await api().get("/api/v1/admin/users").set(authHeader(admin.token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("deactivates a user, who can then no longer log in", async () => {
      const victim = await registerUser("victim");
      const res = await api()
        .patch(`/api/v1/admin/users/${victim.id}/status`)
        .set(authHeader(admin.token))
        .send({ isActive: false });
      expect(res.status).toBe(200);

      const login = await api()
        .post("/api/v1/auth/login")
        .send({ email: victim.email, password: victim.password });
      expect(login.status).toBe(401);
    });
  });

  describe("reports", () => {
    it("lists reports and resolves one", async () => {
      const event = await createEventAs(creator.id, categoryId);
      const reporter = await registerUser("rep");
      await api()
        .post(`/api/v1/events/${event.id}/reports`)
        .set(authHeader(reporter.token))
        .send({ reason: "SPAM" });

      const list = await api().get("/api/v1/admin/reports").set(authHeader(admin.token));
      expect(list.status).toBe(200);
      expect(list.body.data.length).toBeGreaterThan(0);
      const reportId = list.body.data[0].id;

      const resolved = await api()
        .patch(`/api/v1/admin/reports/${reportId}`)
        .set(authHeader(admin.token))
        .send({ status: "REVIEWED" });
      expect(resolved.status).toBe(200);
      expect(resolved.body.data.status).toBe("REVIEWED");
    });
  });
});
