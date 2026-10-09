import { z } from "zod";

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

function optionalText(max: number) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().max(max, `Must be under ${max} characters`).optional()
  );
}

export const CreateOrganizerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must be under 150 characters")
    .trim(),

  description: optionalText(2000),

  phone: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().regex(phoneRegex, "Please enter a valid phone number").optional()
  ),

  email: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().email("Please enter a valid email address").optional()
  ),

  website: optionalText(200),
  address: optionalText(300),
  countryId: optionalText(50),
  cityId: optionalText(50),
});

export type CreateOrganizerInput = z.infer<typeof CreateOrganizerSchema>;
