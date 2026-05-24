ALTER TABLE `clients_table` ADD `traffic_limit_bytes` integer;--> statement-breakpoint
ALTER TABLE `clients_table` ADD `traffic_used_bytes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `clients_table` ADD `traffic_wg_snapshot_bytes` integer DEFAULT 0 NOT NULL;
