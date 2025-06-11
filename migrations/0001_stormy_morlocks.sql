ALTER TABLE "rights" ADD COLUMN "ownership_document_hash" text;--> statement-breakpoint
ALTER TABLE "rights" ADD COLUMN "ownership_document_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_banned" boolean DEFAULT false;