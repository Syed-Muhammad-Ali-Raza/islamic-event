import { z } from "zod";

export const ProcessionQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  month: z.enum(["Muharram", "Safar"]).optional(),
  day: z.string().trim().max(10).optional(),
  kind: z.enum(["procession", "road_closure", "summary"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ProcessionQueryInput = z.infer<typeof ProcessionQuerySchema>;

// Content fields for user submissions (POST /processions). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateProcessionSchema = z.object({
  city: z.string().trim().min(1).max(60),
  month: z.enum(["Muharram", "Safar"]),
  day: z.string().trim().min(1).max(20),
  kind: z.enum(["procession", "road_closure", "summary"]).optional(),
  name: z.string().trim().min(2).max(200),
  type: z.string().trim().max(100).optional(),
  start: z.string().trim().max(100).optional(),
  end: z.string().trim().max(100).optional(),
  route: z.string().trim().max(500).optional(),
  routeHighlights: z.string().trim().max(1000).optional(),
  time: z.string().trim().max(100).optional(),
  googleMaps: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateProcessionSchema = CreateProcessionSchema.partial();

export type CreateProcessionInput = z.infer<typeof CreateProcessionSchema>;
export type UpdateProcessionInput = z.infer<typeof UpdateProcessionSchema>;
