ALTER TABLE "prompt_runs" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "prompt_runs" ADD COLUMN "cost_usd" numeric(16,10);