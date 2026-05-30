ALTER TABLE "public"."marriages"
  DROP COLUMN IF EXISTS "divorce_year",
  DROP COLUMN IF EXISTS "divorce_month",
  DROP COLUMN IF EXISTS "divorce_day";
