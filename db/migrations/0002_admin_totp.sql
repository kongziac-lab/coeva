ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "totp_secret" text;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "totp_verified_at" timestamp with time zone;
