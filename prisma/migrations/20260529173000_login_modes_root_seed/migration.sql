CREATE TYPE "LoginMode" AS ENUM ('PASSWORD_ONLY', 'PASSWORDLESS', 'PASSWORD_AND_OTP');

ALTER TABLE "users" ADD COLUMN "login_mode" "LoginMode";

UPDATE "users"
SET "login_mode" = CASE
  WHEN "two_step_verification_enabled" = false THEN 'PASSWORD_ONLY'::"LoginMode"
  ELSE 'PASSWORD_AND_OTP'::"LoginMode"
END;

ALTER TABLE "users" ALTER COLUMN "login_mode" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "login_mode" SET DEFAULT 'PASSWORDLESS';
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" DROP COLUMN "two_step_verification_enabled";
ALTER TABLE "users" DROP COLUMN "email_verified_at";

UPDATE "users"
SET "power_type" = 'ADMIN'
WHERE "power_type" = 'ROOT'
  AND "email" <> 'baha.zlitni989@gmail.com';

INSERT INTO "users" (
  "id",
  "email",
  "password_hash",
  "power_type",
  "login_mode",
  "created_at",
  "updated_at"
)
VALUES (
  'root_baha_zlitni_989',
  'baha.zlitni989@gmail.com',
  '$2b$12$EBFZm8DoArseBef3v6I0KOvyj5.JCkEIeu15WyoeGb6c5jpCXWlJS',
  'ROOT',
  'PASSWORD_AND_OTP',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "password_hash" = EXCLUDED."password_hash",
  "power_type" = 'ROOT',
  "login_mode" = 'PASSWORD_AND_OTP',
  "updated_at" = CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "users_single_root_idx"
ON "users" ("power_type")
WHERE "power_type" = 'ROOT';
