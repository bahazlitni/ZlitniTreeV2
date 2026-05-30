ALTER TABLE "persons"
  ADD COLUMN IF NOT EXISTS "parent_marriage_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "firstname" TEXT,
  ADD COLUMN IF NOT EXISTS "middlename" TEXT,
  ADD COLUMN IF NOT EXISTS "lastname" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "children"
    GROUP BY "child_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot migrate children table: at least one child belongs to more than one marriage.';
  END IF;
END $$;

UPDATE "persons" AS person
SET "parent_marriage_id" = child."marriage_id"
FROM "children" AS child
WHERE person."id" = child."child_id"
  AND person."parent_marriage_id" IS NULL;

DROP TABLE IF EXISTS "children";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'persons_parent_marriage_id_fkey'
  ) THEN
    ALTER TABLE "persons"
      ADD CONSTRAINT "persons_parent_marriage_id_fkey"
      FOREIGN KEY ("parent_marriage_id") REFERENCES "marriages"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
