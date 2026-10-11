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
