import { z } from "zod";

export const DastarkhwanQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type DastarkhwanQueryInput = z.infer<typeof DastarkhwanQuerySchema>;

// Content fields for user submissions (POST /dastarkhwans). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateDastarkhwanSchema = z.object({
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(1).max(60),
  area: z.string().trim().max(120).optional(),
  address: z.string().trim().min(3).max(500),
  googleMapsUrl: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  type: z.string().trim().min(1).max(60),
  schedule: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
  sourceYear: z.string().trim().max(10).optional(),
  notes: z.string().trim().max(2000).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateDastarkhwanSchema = CreateDastarkhwanSchema.partial();

export type CreateDastarkhwanInput = z.infer<typeof CreateDastarkhwanSchema>;
export type UpdateDastarkhwanInput = z.infer<typeof UpdateDastarkhwanSchema>;
