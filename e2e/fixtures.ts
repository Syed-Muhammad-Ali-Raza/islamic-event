import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";

export const unique = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export interface AuthTokens {
  user: { id: string; name: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
}

const API = process.env.E2E_API_URL ?? "http://localhost:4000";
// Super-admin credentials must match what the database was seeded with.
// Read from the same env vars the seed uses (CI sets them at job level;
// locally playwright.config.ts loads apps/api/.env and the repo-root .env).
// E2E_ADMIN_* stay as explicit overrides for ad-hoc runs. No hardcoded
// fallback: the old "Admin@123456" default was a published credential.
const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL?.trim() ||
  process.env.SEED_SUPER_ADMIN_EMAIL?.trim() ||
  "admin@communityevents.pk";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD?.trim() ||
  process.env.SEED_SUPER_ADMIN_PASSWORD?.trim();

/** Register a fresh user via the API and return tokens. */
export async function registerViaApi(
  request: APIRequestContext,
  overrides: { name?: string; email?: string; password?: string } = {}
): Promise<AuthTokens> {
  const email = overrides.email ?? `${unique("e2e")}@example.com`;
  const password = overrides.password ?? "E2ePass@123";
  const name = overrides.name ?? "E2E User";

  const res = await request.post(`${API}/api/v1/auth/register`, {
    data: { name, email, password },
  });
  if (!res.ok()) {
    throw new Error(`registerViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.data as AuthTokens;
}

/** Login an existing user via the API and return tokens. */
export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password = "E2ePass@123"
): Promise<AuthTokens> {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`loginViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.data as AuthTokens;
}

/** Login the seeded super admin account (for moderation flows). */
export async function loginAdminViaApi(request: APIRequestContext): Promise<AuthTokens> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      "Seeded super-admin password not configured: set SEED_SUPER_ADMIN_PASSWORD " +
        "(same value used with `npm run db:seed`) in the environment or .env."
    );
  }
  return loginViaApi(request, ADMIN_EMAIL, ADMIN_PASSWORD);
}

/**
 * Seed the browser's zustand auth-storage with tokens so the app
 * treats the page as logged-in without going through the UI login form.
 */
export async function seedAuth(page: Page, tokens: AuthTokens): Promise<void> {
  const storage = {
    state: {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    },
    version: 0,
  };
  await page.addInitScript((value) => {
    window.localStorage.setItem("auth-storage", JSON.stringify(value));
  }, storage);
}

export interface CreatedEvent {
  id: string;
  slug: string;
  title: string;
}

/** Create a draft event via the API (returns PENDING_REVIEW event). */
export async function createEventViaApi(
  request: APIRequestContext,
  tokens: AuthTokens,
  overrides: { title?: string; date?: string } = {}
): Promise<CreatedEvent> {
  const catsRes = await request.get(`${API}/api/v1/categories?limit=1`);
  const catsBody = await catsRes.json();
  const categoryId = catsBody?.data?.[0]?.id;
  if (!categoryId) throw new Error("No categories seeded — run db:seed first");

  const title = overrides.title ?? `E2E Event ${unique("t")}`;
  const date = overrides.date ?? "2027-01-15";

  const res = await request.post(`${API}/api/v1/events`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    data: {
      title,
      categoryId,
      description: "Created by Playwright E2E suite",
      date,
      startTime: "18:00",
      endTime: "20:00",
      venue: "E2E Test Venue",
      address: "123 Test Street, Lahore",
    },
  });
  if (!res.ok()) {
    throw new Error(`createEventViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  const event = body.data?.event ?? body.data;
  return { id: event.id, slug: event.slug, title: event.title };
}

/** Approve a PENDING_REVIEW event as the seeded admin (so it becomes public). */
export async function approveEventViaApi(
  request: APIRequestContext,
  eventId: string
): Promise<void> {
  const admin = await loginAdminViaApi(request);
  const res = await request.patch(`${API}/api/v1/admin/events/${eventId}/approve`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  if (!res.ok()) {
    throw new Error(`approveEventViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

export interface CreatedOrg {
  id: string;
  slug: string;
  name: string;
}

/** Create an organization as the seeded super admin (org management API). */
export async function createOrgViaApi(
  request: APIRequestContext,
  name = `E2E Org ${unique("o")}`
): Promise<CreatedOrg> {
  const admin = await loginAdminViaApi(request);
  const res = await request.post(`${API}/api/v1/organizers`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    data: { name },
  });
  if (!res.ok()) {
    throw new Error(`createOrgViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.data as CreatedOrg;
}

/** Add an existing user to an org with a role (super admin only). */
export async function addMemberViaApi(
  request: APIRequestContext,
  orgId: string,
  email: string,
  role: "OWNER" | "ADMIN" | "EDITOR"
): Promise<void> {
  const admin = await loginAdminViaApi(request);
  const res = await request.post(`${API}/api/v1/organizers/${orgId}/members`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    data: { email, role },
  });
  if (!res.ok()) {
    throw new Error(`addMemberViaApi failed: ${res.status()} ${await res.text()}`);
  }
}

export const test = base.extend<{ auth: AuthTokens }>({
  auth: async ({ request }, use) => {
    const tokens = await registerViaApi(request);
    await use(tokens);
  },
});

export { expect };
