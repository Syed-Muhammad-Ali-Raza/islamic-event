import { z } from "zod";

// GET /cities?q= — the homepage city picker types into this. `q` is trimmed and
// capped so a pathological URL cannot turn into a huge ILIKE pattern.
export const CityQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export type CityQueryInput = z.infer<typeof CityQuerySchema>;
