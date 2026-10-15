import { z } from "zod";

export const MelaQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(60).optional(),
  type: z.string().trim().max(80).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type MelaQueryInput = z.infer<typeof MelaQuerySchema>;

// Content fields for user submissions (POST /melas). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateMelaSchema = z.object({
  name: z.string().trim().min(2).max(200),
  type: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1).max(60),
  province: z.string().trim().min(1).max(60),
  venue: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  googleMapsUrl: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  whenHeld: z.string().trim().max(200).optional(),
  duration: z.string().trim().max(100).optional(),
  history: z.string().trim().max(3000).optional(),
  whatHappens: z.string().trim().max(3000).optional(),
  statusNotes: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(500).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateMelaSchema = CreateMelaSchema.partial();

export type CreateMelaInput = z.infer<typeof CreateMelaSchema>;
export type UpdateMelaInput = z.infer<typeof UpdateMelaSchema>;
