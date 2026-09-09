CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"owner_user_id" uuid,
	"team_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_owner_xor" CHECK ((
        ("owner_user_id" is not null and "team_id" is null)
        or ("owner_user_id" is null and "team_id" is not null)
      ))
);
--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_users_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
INSERT INTO "projects" ("name", "owner_user_id", "created_by_user_id")
SELECT DISTINCT 'デフォルト', "owner_user_id", "created_by_user_id"
FROM "prompts"
WHERE "owner_user_id" IS NOT NULL AND "team_id" IS NULL;--> statement-breakpoint
INSERT INTO "projects" ("name", "team_id", "created_by_user_id")
SELECT DISTINCT 'デフォルト', "team_id", "created_by_user_id"
FROM "prompts"
WHERE "team_id" IS NOT NULL;--> statement-breakpoint
UPDATE "prompts" AS "prompt"
SET "project_id" = "project"."id"
FROM "projects" AS "project"
WHERE "prompt"."project_id" IS NULL
  AND "prompt"."owner_user_id" IS NOT NULL
  AND "project"."owner_user_id" = "prompt"."owner_user_id";--> statement-breakpoint
UPDATE "prompts" AS "prompt"
SET "project_id" = "project"."id"
FROM "projects" AS "project"
WHERE "prompt"."project_id" IS NULL
  AND "prompt"."team_id" IS NOT NULL
  AND "project"."team_id" = "prompt"."team_id";