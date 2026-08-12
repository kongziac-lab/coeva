CREATE TYPE "public"."admin_role" AS ENUM('SYSTEM_ADMIN', 'SURVEY_OPERATOR', 'RESULTS_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."participation_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('NORMAL', 'WARNING', 'RESTRICTION', 'INSUFFICIENT');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anonymous_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"comment" text,
	"language" text DEFAULT 'ko' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"code" text NOT NULL,
	"room" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"scheduled_end_at" timestamp with time zone NOT NULL,
	"eligible_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" "session_status" DEFAULT 'DRAFT' NOT NULL,
	"target_count" integer NOT NULL,
	"opens_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"subject_hash" text NOT NULL,
	"device_hash" text NOT NULL,
	"status" "participation_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"completed_assignments" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "questionnaire_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"questions" jsonb NOT NULL,
	"locked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teaching_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"instructor_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"instructor_id" uuid NOT NULL,
	"raw_score" real,
	"response_count" integer DEFAULT 0 NOT NULL,
	"eligible_opportunities" integer DEFAULT 0 NOT NULL,
	"participation_rate" real DEFAULT 0 NOT NULL,
	"status" "policy_status" NOT NULL,
	"reason" text NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"restriction_term_code" text
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anonymous_responses" ADD CONSTRAINT "anonymous_responses_session_id_evaluation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."evaluation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_responses" ADD CONSTRAINT "anonymous_responses_assignment_id_teaching_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."teaching_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_admins_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_sessions" ADD CONSTRAINT "evaluation_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_sessions" ADD CONSTRAINT "evaluation_sessions_questionnaire_id_questionnaire_versions_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_sessions" ADD CONSTRAINT "evaluation_sessions_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation" ADD CONSTRAINT "participation_session_id_evaluation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."evaluation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_versions" ADD CONSTRAINT "questionnaire_versions_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_results" ADD CONSTRAINT "term_results_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_results" ADD CONSTRAINT "term_results_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "responses_assignment_idx" ON "anonymous_responses" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "responses_session_idx" ON "anonymous_responses" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_term_code_idx" ON "classes" USING btree ("term_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "evaluation_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "instructors_name_idx" ON "instructors" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "participation_subject_idx" ON "participation" USING btree ("session_id","subject_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "participation_device_idx" ON "participation" USING btree ("session_id","device_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaire_term_version_idx" ON "questionnaire_versions" USING btree ("term_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_class_instructor_idx" ON "teaching_assignments" USING btree ("class_id","instructor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "results_term_instructor_idx" ON "term_results" USING btree ("term_id","instructor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_code_idx" ON "terms" USING btree ("code");