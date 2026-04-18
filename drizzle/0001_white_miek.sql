CREATE UNIQUE INDEX "role_permission_unique" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_scope_name_unique" ON "roles" USING btree ("scope","name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_global_role_unique" ON "user_global_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_tenant_role_unique" ON "user_tenant_roles" USING btree ("user_id","tenant_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_membership_unique" ON "tenant_memberships" USING btree ("tenant_id","user_id");