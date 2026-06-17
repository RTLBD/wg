import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const general = pgTable('general_table', {
  id: integer().primaryKey().default(1),

  setupStep: integer('setup_step').notNull(),

  sessionPassword: text('session_password').notNull(),
  sessionTimeout: integer('session_timeout').notNull(),

  metricsPrometheus: boolean('metrics_prometheus').notNull(),
  metricsJson: boolean('metrics_json').notNull(),
  metricsPassword: text('metrics_password'),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});
