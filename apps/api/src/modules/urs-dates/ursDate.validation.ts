import { z } from "zod";

export const UrsDateQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  researched: z.enum(["true", "false"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UrsDateQueryInput = z.infer<typeof UrsDateQuerySchema>;

// Content fields for user submissions (POST /urs-dates). sourceId is
// generated server-side; moderation fields are never client-settable.
export const CreateUrsDateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  saint: z.string().trim().min(1).max(200),
  saintDeathYear: z.string().trim().max(20).optional(),
  city: z.string().trim().min(1).max(60),
  ursRule: z.string().trim().max(200).optional(),
  calendarBasis: z.string().trim().max(200).optional(),
  lastObserved: z.string().trim().max(100).optional(),
  nextExpected: z.string().trim().max(100).optional(),
  confidence: z.string().trim().min(1).max(50),
  sources: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  howToConfirm: z.string().trim().max(500).optional(),
  researched: z.boolean().optional(),
  organizerId: z.string().trim().max(60).optional(),
});

export const UpdateUrsDateSchema = CreateUrsDateSchema.partial();

export type CreateUrsDateInput = z.infer<typeof CreateUrsDateSchema>;
export type UpdateUrsDateInput = z.infer<typeof UpdateUrsDateSchema>;
