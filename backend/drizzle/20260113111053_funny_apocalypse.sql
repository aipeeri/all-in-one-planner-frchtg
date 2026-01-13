CREATE TABLE "diet_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"goal" text NOT NULL,
	"daily_calorie_target" integer,
	"daily_protein_target" integer,
	"daily_water_target" integer,
	"notes" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diet_plans_user_id_idx" ON "diet_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diet_plans_is_active_idx" ON "diet_plans" USING btree ("is_active");