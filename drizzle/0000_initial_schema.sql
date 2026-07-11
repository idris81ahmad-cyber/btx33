DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM('admin', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" "user_role" DEFAULT 'customer' NOT NULL,
  "phone" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "price" integer NOT NULL,
  "sale_price" integer,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rating" real DEFAULT 4.5 NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "short_description" text NOT NULL,
  "description" text NOT NULL,
  "in_stock" integer DEFAULT 0 NOT NULL,
  "color_family" text NOT NULL,
  "pattern_style" text NOT NULL,
  "length_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "specifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "products_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_number" text NOT NULL,
  "user_id" integer,
  "email" text NOT NULL,
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "status" "order_status" DEFAULT 'confirmed' NOT NULL,
  "items" jsonb NOT NULL,
  "shipping" jsonb NOT NULL,
  "subtotal" integer NOT NULL,
  "shipping_fee" integer DEFAULT 0 NOT NULL,
  "discount" integer DEFAULT 0 NOT NULL,
  "total" integer NOT NULL,
  "payment_method" text NOT NULL,
  "notes" text,
  "coupon_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "label" text DEFAULT 'Home',
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "postal_code" text,
  "is_default" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "author_name" text NOT NULL,
  "rating" integer NOT NULL,
  "title" text,
  "body" text NOT NULL,
  "verified" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wholesale_inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "company" text NOT NULL,
  "contact_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "fabric_types" text NOT NULL,
  "estimated_quantity" text NOT NULL,
  "message" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;