import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { prisma } from "../src/config/prisma";
import { config } from "../src/config";

export const api = () => request(app);

let counter = 0;

export function unique(prefix = "user"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
}

export async function registerUser(prefix = "user"): Promise<TestUser> {
  const email = `${unique(prefix)}@test.dev`;
  const password = "Password123!";

  const res = await api().post("/api/v1/auth/register").send({
    name: `Test ${prefix}`,
    email,
    password,
  });

  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    id: res.body.data.user.id,
    name: res.body.data.user.name,
    email,
    password,
    token: res.body.data.accessToken,
  };
}

export async function createAdmin(prefix = "admin"): Promise<TestUser> {
  const user = await registerUser(prefix);
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return user;
}

export async function promoteToAdmin(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { role: "ADMIN" } });
}

export async function createCategory(prefix = "Cat"): Promise<{ id: string; slug: string; name: string }> {
  const name = `${prefix} ${unique("cat")}`;
  const slug = unique("cat");
  return prisma.category.create({ data: { name, slug } });
}

export async function createEventAs(
  userId: string,
  categoryId: string,
  overrides: Partial<{ title: string; date: string; venue: string }> = {}
): Promise<{ id: string; slug: string; title: string }> {
  const title = overrides.title ?? `Test Event ${unique("ev")}`;
  const res = await api()
    .post("/api/v1/events")
    .set(authHeader(tokenFor(userId)))
    .send({
      title,
      categoryId,
      date: overrides.date ?? "2026-12-01",
      startTime: "18:00",
      endTime: "21:00",
      venue: overrides.venue ?? "Test Venue",
      description: "Created by test helper",
    });

  if (res.status !== 201) {
    throw new Error(`createEventAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { id: res.body.data.event.id, slug: res.body.data.event.slug, title };
}

// Sign a short-lived token directly (avoids a login round-trip)
export function tokenFor(userId: string): string {
  return jwt.sign(
    { sub: userId, email: `${userId}@test.dev`, role: "USER" },
    config.jwt.accessSecret,
    { expiresIn: "1h" }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 4);
}
