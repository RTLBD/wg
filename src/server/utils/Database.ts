/**
 * Changing the Database Provider
 * This design allows for easy swapping of different database implementations.
 */
import { createDebug } from 'obug';

import { connect, type DBServiceType } from '#db/postgres';

const DB_BOOT_DEBUG = createDebug('Database');

const nullObject = new Proxy(
  {},
  {
    get() {
      throw new Error('Database not yet initialized');
    },
  }
);

// eslint-disable-next-line import/no-mutable-exports
let provider = nullObject as never as DBServiceType;

export const databaseReady = connect()
  .then((db) => {
    provider = db;
    return WireGuard.Startup().then(() => db);
  })
  .catch((error) => {
    if (error instanceof Error) {
      DB_BOOT_DEBUG('Failed to initialize application:', error.message);
    }
    throw error;
  });

export async function awaitDatabaseReady() {
  return databaseReady;
}

export default provider;
