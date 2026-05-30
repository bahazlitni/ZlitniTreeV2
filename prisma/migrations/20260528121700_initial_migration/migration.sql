-- CreateEnum
CREATE TYPE "PowerType" AS ENUM ('ROOT', 'ADMIN', 'MEMBER', 'ANON');

-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('LOGIN', 'RESET_PASSWORD', 'VERIFY_EMAIL');

-- CreateTable
CREATE TABLE "persons" (
    "id" SERIAL NOT NULL,
    "firstname_arabic" TEXT,
    "middlename_arabic" TEXT,
    "lastname_arabic" TEXT,
    "is_male" BOOLEAN,
    "is_alive" BOOLEAN,
    "birth_year" INTEGER,
    "birth_month" INTEGER,
    "birth_day" INTEGER,
    "birth_city" TEXT,
    "birth_country" TEXT,
    "death_year" INTEGER,
    "death_month" INTEGER,
    "death_day" INTEGER,
    "death_city" TEXT,
    "death_country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marriages" (
    "id" SERIAL NOT NULL,
    "first_partner_id" INTEGER NOT NULL,
    "second_partner_id" INTEGER,
    "wedding_year" INTEGER,
    "wedding_month" INTEGER,
    "wedding_day" INTEGER,
    "divorce_year" INTEGER,
    "divorce_month" INTEGER,
    "divorce_day" INTEGER,
    "is_divorced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "child_id" INTEGER NOT NULL,
    "marriage_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("child_id","marriage_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "power_type" "PowerType" NOT NULL DEFAULT 'ANON',
    "two_step_verification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "challenge_token_hash" TEXT,
    "type" "OTPType" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "persons_lastname_arabic_idx" ON "persons"("lastname_arabic");

-- CreateIndex
CREATE INDEX "persons_birth_year_idx" ON "persons"("birth_year");

-- CreateIndex
CREATE INDEX "persons_birth_country_idx" ON "persons"("birth_country");

-- CreateIndex
CREATE INDEX "marriages_first_partner_id_idx" ON "marriages"("first_partner_id");

-- CreateIndex
CREATE INDEX "marriages_second_partner_id_idx" ON "marriages"("second_partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "marriages_first_partner_id_second_partner_id_key" ON "marriages"("first_partner_id", "second_partner_id");

-- CreateIndex
CREATE INDEX "children_marriage_id_idx" ON "children"("marriage_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_power_type_idx" ON "users"("power_type");

-- CreateIndex
CREATE INDEX "otp_challenges_user_id_type_created_at_idx" ON "otp_challenges"("user_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "otp_challenges_challenge_token_hash_idx" ON "otp_challenges"("challenge_token_hash");

-- CreateIndex
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "otp_challenges_created_at_idx" ON "otp_challenges"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_created_at_idx" ON "password_reset_tokens"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_consumed_at_idx" ON "password_reset_tokens"("consumed_at");

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_first_partner_id_fkey" FOREIGN KEY ("first_partner_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_second_partner_id_fkey" FOREIGN KEY ("second_partner_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_marriage_id_fkey" FOREIGN KEY ("marriage_id") REFERENCES "marriages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
