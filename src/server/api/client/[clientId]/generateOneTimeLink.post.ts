import { ClientGetSchema } from '#db/repositories/client/types';
import { OneTimeLinkGenerateSchema } from '#db/repositories/oneTimeLink/types';

export default definePermissionEventHandler(
  'clients',
  'update',
  async ({ event, checkPermissions }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );

    const body = await readValidatedBody(
      event,
      validateZod(OneTimeLinkGenerateSchema, event)
    );

    const client = await Database.clients.get(clientId);
    checkPermissions(client);

    const link = await Database.oneTimeLinks.generate(
      clientId,
      body.durationMinutes ?? 60
    );

    return {
      success: true,
      ...link,
    };
  }
);
