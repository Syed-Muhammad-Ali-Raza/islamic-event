import { z } from "zod";

/** Every directory an admin can attach a reference image to. */
export const IMAGE_ENTITY_TYPES = [
  "scholar",
  "place",
  "dastarkhwan",
  "imambargah",
  "darbar",
  "ursDate",
  "charity",
  "mela",
  "event",
] as const;

export const ImageEntityTypeSchema = z.enum(IMAGE_ENTITY_TYPES);

export type ImageEntityType = z.infer<typeof ImageEntityTypeSchema>;

export const ListDirectoryImagesSchema = z.object({
  entityType: ImageEntityTypeSchema,
  q: z.string().trim().max(100).optional().default(""),
});

export const UploadDirectoryImageSchema = z.object({
  entityType: ImageEntityTypeSchema,
  entityId: z.string().min(1).max(64),
});

export const ImageParamsSchema = z.object({
  entityType: ImageEntityTypeSchema,
  entityId: z.string().min(1).max(64),
});
