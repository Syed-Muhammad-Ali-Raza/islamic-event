import { z } from "zod";

export const UrsDateQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  researched: z.enum(["true", "false"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UrsDateQueryInput = z.infer<typeof UrsDateQuerySchema>;
