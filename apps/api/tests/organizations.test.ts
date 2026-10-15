import {
  api,
  registerUser,
  createSuperAdmin,
  createAdmin,
  unique,
  authHeader,
} from "./helpers";

interface TestOrg {
  id: string;
  slug: string;
  name: string;
}

async function createOrg(adminToken: string): Promise<TestOrg> {
  const res = await api()
    .post("/api/v1/organizers")
    .set(authHeader(adminToken))
    .send({ name: `Org ${unique("org")}` });
  if (res.status !== 201) {
    throw new Error(`createOrg failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

function addMember(
  adminToken: string,
  orgId: string,
  email: string,
  role?: string
) {
  return api()
    .post(`/api/v1/organizers/${orgId}/members`)
    .set(authHeader(adminToken))
    .send(role ? { email, role } : { email });
}

describe("POST /api/v1/organizers — legacy ADMIN compatibility", () => {
  it("still allows a legacy ADMIN to create organizations", async () => {
    const legacy = await createAdmin("orglegacy");
    const org = await createOrg(legacy.token);
    expect(org.id).toEqual(expect.any(String));
  });
});

describe("PATCH /api/v1/organizers/:id", () => {
  it("requires authentication", async () => {
    const res = await api().patch("/api/v1/organizers/any-id").send({ name: "X" });
    expect(res.status).toBe(401);
  });

  it("rejects a normal user with 403", async () => {
    const admin = await createSuperAdmin("orgedit");
    const org = await createOrg(admin.token);
    const user = await registerUser("orgedit");
    const res = await api()
      .patch(`/api/v1/organizers/${org.id}`)
      .set(authHeader(user.token))
      .send({ description: "Hijacked" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("lets a super admin update the organization", async () => {
    const admin = await createSuperAdmin("orgeditok");
    const org = await createOrg(admin.token);
    const description = `Updated ${unique("desc")}`;
    const res = await api()
      .patch(`/api/v1/organizers/${org.id}`)
      .set(authHeader(admin.token))
      .send({ description });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe(description);

    const fetched = await api().get(`/api/v1/organizers/${org.slug}`);
    expect(fetched.body.data.description).toBe(description);
  });

  it("returns 404 for an unknown id", async () => {
    const admin = await createSuperAdmin("orgedit404");
    const res = await api()
      .patch(`/api/v1/organizers/${unique("ghost")}`)
      .set(authHeader(admin.token))
      .send({ description: "Nope" });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/organizers/:id/deactivate + /activate", () => {
  it("rejects a normal user with 403", async () => {
    const admin = await createSuperAdmin("orgdeact");
    const org = await createOrg(admin.token);
    const user = await registerUser("orgdeact");
    const res = await api()
      .patch(`/api/v1/organizers/${org.id}/deactivate`)
      .set(authHeader(user.token));
    expect(res.status).toBe(403);
  });

  it("hides a deactivated organization from public endpoints until reactivated", async () => {
    const admin = await createSuperAdmin("orgdeact2");
    const org = await createOrg(admin.token);

    const deactivate = await api()
      .patch(`/api/v1/organizers/${org.id}/deactivate`)
      .set(authHeader(admin.token));
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.data.isActive).toBe(false);

    // Public detail 404s and list excludes it
    const detail = await api().get(`/api/v1/organizers/${org.slug}`);
    expect(detail.status).toBe(404);
    const list = await api().get(`/api/v1/organizers?search=${encodeURIComponent(org.name)}`);
    expect(list.body.data.map((o: TestOrg) => o.id)).not.toContain(org.id);

    const activate = await api()
      .patch(`/api/v1/organizers/${org.id}/activate`)
      .set(authHeader(admin.token));
    expect(activate.status).toBe(200);
    expect(activate.body.data.isActive).toBe(true);

    const restored = await api().get(`/api/v1/organizers/${org.slug}`);
    expect(restored.status).toBe(200);
  });
});

describe("organization members", () => {
  describe("POST /api/v1/organizers/:id/members", () => {
    it("requires authentication", async () => {
      const res = await api().post("/api/v1/organizers/any/members").send({ email: "x@y.z" });
      expect(res.status).toBe(401);
    });

    it("rejects a normal user with 403", async () => {
      const admin = await createSuperAdmin("memadd");
      const org = await createOrg(admin.token);
      const user = await registerUser("memadd");
      const res = await addMember(user.token, org.id, "someone@example.com", "EDITOR");
      expect(res.status).toBe(403);
    });

    it("returns 404 for an unknown organization", async () => {
      const admin = await createSuperAdmin("memadd404");
      const user = await registerUser("memadd404");
      const res = await addMember(admin.token, unique("ghostorg"), user.email);
      expect(res.status).toBe(404);
    });

    it("returns 404 when the user email does not exist", async () => {
      const admin = await createSuperAdmin("memaddnouser");
      const org = await createOrg(admin.token);
      const res = await addMember(admin.token, org.id, `${unique("ghost")}@example.com`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("USER_NOT_FOUND");
    });

    it("adds an existing user with the requested role", async () => {
      const admin = await createSuperAdmin("memaddok");
      const org = await createOrg(admin.token);
      const user = await registerUser("memaddok");
      const res = await addMember(admin.token, org.id, user.email, "EDITOR");
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe("EDITOR");
      expect(res.body.data.user.id).toBe(user.id);
    });

    it("defaults the role to ADMIN when omitted", async () => {
      const admin = await createSuperAdmin("memadddef");
      const org = await createOrg(admin.token);
      const user = await registerUser("memadddef");
      const res = await addMember(admin.token, org.id, user.email);
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe("ADMIN");
    });

    it("rejects an invalid role with 422", async () => {
      const admin = await createSuperAdmin("memaddbad");
      const org = await createOrg(admin.token);
      const user = await registerUser("memaddbad");
      const res = await addMember(admin.token, org.id, user.email, "BOSS");
      expect(res.status).toBe(422);
    });

    it("returns 409 when the user is already a member", async () => {
      const admin = await createSuperAdmin("memadddup");
      const org = await createOrg(admin.token);
      const user = await registerUser("memadddup");
      const first = await addMember(admin.token, org.id, user.email, "EDITOR");
      expect(first.status).toBe(201);
      const second = await addMember(admin.token, org.id, user.email, "ADMIN");
      expect(second.status).toBe(409);
      expect(second.body.code).toBe("ALREADY_MEMBER");
    });
  });

  describe("GET /api/v1/organizers/:id/members", () => {
    it("lets a super admin list members", async () => {
      const admin = await createSuperAdmin("memlist");
      const org = await createOrg(admin.token);
      const user = await registerUser("memlist");
      await addMember(admin.token, org.id, user.email, "EDITOR");

      const res = await api()
        .get(`/api/v1/organizers/${org.id}/members`)
        .set(authHeader(admin.token));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].user.email).toBe(user.email);
    });

    it("lets an org ADMIN member list members", async () => {
      const admin = await createSuperAdmin("memlist2");
      const org = await createOrg(admin.token);
      const member = await registerUser("memlist2");
      await addMember(admin.token, org.id, member.email, "ADMIN");

      const res = await api()
        .get(`/api/v1/organizers/${org.id}/members`)
        .set(authHeader(member.token));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("rejects an org EDITOR with 403", async () => {
      const admin = await createSuperAdmin("memlist3");
      const org = await createOrg(admin.token);
      const editor = await registerUser("memlist3");
      await addMember(admin.token, org.id, editor.email, "EDITOR");

      const res = await api()
        .get(`/api/v1/organizers/${org.id}/members`)
        .set(authHeader(editor.token));
      expect(res.status).toBe(403);
    });

    it("rejects a non-member with 403", async () => {
      const admin = await createSuperAdmin("memlist4");
      const org = await createOrg(admin.token);
      const outsider = await registerUser("memlist4");

      const res = await api()
        .get(`/api/v1/organizers/${org.id}/members`)
        .set(authHeader(outsider.token));
      expect(res.status).toBe(403);
    });

    it("returns 404 for an unknown organization", async () => {
      const admin = await createSuperAdmin("memlist5");
      const res = await api()
        .get(`/api/v1/organizers/${unique("ghostorg")}/members`)
        .set(authHeader(admin.token));
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/organizers/:id/members/:userId", () => {
    it("rejects a normal user with 403", async () => {
      const admin = await createSuperAdmin("memupd");
      const org = await createOrg(admin.token);
      const user = await registerUser("memupd");
      const res = await api()
        .patch(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(user.token))
        .send({ role: "OWNER" });
      expect(res.status).toBe(403);
    });

    it("updates the member role", async () => {
      const admin = await createSuperAdmin("memupdok");
      const org = await createOrg(admin.token);
      const user = await registerUser("memupdok");
      await addMember(admin.token, org.id, user.email, "EDITOR");

      const res = await api()
        .patch(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(admin.token))
        .send({ role: "OWNER" });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("OWNER");
    });

    it("returns 404 for a non-member", async () => {
      const admin = await createSuperAdmin("memupd404");
      const org = await createOrg(admin.token);
      const user = await registerUser("memupd404");
      const res = await api()
        .patch(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(admin.token))
        .send({ role: "ADMIN" });
      expect(res.status).toBe(404);
    });

    it("rejects an invalid role with 422", async () => {
      const admin = await createSuperAdmin("memupdbad");
      const org = await createOrg(admin.token);
      const user = await registerUser("memupdbad");
      await addMember(admin.token, org.id, user.email, "EDITOR");
      const res = await api()
        .patch(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(admin.token))
        .send({ role: "BOSS" });
      expect(res.status).toBe(422);
    });
  });

  describe("DELETE /api/v1/organizers/:id/members/:userId", () => {
    it("rejects a normal user with 403", async () => {
      const admin = await createSuperAdmin("memdel");
      const org = await createOrg(admin.token);
      const user = await registerUser("memdel");
      const res = await api()
        .delete(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(user.token));
      expect(res.status).toBe(403);
    });

    it("removes the member", async () => {
      const admin = await createSuperAdmin("memdelok");
      const org = await createOrg(admin.token);
      const user = await registerUser("memdelok");
      await addMember(admin.token, org.id, user.email, "EDITOR");

      const res = await api()
        .delete(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(admin.token));
      expect(res.status).toBe(200);

      const list = await api()
        .get(`/api/v1/organizers/${org.id}/members`)
        .set(authHeader(admin.token));
      expect(list.body.data).toHaveLength(0);

      const me = await api()
        .get("/api/v1/users/me/organizations")
        .set(authHeader(user.token));
      expect(me.body.data).toHaveLength(0);
    });

    it("returns 404 for a non-member", async () => {
      const admin = await createSuperAdmin("memdel404");
      const org = await createOrg(admin.token);
      const user = await registerUser("memdel404");
      const res = await api()
        .delete(`/api/v1/organizers/${org.id}/members/${user.id}`)
        .set(authHeader(admin.token));
      expect(res.status).toBe(404);
    });
  });
});

describe("GET /api/v1/users/me/organizations", () => {
  it("requires authentication", async () => {
    const res = await api().get("/api/v1/users/me/organizations");
    expect(res.status).toBe(401);
  });

  it("returns an empty list for a user with no memberships", async () => {
    const user = await registerUser("meorg-empty");
    const res = await api()
      .get("/api/v1/users/me/organizations")
      .set(authHeader(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("lists the caller's membership with org details and role", async () => {
    const admin = await createSuperAdmin("meorg");
    const org = await createOrg(admin.token);
    const user = await registerUser("meorg");
    await addMember(admin.token, org.id, user.email, "EDITOR");

    const res = await api()
      .get("/api/v1/users/me/organizations")
      .set(authHeader(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const membership = res.body.data[0];
    expect(membership.role).toBe("EDITOR");
    expect(membership.organizer.id).toBe(org.id);
    expect(membership.organizer.slug).toBe(org.slug);
  });
});
