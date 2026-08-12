import { boolean, index, integer, jsonb, pgEnum, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const adminRole = pgEnum("admin_role", ["SYSTEM_ADMIN", "SURVEY_OPERATOR", "RESULTS_ADMIN"]);
export const sessionStatus = pgEnum("session_status", ["DRAFT", "ACTIVE", "CLOSED", "EXPIRED"]);
export const participationStatus = pgEnum("participation_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const policyStatus = pgEnum("policy_status", ["NORMAL", "WARNING", "RESTRICTION", "INSUFFICIENT"]);

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(), email: text("email").notNull(), name: text("name").notNull(),
  passwordHash: text("password_hash"), googleSubject: text("google_subject"), role: adminRole("role").notNull(), active: boolean("active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("admins_email_idx").on(t.email), uniqueIndex("admins_google_subject_idx").on(t.googleSubject)]);

export const terms = pgTable("terms", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(), endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  active: boolean("active").default(false).notNull(),
}, (t) => [uniqueIndex("terms_code_idx").on(t.code)]);

export const instructors = pgTable("instructors", {
  id: uuid("id").defaultRandom().primaryKey(), externalId: text("external_id"), name: text("name").notNull(), active: boolean("active").default(true).notNull(),
}, (t) => [index("instructors_name_idx").on(t.name)]);

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(), termId: uuid("term_id").notNull().references(() => terms.id),
  code: text("code").notNull(), room: text("room").notNull(), scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }).notNull(), eligibleCount: integer("eligible_count").default(0).notNull(),
}, (t) => [uniqueIndex("classes_term_code_idx").on(t.termId, t.code)]);

export const teachingAssignments = pgTable("teaching_assignments", {
  id: uuid("id").defaultRandom().primaryKey(), classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  instructorId: uuid("instructor_id").notNull().references(() => instructors.id), position: integer("position").notNull(),
}, (t) => [uniqueIndex("assignment_class_instructor_idx").on(t.classId, t.instructorId)]);

export const questionnaireVersions = pgTable("questionnaire_versions", {
  id: uuid("id").defaultRandom().primaryKey(), termId: uuid("term_id").notNull().references(() => terms.id), version: integer("version").notNull(),
  title: text("title").notNull(), questions: jsonb("questions").notNull(), lockedAt: timestamp("locked_at", { withTimezone: true }),
}, (t) => [uniqueIndex("questionnaire_term_version_idx").on(t.termId, t.version)]);

export const evaluationSessions = pgTable("evaluation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(), classId: uuid("class_id").notNull().references(() => classes.id), questionnaireId: uuid("questionnaire_id").notNull().references(() => questionnaireVersions.id),
  tokenHash: text("token_hash").notNull(), status: sessionStatus("status").default("DRAFT").notNull(), targetCount: integer("target_count").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }), expiresAt: timestamp("expires_at", { withTimezone: true }), closedAt: timestamp("closed_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => admins.id), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("sessions_token_idx").on(t.tokenHash)]);

export const participation = pgTable("participation", {
  id: uuid("id").defaultRandom().primaryKey(), sessionId: uuid("session_id").notNull().references(() => evaluationSessions.id),
  subjectHash: text("subject_hash").notNull(), deviceHash: text("device_hash").notNull(), status: participationStatus("status").default("NOT_STARTED").notNull(),
  completedAssignments: integer("completed_assignments").default(0).notNull(), completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [uniqueIndex("participation_subject_idx").on(t.sessionId, t.subjectHash), uniqueIndex("participation_device_idx").on(t.sessionId, t.deviceHash)]);

export const anonymousResponses = pgTable("anonymous_responses", {
  id: uuid("id").defaultRandom().primaryKey(), sessionId: uuid("session_id").notNull().references(() => evaluationSessions.id),
  assignmentId: uuid("assignment_id").notNull().references(() => teachingAssignments.id), answers: jsonb("answers").notNull(),
  comment: text("comment"), language: text("language").default("ko").notNull(), submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(), valid: boolean("valid").default(true).notNull(),
}, (t) => [index("responses_assignment_idx").on(t.assignmentId), index("responses_session_idx").on(t.sessionId)]);

export const termResults = pgTable("term_results", {
  id: uuid("id").defaultRandom().primaryKey(), termId: uuid("term_id").notNull().references(() => terms.id), instructorId: uuid("instructor_id").notNull().references(() => instructors.id),
  rawScore: real("raw_score"), responseCount: integer("response_count").default(0).notNull(), eligibleOpportunities: integer("eligible_opportunities").default(0).notNull(),
  participationRate: real("participation_rate").default(0).notNull(), status: policyStatus("status").notNull(), reason: text("reason").notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(), restrictionTermCode: text("restriction_term_code"),
}, (t) => [uniqueIndex("results_term_instructor_idx").on(t.termId, t.instructorId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id").references(() => admins.id), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id"),
  detail: jsonb("detail"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
