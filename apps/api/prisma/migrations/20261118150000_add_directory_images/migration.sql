-- Admin-uploaded reference images for the curated directories. The object key
-- lives beside the URL so replacing or removing an image can delete the old
-- object. Seeded fields are untouched on re-seed (upsert uses update: {}).
ALTER TABLE "dastarkhwans" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "imambargahs" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "darbars" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "urs_dates" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "charities" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "melas" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
ALTER TABLE "scholars" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT, ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;
