-- Promote every legacy platform admin to SUPER_ADMIN.
--
-- Separate migration from "20261015081210_add_super_admin_role": the new
-- 'SUPER_ADMIN' enum value cannot be referenced in the transaction that adds
-- it (PostgreSQL restriction). The legacy ADMIN value stays in the enum for
-- backwards compatibility and is treated as SUPER_ADMIN in application code.
--
-- This is a data-only migration: it touches no other columns and deletes
-- nothing.
UPDATE "users"
SET "role" = 'SUPER_ADMIN'
WHERE "role" = 'ADMIN';
