ALTER TABLE "classes" ALTER COLUMN "scheduled_at" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "scheduled_end_at" DROP NOT NULL;
