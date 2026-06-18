import { sql, relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { client } from '../../schema';

export const oneTimeLink = pgTable('one_time_links_table', {
  /** same as `client.id` */
  id: integer()
    .primaryKey()
    .references(() => client.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  oneTimeLink: text('one_time_link').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const oneTimeLinksRelations = relations(oneTimeLink, ({ one }) => ({
  client: one(client, {
    fields: [oneTimeLink.id],
    references: [client.id],
  }),
}));
