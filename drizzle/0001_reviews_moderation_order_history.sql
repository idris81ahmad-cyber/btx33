DO $$ BEGIN
  CREATE TYPE "review_moderation" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderation_status" "review_moderation" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- Existing curated/verified reviews should stay public
UPDATE "reviews" SET "moderation_status" = 'approved' WHERE "verified" = true;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_number" text NOT NULL,
  "from_status" text,
  "to_status" text NOT NULL,
  "note" text,
  "actor" text DEFAULT 'system' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_history_order_number_idx" ON "order_status_history" ("order_number");
