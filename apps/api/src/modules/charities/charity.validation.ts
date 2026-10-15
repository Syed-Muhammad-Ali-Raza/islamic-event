import { z } from "zod";

export const CharityQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  country: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  policy: z.enum(["100"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CharityQueryInput = z.infer<typeof CharityQuerySchema>;

// Content fields for user submissions (POST /charities). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateCharitySchema = z.object({
  name: z.string().trim().min(2).max(200),
  country: z.string().trim().min(1).max(60),
  province: z.string().trim().min(1).max(60),
  city: z.string().trim().min(1).max(60),
  type: z.string().trim().max(80).optional(),
  focus: z.string().trim().max(500).optional(),
  policyNote: z.string().trim().max(500).optional(),
  address: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsLink: z.string().trim().max(500).optional(),
  contactNumbers: z.string().trim().max(300).optional(),
  founded: z.string().trim().max(20).optional(),
  founder: z.string().trim().max(200).optional(),
  website: z.string().trim().max(500).optional(),
  registration: z.string().trim().max(100).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateCharitySchema = CreateCharitySchema.partial();

export type CreateCharityInput = z.infer<typeof CreateCharitySchema>;
export type UpdateCharityInput = z.infer<typeof UpdateCharitySchema>;
