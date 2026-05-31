import {
  varchar,
  uuid,
  integer,
  text,
  jsonb,
  boolean,
  pgTable,
  date,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

export const STATUS_ENUM = pgEnum("status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN"]);
export const BORROW_STATUS_ENUM = pgEnum("borrow_status", [
  "BORROWED",
  "RETURNED",
]);
export const RISK_LEVEL_ENUM = pgEnum("risk_level", ["LOW", "MEDIUM", "HIGH"]);
export const RISK_DECISION_ENUM = pgEnum("risk_decision", [
  "ALLOW",
  "REVIEW",
  "BLOCK",
]);
export const RISK_EVENT_TYPE_ENUM = pgEnum("risk_event_type", [
  "BORROW",
  "RENEW",
  "RETURN",
]);
export const CONTROL_STATUS_ENUM = pgEnum("control_status", [
  "NORMAL",
  "WATCH",
  "REVIEW",
  "BLOCKED",
]);
export const LLM_PROVIDER_ENUM = pgEnum("llm_provider", ["DOUBAO", "QWEN"]);
export const LLM_SCOPE_ENUM = pgEnum("llm_scope", ["USER", "ADMIN"]);

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  universityId: integer("university_id").notNull().unique(),
  password: text("password").notNull(),
  universityCard: text("university_card").notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
});

export const books = pgTable("books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 32 }).unique(),
  author: varchar("author", { length: 255 }).notNull(),
  genre: text("genre").notNull(),
  rating: integer("rating").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverColor: varchar("cover_color", { length: 7 }).notNull(),
  description: text("description").notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(0),
  videoUrl: text("video_url").notNull(),
  summary: varchar("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const borrowRecords = pgTable("borrow_records", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  borrowDate: timestamp("borrow_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: BORROW_STATUS_ENUM("status").default("BORROWED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const borrowRiskEvents = pgTable("borrow_risk_events", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  borrowRecordId: uuid("borrow_record_id")
    .references(() => borrowRecords.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  eventType: RISK_EVENT_TYPE_ENUM("event_type").default("BORROW").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: RISK_LEVEL_ENUM("risk_level").notNull(),
  featureSnapshot: jsonb("feature_snapshot").notNull(),
  reasonCodes: jsonb("reason_codes").notNull(),
  aiExplanation: text("ai_explanation").notNull(),
  decision: RISK_DECISION_ENUM("decision").default("ALLOW").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userRiskProfiles = pgTable("user_risk_profiles", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  currentScore: integer("current_score").notNull().default(0),
  currentLevel: RISK_LEVEL_ENUM("current_level").notNull().default("LOW"),
  totalBorrowCount: integer("total_borrow_count").notNull().default(0),
  activeBorrowCount: integer("active_borrow_count").notNull().default(0),
  overdueCount: integer("overdue_count").notNull().default(0),
  maxOverdueDays: integer("max_overdue_days").notNull().default(0),
  recent7dBorrowCount: integer("recent_7d_borrow_count").notNull().default(0),
  recent24hBorrowCount: integer("recent_24h_borrow_count").notNull().default(0),
  abnormalEventCount: integer("abnormal_event_count").notNull().default(0),
  controlStatus: CONTROL_STATUS_ENUM("control_status")
    .notNull()
    .default("NORMAL"),
  restrictionReason: text("restriction_reason"),
  restrictedUntil: timestamp("restricted_until", { withTimezone: true }),
  requiresManualReview: boolean("requires_manual_review")
    .notNull()
    .default(false),
  lastEvaluatedAt: timestamp("last_evaluated_at", {
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const riskRules = pgTable("risk_rules", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  weight: integer("weight").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  thresholdConfig: jsonb("threshold_config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const nlqLogs = pgTable("nlq_logs", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id").references(() => users.id),
  queryText: text("query_text").notNull(),
  parsedIntent: varchar("parsed_intent", { length: 128 }).notNull(),
  parsedFilters: jsonb("parsed_filters").notNull(),
  generatedQuerySummary: text("generated_query_summary").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const llmProviderConfigs = pgTable("llm_provider_configs", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  scope: LLM_SCOPE_ENUM("scope").notNull(),
  provider: LLM_PROVIDER_ENUM("provider").notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  apiBaseUrl: text("api_base_url").notNull(),
  apiKey: text("api_key").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  supportsVision: boolean("supports_vision").notNull().default(true),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
