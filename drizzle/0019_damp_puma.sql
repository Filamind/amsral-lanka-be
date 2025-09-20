-- Add code column
ALTER TABLE "items" ADD COLUMN "code" varchar
(50);--> statement-breakpoint

-- Set default code values for existing records (code = name)
UPDATE "items" SET "code" = "name" WHERE "code" IS NULL;--> statement-breakpoint

-- Create index for code column
CREATE INDEX "idx_items_code" ON "items" USING btree
("code");--> statement-breakpoint

-- Add unique constraint for code column
ALTER TABLE "items" ADD CONSTRAINT "items_code_unique" UNIQUE("code");