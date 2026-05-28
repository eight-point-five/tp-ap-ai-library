CREATE TYPE "public"."risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');
--> statement-breakpoint
CREATE TYPE "public"."risk_decision" AS ENUM('ALLOW', 'REVIEW', 'BLOCK');
--> statement-breakpoint
CREATE TYPE "public"."risk_event_type" AS ENUM('BORROW', 'RENEW', 'RETURN');
--> statement-breakpoint
CREATE TABLE "borrow_risk_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrow_record_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"event_type" "risk_event_type" DEFAULT 'BORROW' NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"feature_snapshot" jsonb NOT NULL,
	"reason_codes" jsonb NOT NULL,
	"ai_explanation" text NOT NULL,
	"decision" "risk_decision" DEFAULT 'ALLOW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "borrow_risk_events_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "user_risk_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_score" integer DEFAULT 0 NOT NULL,
	"current_level" "risk_level" DEFAULT 'LOW' NOT NULL,
	"total_borrow_count" integer DEFAULT 0 NOT NULL,
	"active_borrow_count" integer DEFAULT 0 NOT NULL,
	"overdue_count" integer DEFAULT 0 NOT NULL,
	"max_overdue_days" integer DEFAULT 0 NOT NULL,
	"recent_7d_borrow_count" integer DEFAULT 0 NOT NULL,
	"recent_24h_borrow_count" integer DEFAULT 0 NOT NULL,
	"abnormal_event_count" integer DEFAULT 0 NOT NULL,
	"last_evaluated_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_risk_profiles_id_unique" UNIQUE("id"),
	CONSTRAINT "user_risk_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "risk_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"weight" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"threshold_config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "risk_rules_id_unique" UNIQUE("id"),
	CONSTRAINT "risk_rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "nlq_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"query_text" text NOT NULL,
	"parsed_intent" varchar(128) NOT NULL,
	"parsed_filters" jsonb NOT NULL,
	"generated_query_summary" text NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "nlq_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "borrow_risk_events" ADD CONSTRAINT "borrow_risk_events_borrow_record_id_borrow_records_id_fk" FOREIGN KEY ("borrow_record_id") REFERENCES "public"."borrow_records"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "borrow_risk_events" ADD CONSTRAINT "borrow_risk_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "borrow_risk_events" ADD CONSTRAINT "borrow_risk_events_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_risk_profiles" ADD CONSTRAINT "user_risk_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nlq_logs" ADD CONSTRAINT "nlq_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
