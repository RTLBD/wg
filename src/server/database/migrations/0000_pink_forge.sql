CREATE TABLE "clients_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"interface_id" text NOT NULL,
	"name" text NOT NULL,
	"ipv4_address" text NOT NULL,
	"ipv6_address" text NOT NULL,
	"pre_up" text DEFAULT '' NOT NULL,
	"post_up" text DEFAULT '' NOT NULL,
	"pre_down" text DEFAULT '' NOT NULL,
	"post_down" text DEFAULT '' NOT NULL,
	"private_key" text NOT NULL,
	"public_key" text NOT NULL,
	"pre_shared_key" text NOT NULL,
	"expires_at" text,
	"allowed_ips" jsonb,
	"server_allowed_ips" jsonb NOT NULL,
	"firewall_ips" jsonb,
	"persistent_keepalive" integer NOT NULL,
	"mtu" integer NOT NULL,
	"j_c" integer,
	"j_min" integer,
	"j_max" integer,
	"i1" text,
	"i2" text,
	"i3" text,
	"i4" text,
	"i5" text,
	"dns" jsonb,
	"server_endpoint" text,
	"traffic_limit_bytes" integer,
	"traffic_used_bytes" integer DEFAULT 0 NOT NULL,
	"traffic_wg_snapshot_bytes" integer DEFAULT 0 NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_table_ipv4_address_unique" UNIQUE("ipv4_address"),
	CONSTRAINT "clients_table_ipv6_address_unique" UNIQUE("ipv6_address")
);
--> statement-breakpoint
CREATE TABLE "general_table" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"setup_step" integer NOT NULL,
	"session_password" text NOT NULL,
	"session_timeout" integer NOT NULL,
	"metrics_prometheus" boolean NOT NULL,
	"metrics_json" boolean NOT NULL,
	"metrics_password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hooks_table" (
	"id" text PRIMARY KEY NOT NULL,
	"pre_up" text NOT NULL,
	"post_up" text NOT NULL,
	"pre_down" text NOT NULL,
	"post_down" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interfaces_table" (
	"name" text PRIMARY KEY NOT NULL,
	"device" text NOT NULL,
	"port" integer NOT NULL,
	"private_key" text NOT NULL,
	"public_key" text NOT NULL,
	"ipv4_cidr" text NOT NULL,
	"ipv6_cidr" text NOT NULL,
	"mtu" integer NOT NULL,
	"j_c" integer DEFAULT 7,
	"j_min" integer DEFAULT 10,
	"j_max" integer DEFAULT 1000,
	"s1" integer DEFAULT 128,
	"s2" integer DEFAULT 56,
	"s3" integer,
	"s4" integer,
	"h1" text,
	"h2" text,
	"h3" text,
	"h4" text,
	"i1" text,
	"i2" text,
	"i3" text,
	"i4" text,
	"i5" text,
	"enabled" boolean NOT NULL,
	"firewall_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interfaces_table_port_unique" UNIQUE("port")
);
--> statement-breakpoint
CREATE TABLE "one_time_links_table" (
	"id" integer PRIMARY KEY NOT NULL,
	"one_time_link" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "one_time_links_table_one_time_link_unique" UNIQUE("one_time_link")
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"role" integer NOT NULL,
	"totp_key" text,
	"totp_verified" boolean NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_table_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_configs_table" (
	"id" text PRIMARY KEY NOT NULL,
	"default_mtu" integer NOT NULL,
	"default_persistent_keepalive" integer NOT NULL,
	"default_dns" jsonb NOT NULL,
	"default_allowed_ips" jsonb NOT NULL,
	"default_j_c" integer DEFAULT 7,
	"default_j_min" integer DEFAULT 10,
	"default_j_max" integer DEFAULT 1000,
	"default_i1" text,
	"default_i2" text,
	"default_i3" text,
	"default_i4" text,
	"default_i5" text,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients_table" ADD CONSTRAINT "clients_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "clients_table" ADD CONSTRAINT "clients_table_interface_id_interfaces_table_name_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces_table"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "hooks_table" ADD CONSTRAINT "hooks_table_id_interfaces_table_name_fk" FOREIGN KEY ("id") REFERENCES "public"."interfaces_table"("name") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "one_time_links_table" ADD CONSTRAINT "one_time_links_table_id_clients_table_id_fk" FOREIGN KEY ("id") REFERENCES "public"."clients_table"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_configs_table" ADD CONSTRAINT "user_configs_table_id_interfaces_table_name_fk" FOREIGN KEY ("id") REFERENCES "public"."interfaces_table"("name") ON DELETE cascade ON UPDATE cascade;