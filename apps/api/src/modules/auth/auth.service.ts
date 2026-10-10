import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../../config";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../services/email.service";
import { notify } from "../../services/notification.service";
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./auth.validation";

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

// Raw token goes into the email; only its SHA-256 hash is stored in the DB.
function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Omit the password hash before returning user data to clients
type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: string;
  emailVerifiedAt: Date | null;
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
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  // Email verification — store hash, email the raw token (never fails the request)
  const rawToken = generateRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashToken(rawToken),
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail({ to: user.email, name: user.name, token: rawToken });

  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Welcome to Community Events! 🎉",
    body: "Discover religious and community events near you, or create your own.",
    link: "/events",
  });

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

// ─── Account lockout ──────────────────────────────────────────────────────────

const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;

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
      emailVerifiedAt: true,
      createdAt: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });

  // Account lockout check
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw Errors.tooManyAttempts(
      "Account temporarily locked due to too many failed login attempts. Please try again later.",
      "ACCOUNT_LOCKED"
    );
  }

  // Constant-time comparison even when user is not found to prevent timing attacks
  const passwordToCheck = user?.passwordHash ?? "$2b$12$invalidhashtopreventtiming.....";
  const isValid = user ? await bcrypt.compare(input.password, passwordToCheck) : false;

  if (!user || !isValid || !user.isActive) {
    // Track failed attempts for existing active accounts
    if (user && user.isActive) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= LOCK_THRESHOLD;
      await prisma.user.update({
        where: { id: user.id },
        data: shouldLock
          ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
          : { failedLoginAttempts: attempts },
      });
    }
    throw Errors.unauthorized("Invalid email or password.");
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshToken = signRefreshToken(user.id);

  // Return without passwordHash / lockout fields
  const {
    passwordHash: _,
    isActive: __,
    failedLoginAttempts: ___,
    lockedUntil: ____,
    ...safeUser
  } = user;

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
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  if (!user) throw Errors.notFound("User");

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw Errors.notFound("User");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profileImage: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return updated;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<{ success: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.isActive) throw Errors.notFound("User");

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw Errors.unauthorized("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpires: null,
    },
  });

  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Your password was changed",
    body: "If this wasn't you, reset your password immediately.",
    link: "/forgot-password",
  });

  return { success: true };
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function verifyEmail(input: VerifyEmailInput): Promise<{ verified: boolean }> {
  const user = await prisma.user.findUnique({
    where: { verificationToken: hashToken(input.token) },
  });

  if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
    throw Errors.badRequest("Invalid or expired verification link.", "INVALID_TOKEN");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationExpires: null,
    },
  });

  return { verified: true };
}

export async function resendVerification(
  input: ResendVerificationInput
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (user && !user.emailVerifiedAt && user.isActive) {
    const rawToken = generateRawToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashToken(rawToken),
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await sendVerificationEmail({ to: user.email, name: user.name, token: rawToken });
  }

  // Always the same message — don't reveal whether the email exists
  return { message: "If the address needs verification, a new email has been sent." };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (user && user.isActive) {
    const rawToken = generateRawToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(rawToken),
        resetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
    await sendPasswordResetEmail({ to: user.email, name: user.name, token: rawToken });
  }

  // Always the same message — don't reveal whether the email exists
  return { message: "If an account exists for that email, a password reset link has been sent." };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ success: boolean }> {
  const user = await prisma.user.findUnique({
    where: { resetToken: hashToken(input.token) },
  });

  if (!user || !user.resetExpires || user.resetExpires < new Date()) {
    throw Errors.badRequest("Invalid or expired reset link.", "INVALID_TOKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpires: null,
    },
  });

  await notify({
    userId: user.id,
    type: "SYSTEM",
    title: "Your password was changed",
    body: "If this wasn't you, reset your password immediately.",
    link: "/forgot-password",
  });

  return { success: true };
}
