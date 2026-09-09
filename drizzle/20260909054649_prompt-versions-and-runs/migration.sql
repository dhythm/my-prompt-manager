CREATE TABLE "prompt_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"version_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"prompt_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"model" text NOT NULL,
	"input" text NOT NULL,
	"output" text NOT NULL,
	"status" text NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"prompt_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"model" text NOT NULL,
	"note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_versions_prompt_id_version_number_unique" UNIQUE("prompt_id","version_number")
);
--> statement-breakpoint
ALTER TABLE "prompt_messages" ADD CONSTRAINT "prompt_messages_version_id_prompt_versions_id_fkey" FOREIGN KEY ("version_id") REFERENCES "prompt_versions"("id");--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_prompt_id_prompts_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id");--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_version_id_prompt_versions_id_fkey" FOREIGN KEY ("version_id") REFERENCES "prompt_versions"("id");--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_prompts_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id");--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");