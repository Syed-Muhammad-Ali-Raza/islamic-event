import { Router } from "express";
import * as OrganizerController from "./organizer.controller";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import {
  CreateOrganizerSchema,
  UpdateOrganizerSchema,
  AddMemberSchema,
  UpdateMemberSchema,
} from "./organizer.validation";

const router = Router();

// Public
router.get("/", OrganizerController.listOrganizers);
router.get("/:slug", OrganizerController.getOrganizer);

// Super admin only — organizations are created/edited/deactivated by the
// platform team; OWNER/ADMIN/EDITOR memberships are managed from the org
// dashboard (member management itself is super-admin only, see below).
router.post(
  "/",
  requireAuth,
  requireSuperAdmin,
  validateBody(CreateOrganizerSchema),
  OrganizerController.createOrganizer
);
router.patch(
  "/:id",
  requireAuth,
  requireSuperAdmin,
  validateBody(UpdateOrganizerSchema),
  OrganizerController.updateOrganizer
);
router.patch(
  "/:id/deactivate",
  requireAuth,
  requireSuperAdmin,
  OrganizerController.deactivateOrganizer
);
router.patch(
  "/:id/activate",
  requireAuth,
  requireSuperAdmin,
  OrganizerController.activateOrganizer
);

// Members — listing: super admin OR the org's OWNER/ADMIN (not EDITOR);
// mutations: super admin only.
router.get("/:id/members", requireAuth, OrganizerController.listMembers);
router.post(
  "/:id/members",
  requireAuth,
  requireSuperAdmin,
  validateBody(AddMemberSchema),
  OrganizerController.addMember
);
router.patch(
  "/:id/members/:userId",
  requireAuth,
  requireSuperAdmin,
  validateBody(UpdateMemberSchema),
  OrganizerController.updateMember
);
router.delete(
  "/:id/members/:userId",
  requireAuth,
  requireSuperAdmin,
  OrganizerController.removeMember
);

export default router;
