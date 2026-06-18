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

let databaseReadyPromise: Promise<DBServiceType> | undefined;

export function bootstrapApplication(): Promise<DBServiceType> {
  if (databaseReadyPromise) {
    return databaseReadyPromise;
  }

  databaseReadyPromise = connect()
    .then((db) => {
      provider = db;
      return WireGuard.Startup().then(() => {
        DB_BOOT_DEBUG('Application ready');
        return db;
      });
    })
    .catch((error) => {
      if (error instanceof Error) {
        DB_BOOT_DEBUG('Failed to initialize application:', error.message);
      }
      throw error;
    });

  return databaseReadyPromise;
}

export async function awaitDatabaseReady() {
  return bootstrapApplication();
}

export default provider;
