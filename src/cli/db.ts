import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from '../server/database/schema';
import { DB_ENV } from '../server/utils/config';

const pool = new pg.Pool({
  connectionString: DB_ENV.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export { schema };
