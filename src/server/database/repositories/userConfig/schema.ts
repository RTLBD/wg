import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { wgInterface } from '../../schema';

// default* means clients store it themselves
export const userConfig = pgTable('user_configs_table', {
  /** same as `wgInterface.name` */
  id: text()
    .primaryKey()
    .references(() => wgInterface.name, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  defaultMtu: integer('default_mtu').notNull(),
  defaultPersistentKeepalive: integer('default_persistent_keepalive').notNull(),
  defaultDns: jsonb('default_dns').$type<string[]>().notNull(),
  defaultAllowedIps: jsonb('default_allowed_ips').$type<string[]>().notNull(),
  defaultJC: integer('default_j_c').default(7),
  defaultJMin: integer('default_j_min').default(10),
  defaultJMax: integer('default_j_max').default(1000),
  defaultI1: text('default_i1'),
  defaultI2: text('default_i2'),
  defaultI3: text('default_i3'),
  defaultI4: text('default_i4'),
  defaultI5: text('default_i5'),
  host: text().notNull(),
  port: integer().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});
