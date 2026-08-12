ALTER TABLE "admins" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "admins" ADD COLUMN "google_subject" text;
ALTER TABLE "admins" ADD COLUMN "last_login_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "admins_google_subject_idx" ON "admins" USING btree ("google_subject");
