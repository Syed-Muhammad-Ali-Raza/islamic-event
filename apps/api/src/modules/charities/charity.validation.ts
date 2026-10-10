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
