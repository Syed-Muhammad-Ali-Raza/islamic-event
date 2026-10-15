-- Add the SUPER_ADMIN value to the legacy UserRole enum.
--
-- Kept in its OWN migration on purpose: PostgreSQL cannot USE a new enum value
-- in the same transaction in which it was added, and the
-- "20261015081220_promote_admins_to_super_admin" migration updates rows to
-- 'SUPER_ADMIN'. Migrations run one transaction each, so ADD VALUE must be
-- committed first.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
