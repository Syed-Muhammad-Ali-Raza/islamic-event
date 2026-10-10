import { z } from "zod";

export const ImambargahQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ImambargahQueryInput = z.infer<typeof ImambargahQuerySchema>;
