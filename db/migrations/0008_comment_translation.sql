ALTER TABLE "anonymous_responses" ADD COLUMN "comment_ko" text;
--> statement-breakpoint
ALTER TABLE "anonymous_responses" ADD COLUMN "comment_translated_at" timestamp with time zone;
