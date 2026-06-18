import { bootstrapApplication } from '../utils/Database';

export default defineEventHandler(async (event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/')) {
    return;
  }

  try {
    await bootstrapApplication();
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service unavailable: application is still starting',
    });
  }
});
