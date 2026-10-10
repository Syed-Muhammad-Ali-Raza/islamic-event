import { Router } from "express";
import * as EventController from "./event.controller";
import { requireAuth, optionalAuth } from "../../middleware/auth.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import { CreateEventSchema, UpdateEventSchema, EventQuerySchema, ReportEventSchema, RsvpSchema, CheckinSchema } from "./event.validation";

const router = Router();

// GET /api/v1/events
router.get("/", optionalAuth, validateQuery(EventQuerySchema), EventController.listEvents);

// GET /api/v1/events/mine  (must be registered before /:slug)
router.get("/mine", requireAuth, EventController.getMyEvents);

// GET /api/v1/events/:slug
router.get("/:slug", optionalAuth, EventController.getEvent);

// POST /api/v1/events
router.post("/", requireAuth, validateBody(CreateEventSchema), EventController.createEvent);

// POST /api/v1/events/:id/reports
router.post("/:id/reports", requireAuth, validateBody(ReportEventSchema), EventController.reportEvent);

// GET /api/v1/events/:id/rsvps  (organizer/admin only)
router.get("/:id/rsvps", requireAuth, EventController.getEventRsvps);

// GET /api/v1/events/:id/rsvps/export  (organizer/admin only)
router.get("/:id/rsvps/export", requireAuth, EventController.exportEventRsvps);

// GET /api/v1/events/:id/rsvps/me  (my RSVP + QR token)
router.get("/:id/rsvps/me", requireAuth, EventController.getMyRsvp);

// POST /api/v1/events/:id/checkins  (organizer/admin scans an attendee QR)
router.post("/:id/checkins", requireAuth, validateBody(CheckinSchema), EventController.checkInAttendee);

// DELETE /api/v1/events/:id/checkins/:rsvpId  (undo a check-in)
router.delete("/:id/checkins/:rsvpId", requireAuth, EventController.undoCheckIn);

// PUT /api/v1/events/:id/rsvps
router.put("/:id/rsvps", requireAuth, validateBody(RsvpSchema), EventController.setRsvp);

// DELETE /api/v1/events/:id/rsvps
router.delete("/:id/rsvps", requireAuth, EventController.removeRsvp);

// PATCH /api/v1/events/:id
router.patch("/:id", requireAuth, validateBody(UpdateEventSchema), EventController.updateEvent);

// DELETE /api/v1/events/:id
router.delete("/:id", requireAuth, EventController.deleteEvent);

export default router;
