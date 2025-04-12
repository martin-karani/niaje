ALTER TYPE "public"."user_role" ADD VALUE 'TENANT';--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_values" json,
	"new_values" json,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_common" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_comments" ADD CONSTRAINT "maintenance_comments_request_id_maintenance_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."maintenance_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_comments" ADD CONSTRAINT "maintenance_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;