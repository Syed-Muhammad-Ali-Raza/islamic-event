import { z } from "zod";
import { OrgRole } from "@prisma/client";

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

/** Partial update — privileged fields (slug, isVerified, isActive, createdById) are not accepted. */
export const UpdateOrganizerSchema = CreateOrganizerSchema.partial();

export type UpdateOrganizerInput = z.infer<typeof UpdateOrganizerSchema>;

const roleError = "Role must be OWNER, ADMIN or EDITOR";

/** Add an existing user (by email) as a member of an organization. */
export const AddMemberSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .trim(),
  role: z.nativeEnum(OrgRole, { invalid_type_error: roleError }).default("ADMIN"),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;

/** Change a member's role. */
export const UpdateMemberSchema = z.object({
  role: z.nativeEnum(OrgRole, { invalid_type_error: roleError }),
});

export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;
