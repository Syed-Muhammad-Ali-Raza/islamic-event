-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "charities" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "darbars" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "dastarkhwans" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "imambargahs" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "melas" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "processions" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "scholars" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "urs_dates" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "organizerId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'ADMIN',
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_members_organizerId_idx" ON "organization_members"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizerId_key" ON "organization_members"("userId", "organizerId");

-- CreateIndex
CREATE INDEX "charities_approvalStatus_idx" ON "charities"("approvalStatus");

-- CreateIndex
CREATE INDEX "charities_organizerId_idx" ON "charities"("organizerId");

-- CreateIndex
CREATE INDEX "darbars_approvalStatus_idx" ON "darbars"("approvalStatus");

-- CreateIndex
CREATE INDEX "darbars_organizerId_idx" ON "darbars"("organizerId");

-- CreateIndex
CREATE INDEX "dastarkhwans_approvalStatus_idx" ON "dastarkhwans"("approvalStatus");

-- CreateIndex
CREATE INDEX "dastarkhwans_organizerId_idx" ON "dastarkhwans"("organizerId");

-- CreateIndex
CREATE INDEX "imambargahs_approvalStatus_idx" ON "imambargahs"("approvalStatus");

-- CreateIndex
CREATE INDEX "imambargahs_organizerId_idx" ON "imambargahs"("organizerId");

-- CreateIndex
CREATE INDEX "melas_approvalStatus_idx" ON "melas"("approvalStatus");

-- CreateIndex
CREATE INDEX "melas_organizerId_idx" ON "melas"("organizerId");

-- CreateIndex
CREATE INDEX "places_approvalStatus_idx" ON "places"("approvalStatus");

-- CreateIndex
CREATE INDEX "places_organizerId_idx" ON "places"("organizerId");

-- CreateIndex
CREATE INDEX "processions_approvalStatus_idx" ON "processions"("approvalStatus");

-- CreateIndex
CREATE INDEX "processions_organizerId_idx" ON "processions"("organizerId");

-- CreateIndex
CREATE INDEX "scholars_approvalStatus_idx" ON "scholars"("approvalStatus");

-- CreateIndex
CREATE INDEX "scholars_organizerId_idx" ON "scholars"("organizerId");

-- CreateIndex
CREATE INDEX "urs_dates_approvalStatus_idx" ON "urs_dates"("approvalStatus");

-- CreateIndex
CREATE INDEX "urs_dates_organizerId_idx" ON "urs_dates"("organizerId");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
