import { sql, relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { oneTimeLink, user, wgInterface } from '../../schema';

/** null means use value from userConfig */

export const client = pgTable('clients_table', {
  id: serial().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  interfaceId: text('interface_id')
    .notNull()
    .references(() => wgInterface.name, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  name: text().notNull(),
  ipv4Address: text('ipv4_address').notNull().unique(),
  ipv6Address: text('ipv6_address').notNull().unique(),
  preUp: text('pre_up').default('').notNull(),
  postUp: text('post_up').default('').notNull(),
  preDown: text('pre_down').default('').notNull(),
  postDown: text('post_down').default('').notNull(),
  privateKey: text('private_key').notNull(),
  publicKey: text('public_key').notNull(),
  preSharedKey: text('pre_shared_key').notNull(),
  expiresAt: text('expires_at'),
  allowedIps: jsonb('allowed_ips').$type<string[]>(),
  serverAllowedIps: jsonb('server_allowed_ips').$type<string[]>().notNull(),
  // Firewall-enforced allowed IPs (null = use allowedIps)
  firewallIps: jsonb('firewall_ips').$type<string[] | null>(),
  persistentKeepalive: integer('persistent_keepalive').notNull(),
  mtu: integer().notNull(),
  jC: integer('j_c'),
  jMin: integer('j_min'),
  jMax: integer('j_max'),
  i1: text(),
  i2: text(),
  i3: text(),
  i4: text(),
  i5: text(),
  dns: jsonb().$type<string[]>(),
  serverEndpoint: text('server_endpoint'),
  trafficLimitBytes: bigint('traffic_limit_bytes', { mode: 'number' }),
  trafficUsedBytes: bigint('traffic_used_bytes', { mode: 'number' })
    .default(0)
    .notNull(),
  trafficWgSnapshotBytes: bigint('traffic_wg_snapshot_bytes', {
    mode: 'number',
  })
    .default(0)
    .notNull(),
  enabled: boolean().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const clientsRelations = relations(client, ({ one }) => ({
  oneTimeLink: one(oneTimeLink, {
    fields: [client.id],
    references: [oneTimeLink.id],
  }),
  user: one(user, {
    fields: [client.userId],
    references: [user.id],
  }),
  interface: one(wgInterface, {
    fields: [client.interfaceId],
    references: [wgInterface.name],
  }),
}));
