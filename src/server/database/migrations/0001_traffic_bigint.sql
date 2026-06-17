ALTER TABLE "clients_table" ALTER COLUMN "traffic_limit_bytes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "clients_table" ALTER COLUMN "traffic_used_bytes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "clients_table" ALTER COLUMN "traffic_wg_snapshot_bytes" SET DATA TYPE bigint;
