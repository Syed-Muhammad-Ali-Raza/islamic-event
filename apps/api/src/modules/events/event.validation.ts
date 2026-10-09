import { z } from "zod";

const ParticipantInput = z.object({
  personId: z.string().min(1, "Person ID is required"),
  role: z.enum([
    "KHATEEB", "ZAKIR", "SPEAKER", "NAAT_KHAWAN", "QARI",
    "RECITER", "HOST", "GUEST", "SCHOLAR", "ORGANIZER", "MUAZZIN", "OTHER",
  ]),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const CreateEventSchema = z.object({
  title: z
    .string({ required_error: "Event title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),

  description: z.string().max(5000).optional(),

  categoryId: z.string({ required_error: "Category is required" }).min(1),

  organizerId: z.string().optional(),

  date: z
    .string({ required_error: "Event date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format")
    .optional(),

  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format")
    .optional(),

  countryId: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  areaId: z.string().optional(),

  venue: z.string().max(300).optional(),
  address: z.string().max(500).optional(),

  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  participants: z.array(ParticipantInput).max(50).optional().default([]),
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z
    .enum(["DRAFT", "PENDING_REVIEW"])
    .optional(),
});

export const EventQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fromDate must be in YYYY-MM-DD format").optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "toDate must be in YYYY-MM-DD format").optional(),
  organizer: z.string().optional(),
  status: z.enum(["APPROVED", "PENDING_REVIEW", "REJECTED", "DRAFT", "CANCELLED", "COMPLETED"]).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type EventQueryInput = z.infer<typeof EventQuerySchema>;

export const ReportEventSchema = z.object({
  reason: z.enum([
    "FAKE_INFORMATION", "WRONG_LOCATION", "WRONG_DATE", "DUPLICATE",
    "SPAM", "OFFENSIVE_CONTENT", "EVENT_CANCELLED", "OTHER",
  ]),
  description: z.string().max(1000).optional(),
});

export type ReportEventInput = z.infer<typeof ReportEventSchema>;

export const RsvpSchema = z.object({
  type: z.enum(["INTERESTED", "ATTENDING"], {
    required_error: "RSVP type is required",
    invalid_type_error: "RSVP type must be INTERESTED or ATTENDING",
  }),
});

export type RsvpInput = z.infer<typeof RsvpSchema>;
