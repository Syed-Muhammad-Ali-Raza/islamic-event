import { z } from "zod";

export const DarbarQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(60).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type DarbarQueryInput = z.infer<typeof DarbarQuerySchema>;

// Content fields for user submissions (POST /darbars). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateDarbarSchema = z.object({
  name: z.string().trim().min(2).max(200),
  saint: z.string().trim().min(1).max(200),
  saintDeathYear: z.string().trim().max(20).optional(),
  ursDate: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1).max(60),
  province: z.string().trim().min(1).max(60),
  address: z.string().trim().min(3).max(500),
  mapLink: z.string().trim().max(500).optional(),
  timings: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  sourceLink: z.string().trim().max(500).optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateDarbarSchema = CreateDarbarSchema.partial();

export type CreateDarbarInput = z.infer<typeof CreateDarbarSchema>;
export type UpdateDarbarInput = z.infer<typeof UpdateDarbarSchema>;
