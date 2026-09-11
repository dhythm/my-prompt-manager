ALTER TABLE "prompt_runs" ALTER COLUMN "source" SET DEFAULT 'playground';--> statement-breakpoint
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_run_source";--> statement-breakpoint
UPDATE "prompt_runs" SET "source" = 'playground' WHERE "source" = 'editor';--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_run_source" CHECK ("source" in ('playground', 'api'));