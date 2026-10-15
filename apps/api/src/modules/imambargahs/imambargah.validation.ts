import { z } from "zod";

export const ImambargahQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ImambargahQueryInput = z.infer<typeof ImambargahQuerySchema>;

// Content fields for user submissions (POST /imambargahs). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateImambargahSchema = z.object({
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(1).max(60),
  area: z.string().trim().max(120).optional(),
  address: z.string().trim().min(3).max(500),
  googleMapsUrl: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  yearBuilt: z.string().trim().max(20).optional(),
  founderOrCaretaker: z.string().trim().max(200).optional(),
  contact: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
  confidence: z.string().trim().min(1).max(50),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateImambargahSchema = CreateImambargahSchema.partial();

export type CreateImambargahInput = z.infer<typeof CreateImambargahSchema>;
export type UpdateImambargahInput = z.infer<typeof UpdateImambargahSchema>;
