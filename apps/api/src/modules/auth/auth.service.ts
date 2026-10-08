import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { RegisterInput, LoginInput } from "./auth.validation";

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { sub: userId, email, role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] }
  );
}

function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"] }
  );
}

// Omit the password hash before returning user data to clients
type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: string;
  createdAt: Date;
};

// ─── Service methods ──────────────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    // Use a generic message — don't reveal whether email exists
    throw Errors.conflict("Registration failed. Please check your details.", "REGISTRATION_FAILED");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profileImage: true,
      role: true,
      passwordHash: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Constant-time comparison even when user is not found to prevent timing attacks
  const passwordToCheck = user?.passwordHash ?? "$2b$12$invalidhashtopreventtiming.....";
  const isValid = user ? await bcrypt.compare(input.password, passwordToCheck) : false;

  if (!user || !isValid || !user.isActive) {
    throw Errors.unauthorized("Invalid email or password.");
  }

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken(user.id);

  // Return without passwordHash
  const { passwordHash: _, isActive: __, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshTokens(token: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
  } catch {
    throw Errors.unauthorized("Invalid or expired refresh token.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw Errors.unauthorized("Account not found or has been deactivated.");
  }

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken(user.id);

  return { accessToken, refreshToken };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) throw Errors.notFound("User");

  return user;
}
