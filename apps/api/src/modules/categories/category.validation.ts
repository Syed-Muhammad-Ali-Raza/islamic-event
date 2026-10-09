import { z } from "zod";

function optionalText(max: number) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().max(max, `Must be under ${max} characters`).optional()
  );
}

export const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters")
    .trim(),

  description: optionalText(500),
  icon: optionalText(10),

  sortOrder: z.coerce
    .number()
    .int("Sort order must be a whole number")
    .min(0, "Sort order cannot be negative")
    .optional(),
});

export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters")
    .trim()
    .optional(),

  description: optionalText(500),
  icon: optionalText(10),
  isActive: z.boolean().optional(),

  sortOrder: z.coerce
    .number()
    .int("Sort order must be a whole number")
    .min(0, "Sort order cannot be negative")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
