ALTER TABLE "units" DROP CONSTRAINT "units_organization_id_properties_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;