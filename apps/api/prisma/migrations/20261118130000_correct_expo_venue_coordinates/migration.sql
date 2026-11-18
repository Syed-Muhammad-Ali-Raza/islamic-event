-- Several curated expo venues were seeded with approximate or copy-pasted
-- coordinates (e.g. Peshawar used Multan's longitude). Correct the stored
-- points to the locations verified against OpenStreetMap / Photon. The seed
-- JSON carries the same values, so fresh databases seed correctly and this
-- migration only affects databases that already hold the old rows.
UPDATE "events"
SET "latitude" = CASE "venue"
      WHEN 'Lahore International Expo Centre' THEN 31.4647215
      WHEN 'Karachi Expo Centre' THEN 24.9010784
      WHEN 'Pak-China Friendship Centre' THEN 33.6973404
      WHEN 'Jinnah Convention Centre' THEN 33.7134098
      WHEN 'Faisalabad Chamber of Commerce & Industry' THEN 31.4459924
      WHEN 'Khyber Pakhtunkhwa Chamber of Commerce & Industry' THEN 34.0151
    END,
    "longitude" = CASE "venue"
      WHEN 'Lahore International Expo Centre' THEN 74.2599653
      WHEN 'Karachi Expo Centre' THEN 67.0774991
      WHEN 'Pak-China Friendship Centre' THEN 73.0846949
      WHEN 'Jinnah Convention Centre' THEN 73.1054459
      WHEN 'Faisalabad Chamber of Commerce & Industry' THEN 73.1425663
      WHEN 'Khyber Pakhtunkhwa Chamber of Commerce & Industry' THEN 71.5785
    END
WHERE "venue" IN (
  'Lahore International Expo Centre',
  'Karachi Expo Centre',
  'Pak-China Friendship Centre',
  'Jinnah Convention Centre',
  'Faisalabad Chamber of Commerce & Industry',
  'Khyber Pakhtunkhwa Chamber of Commerce & Industry'
);
