import { Router } from "express";
import * as AdminController from "./admin.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", AdminController.dashboard);

router.get("/events", AdminController.listEvents);
router.patch("/events/:id/approve", AdminController.approveEvent);
router.patch("/events/:id/reject", AdminController.rejectEvent);
router.patch("/events/:id/cancel", AdminController.cancelEvent);

router.get("/users", AdminController.listUsers);
router.patch("/users/:id/status", AdminController.updateUserStatus);

router.get("/reports", AdminController.listReports);
router.patch("/reports/:id", AdminController.resolveReport);

export default router;
