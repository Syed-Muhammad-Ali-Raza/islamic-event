-- The curated expo seed and its generated disclaimer used " — " as a
-- separator in event titles, descriptions and rejection reasons. Source data
-- has been cleaned up, but `prisma migrate deploy` does not re-run db:seed,
-- so correct the rows already present in existing databases here. Fresh
-- databases replay this migration before seeding, where it is a no-op.
UPDATE "events"
SET "title" = REPLACE("title", ' — ', ', '),
    "description" = REPLACE("description", ' — ', ', '),
    "rejectionReason" = REPLACE("rejectionReason", ' — ', ', ')
WHERE "title" LIKE '% — %'
   OR "description" LIKE '% — %'
   OR "rejectionReason" LIKE '% — %';
