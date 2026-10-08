import { Router } from "express";
import * as NotificationController from "./notification.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

// All notification routes require auth
router.use(requireAuth);

router.get("/", NotificationController.list);
router.get("/unread-count", NotificationController.unreadCount);
router.patch("/read-all", NotificationController.markAllRead);
router.patch("/:id/read", NotificationController.markRead);

export default router;
