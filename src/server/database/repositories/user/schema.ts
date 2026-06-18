import { sql, relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { client } from '../../schema';

export const user = pgTable('users_table', {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  password: text().notNull(),
  email: text(),
  name: text().notNull(),
  role: integer().$type<Role>().notNull(),
  totpKey: text('totp_key'),
  totpVerified: boolean('totp_verified').notNull(),
  enabled: boolean().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const usersRelations = relations(user, ({ many }) => ({
  clients: many(client),
}));
