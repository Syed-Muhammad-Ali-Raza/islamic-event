import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requireAuth } from "./middleware/auth.middleware";

// ─── Module routers ───────────────────────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes";
import eventRoutes from "./modules/events/event.routes";
import categoryRoutes from "./modules/categories/category.routes";
import organizerRoutes from "./modules/organizers/organizer.routes";
import peopleRoutes from "./modules/people/people.routes";
import savedEventRoutes from "./modules/saved-events/savedEvents.routes";
import { listSavedEvents } from "./modules/saved-events/savedEvents.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import adminRoutes from "./modules/admin/admin.routes";
import notificationRoutes from "./modules/notifications/notification.routes";

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── General rate limiter ─────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});

// Tighter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts.", code: "RATE_LIMITED" },
});

if (config.nodeEnv !== "test") {
  app.use(limiter);
}

// ─── Body & misc ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

if (config.nodeEnv !== "test") {
  app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const api = config.apiPrefix;

if (config.nodeEnv !== "test") {
  app.use(`${api}/auth`, authLimiter, authRoutes);
} else {
  app.use(`${api}/auth`, authRoutes);
}
app.use(`${api}/events`, eventRoutes);
app.use(`${api}/events`, savedEventRoutes);        // Save/unsave nested under events
app.use(`${api}/categories`, categoryRoutes);
app.use(`${api}/organizers`, organizerRoutes);
app.use(`${api}/people`, peopleRoutes);
app.use(`${api}/upload`, uploadRoutes);
app.use(`${api}/admin`, adminRoutes);
app.use(`${api}/notifications`, notificationRoutes);

// Profile / user routes
app.get(`${api}/users/me/saved-events`, requireAuth, listSavedEvents);

// ─── Error handling (must be last) ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
