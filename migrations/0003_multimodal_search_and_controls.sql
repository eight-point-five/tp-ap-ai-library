CREATE TYPE "public"."control_status" AS ENUM('NORMAL', 'WATCH', 'REVIEW', 'BLOCKED');
--> statement-breakpoint
CREATE TYPE "public"."llm_provider" AS ENUM('DOUBAO', 'QWEN');
--> statement-breakpoint
CREATE TYPE "public"."llm_scope" AS ENUM('USER', 'ADMIN');
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "isbn" varchar(32);
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_isbn_unique" UNIQUE("isbn");
--> statement-breakpoint
ALTER TABLE "user_risk_profiles" ADD COLUMN "control_status" "control_status" DEFAULT 'NORMAL' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_risk_profiles" ADD COLUMN "restriction_reason" text;
--> statement-breakpoint
ALTER TABLE "user_risk_profiles" ADD COLUMN "restricted_until" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "user_risk_profiles" ADD COLUMN "requires_manual_review" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "llm_provider_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "llm_scope" NOT NULL,
	"provider" "llm_provider" NOT NULL,
	"model" varchar(128) NOT NULL,
	"api_base_url" text NOT NULL,
	"api_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"supports_vision" boolean DEFAULT true NOT NULL,
	"system_prompt" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "llm_provider_configs_id_unique" UNIQUE("id")
);
