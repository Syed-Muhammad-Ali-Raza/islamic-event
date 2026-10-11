import { z } from "zod";

export const AuqafUrsDateQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  zone: z.string().trim().max(80).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type AuqafUrsDateQueryInput = z.infer<typeof AuqafUrsDateQuerySchema>;
