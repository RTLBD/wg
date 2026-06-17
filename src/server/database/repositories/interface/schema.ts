import { sql, relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { userConfig, hooks } from '../../schema';

// maybe support multiple interfaces in the future
export const wgInterface = pgTable('interfaces_table', {
  name: text().primaryKey(),
  device: text().notNull(),
  port: integer().notNull().unique(),
  privateKey: text('private_key').notNull(),
  publicKey: text('public_key').notNull(),
  ipv4Cidr: text('ipv4_cidr').notNull(),
  ipv6Cidr: text('ipv6_cidr').notNull(),
  mtu: integer().notNull(),
  jC: integer('j_c').default(7),
  jMin: integer('j_min').default(10),
  jMax: integer('j_max').default(1000),
  s1: integer().default(128),
  s2: integer().default(56),
  s3: integer(),
  s4: integer(),
  h1: text(),
  h2: text(),
  h3: text(),
  h4: text(),
  i1: text(),
  i2: text(),
  i3: text(),
  i4: text(),
  i5: text(),
  // does nothing yet
  enabled: boolean().notNull(),
  // Enable per-client firewall filtering via iptables
  firewallEnabled: boolean('firewall_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const wgInterfaceRelations = relations(wgInterface, ({ one }) => ({
  hooks: one(hooks, {
    fields: [wgInterface.name],
    references: [hooks.id],
  }),
  userConfig: one(userConfig, {
    fields: [wgInterface.name],
    references: [userConfig.id],
  }),
}));
