CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"right_id" integer NOT NULL,
	"bidder_id" integer NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"currency" text DEFAULT 'ETH',
	"is_active" boolean DEFAULT true,
	"transaction_hash" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text DEFAULT '📄',
	"parent_id" integer,
	"item_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"right_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"category_id" integer,
	"description" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"symbol" text NOT NULL,
	"image_url" text,
	"pays_dividends" boolean DEFAULT false,
	"payment_address" text,
	"payment_frequency" text,
	"revenue_distribution_method" text,
	"distribution_percentage" numeric(5, 2),
	"minimum_distribution" numeric(18, 8),
	"distribution_details" text,
	"price" numeric(18, 8),
	"currency" text DEFAULT 'ETH',
	"content_file_hash" text,
	"content_file_url" text,
	"content_file_name" text,
	"content_file_size" integer,
	"content_file_type" text,
	"metadata_hash" text,
	"metadata_url" text,
	"creator_id" integer,
	"owner_id" integer,
	"is_listed" boolean DEFAULT false,
	"listing_type" text DEFAULT 'fixed',
	"auction_end_time" timestamp,
	"min_bid_amount" numeric(18, 8),
	"highest_bid_amount" numeric(18, 8),
	"highest_bidder_id" integer,
	"views" integer DEFAULT 0,
	"favorites" integer DEFAULT 0,
	"verification_status" text DEFAULT 'pending',
	"verified_at" timestamp,
	"verified_by" text,
	"verification_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rights_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"right_id" integer,
	"from_user_id" integer,
	"to_user_id" integer,
	"transaction_hash" text,
	"price" numeric(18, 8),
	"currency" text DEFAULT 'ETH',
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"wallet_address" text,
	"email" text,
	"profile_image_url" text,
	"cover_image_url" text,
	"bio" text,
	"website" text,
	"twitter" text,
	"instagram" text,
	"is_verified" boolean DEFAULT false,
	"total_earnings" numeric(18, 8) DEFAULT '0',
	"total_sales" integer DEFAULT 0,
	"followers_count" integer DEFAULT 0,
	"following_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_right_id_rights_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."rights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_right_id_rights_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."rights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights" ADD CONSTRAINT "rights_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights" ADD CONSTRAINT "rights_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights" ADD CONSTRAINT "rights_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rights" ADD CONSTRAINT "rights_highest_bidder_id_users_id_fk" FOREIGN KEY ("highest_bidder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_right_id_rights_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."rights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rights_title_idx" ON "rights" USING btree ("title");--> statement-breakpoint
CREATE INDEX "rights_type_idx" ON "rights" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rights_category_idx" ON "rights" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "rights_creator_idx" ON "rights" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "rights_price_idx" ON "rights" USING btree ("price");