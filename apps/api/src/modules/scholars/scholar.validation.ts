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
