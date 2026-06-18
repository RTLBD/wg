import { databaseReady } from '../utils/Database';

export default defineEventHandler(async (event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/')) {
    return;
  }

  try {
    await databaseReady;
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service unavailable: application is still starting',
    });
  }
});
