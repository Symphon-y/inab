CREATE TYPE "public"."connection_provider" AS ENUM('simplefin', 'manual');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('active', 'error', 'disconnected', 'expired');--> statement-breakpoint
CREATE TABLE "account_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" "connection_provider" NOT NULL,
	"encrypted_credentials" text NOT NULL,
	"external_account_id" varchar(255) NOT NULL,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_sync_status" varchar(50),
	"last_error" text,
	"sync_start_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" varchar(50) NOT NULL,
	"transactions_imported" integer DEFAULT 0 NOT NULL,
	"transactions_updated" integer DEFAULT 0 NOT NULL,
	"transactions_skipped" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"error_details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_connections" ADD CONSTRAINT "account_connections_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sync_logs" ADD CONSTRAINT "import_sync_logs_connection_id_account_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."account_connections"("id") ON DELETE cascade ON UPDATE no action;