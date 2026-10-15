import { z } from "zod";

export const ScholarQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  sect: z.enum(["SUNNI", "SHIA"]).optional(),
  category: z.enum(["SCHOLAR", "MARJA", "KHATEEB"]).optional(),
  city: z.string().trim().max(80).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ScholarQueryInput = z.infer<typeof ScholarQuerySchema>;

// Content fields for user submissions (POST /scholars). sourceId AND slug
// are generated server-side; moderation fields are never client-settable.
export const CreateScholarSchema = z.object({
  name: z.string().trim().min(2).max(200),
  nameUrdu: z.string().trim().max(200).optional(),
  honorific: z.string().trim().max(100).optional(),
  sect: z.enum(["SUNNI", "SHIA"]),
  category: z.enum(["SCHOLAR", "MARJA", "KHATEEB"]),
  status: z.string().trim().max(30).optional(),
  birthDate: z.string().trim().max(30).optional(),
  deathDate: z.string().trim().max(30).optional(),
  city: z.string().trim().max(60).optional(),
  country: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(5000).optional(),
  education: z.string().trim().max(3000).optional(),
  works: z.array(z.string().trim().max(300)).max(50).optional(),
  officialLinks: z.string().trim().max(1000).optional(),
  photoUrl: z.string().trim().max(500).optional(),
  photoCredit: z.string().trim().max(300).optional(),
  photoLicense: z.string().trim().max(300).optional(),
  sources: z.unknown().optional(),
  confidence: z.string().trim().max(30).optional(),
  lastVerified: z.string().trim().max(30).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateScholarSchema = CreateScholarSchema.partial();

export type CreateScholarInput = z.infer<typeof CreateScholarSchema>;
export type UpdateScholarInput = z.infer<typeof UpdateScholarSchema>;
