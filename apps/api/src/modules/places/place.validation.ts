import { z } from "zod";

export const PlaceQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  province: z.string().trim().max(60).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type PlaceQueryInput = z.infer<typeof PlaceQuerySchema>;

// Content fields for user submissions (POST /places). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreatePlaceSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: z.string().trim().min(1).max(60),
  type: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(60),
  province: z.string().trim().min(1).max(60),
  address: z.string().trim().min(3).max(500),
  mapLink: z.string().trim().max(500).optional(),
  builtYear: z.string().trim().max(20).optional(),
  builtBuilder: z.string().trim().max(200).optional(),
  unescoStatus: z.string().trim().max(80).optional(),
  timings: z.string().trim().max(300).optional(),
  ticket: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  sourceLink: z.string().trim().max(500).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdatePlaceSchema = CreatePlaceSchema.partial();

export type CreatePlaceInput = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlaceInput = z.infer<typeof UpdatePlaceSchema>;
