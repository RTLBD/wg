#!/usr/bin/env tsx
/**
 * Validates PostgreSQL migrations, seeding, and optional SQLite import.
 * Usage: DATABASE_URL=... tsx scripts/validate-database.ts [path-to-sqlite.db]
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { connect, closeDatabase } from '../server/database/postgres';
import * as schema from '../server/database/schema';

const sqliteArg = process.argv[2];

async function resetDatabase() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  await db.execute(
    sql`TRUNCATE TABLE
      one_time_links_table,
      clients_table,
      user_configs_table,
      hooks_table,
      interfaces_table,
      general_table,
      users_table
      RESTART IDENTITY CASCADE`
  );
  await pool.end();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  if (sqliteArg) {
    const sqlitePath = resolve(sqliteArg);
    if (!existsSync(sqlitePath)) {
      throw new Error(`SQLite file not found: ${sqlitePath}`);
    }
    process.env.LEGACY_SQLITE_PATH = sqlitePath;
    await resetDatabase();
  }

  const db = await connect();

  const general = await db.general.getSetupStep();
  const iface = await db.interfaces.get();
  const users = await db.users.getAll();

  console.log(
    JSON.stringify(
      {
        setupStep: general.step,
        interface: iface.name,
        userCount: users.length,
        sqliteImportPath: process.env.LEGACY_SQLITE_PATH ?? null,
      },
      null,
      2
    )
  );

  await closeDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
