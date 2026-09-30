CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`group_no` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignments_token_unique` ON `assignments` (`token`);--> statement-breakpoint
CREATE INDEX `idx_assignments_group_no` ON `assignments` (`group_no`);