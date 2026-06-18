import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './server/database/migrations',
  schema: './server/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://wgeasy:wgeasy@localhost:5432/wgeasy',
  },
});
