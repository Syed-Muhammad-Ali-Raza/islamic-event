import { z } from "zod";

export const ProcessionQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  month: z.enum(["Muharram", "Safar"]).optional(),
  day: z.string().trim().max(10).optional(),
  kind: z.enum(["procession", "road_closure", "summary"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ProcessionQueryInput = z.infer<typeof ProcessionQuerySchema>;
