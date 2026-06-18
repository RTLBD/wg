import { eq, sql, or, like, and, asc, desc, count } from 'drizzle-orm';
import { createError } from 'h3';
import { containsCidr, parseCidr } from 'cidr-tools';
import { client } from './schema';
import type {
  ClientCreateFromExistingType,
  ClientCreateType,
  ClientListParams,
  UpdateClientType,
} from './types';
import type { DBType } from '#db/postgres';
import { wgInterface, userConfig } from '#db/schema';

function mapClientRow<T extends { createdAt: string; updatedAt: string }>(row: T) {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function buildClientFilter(filter?: string) {
  if (!filter?.trim()) {
    return undefined;
  }

  const filterPattern = `%${filter.toLowerCase()}%`;
  return or(
    like(client.name, filterPattern),
    like(client.ipv4Address, filterPattern),
    like(client.ipv6Address, filterPattern)
  );
}

function assertClientNameAvailable(
  clients: { id: number; name: string }[],
  name: string,
  excludeId?: number
) {
  const normalized = name.toLowerCase();
  const taken = clients.some(
    (c) =>
      c.name.toLowerCase() === normalized &&
      (excludeId === undefined || c.id !== excludeId)
  );

  if (taken) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'zod.client.nameTaken',
    });
  }
}

function createPreparedStatement(db: DBType) {
  return {
    findAll: db.query.client
      .findMany({
        with: {
          oneTimeLink: true,
        },
      })
      .prepare('client_findAll'),
    findAllPublic: db.query.client
      .findMany({
        with: {
          oneTimeLink: true,
        },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
      })
      .prepare('client_findAllPublic'),
    findById: db.query.client
      .findFirst({ where: eq(client.id, sql.placeholder('id')) })
      .prepare('client_findById'),
    findByUserId: db.query.client
      .findMany({
        where: eq(client.userId, sql.placeholder('userId')),
        with: { oneTimeLink: true },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
      })
      .prepare('client_findByUserId'),
    findAllPublicFiltered: db.query.client
      .findMany({
        where: or(
          like(client.name, sql.placeholder('filter')),
          like(client.ipv4Address, sql.placeholder('filter')),
          like(client.ipv6Address, sql.placeholder('filter'))
        ),
        with: {
          oneTimeLink: true,
        },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
      })
      .prepare('client_findAllPublicFiltered'),
    findByUserIdFiltered: db.query.client
      .findMany({
        where: and(
          eq(client.userId, sql.placeholder('userId')),
          or(
            like(client.name, sql.placeholder('filter')),
            like(client.ipv4Address, sql.placeholder('filter')),
            like(client.ipv6Address, sql.placeholder('filter'))
          )
        ),
        with: { oneTimeLink: true },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
      })
      .prepare('client_findByUserIdFiltered'),
    toggle: db
      .update(client)
      .set({ enabled: sql.placeholder('enabled') as never as boolean })
      .where(eq(client.id, sql.placeholder('id')))
      .prepare('client_toggle'),
    delete: db
      .delete(client)
      .where(eq(client.id, sql.placeholder('id')))
      .prepare('client_delete'),
    updateTrafficStats: db
      .update(client)
      .set({
        trafficUsedBytes: sql.placeholder(
          'trafficUsedBytes'
        ) as never as number,
        trafficWgSnapshotBytes: sql.placeholder(
          'trafficWgSnapshotBytes'
        ) as never as number,
      })
      .where(eq(client.id, sql.placeholder('id')))
      .prepare('client_updateTrafficStats'),
    resetTraffic: db
      .update(client)
      .set({
        trafficUsedBytes: 0,
        trafficWgSnapshotBytes: 0,
      })
      .where(eq(client.id, sql.placeholder('id')))
      .prepare('client_resetTraffic'),
  };
}

export class ClientService {
  #db: DBType;
  #statements: ReturnType<typeof createPreparedStatement>;

  constructor(db: DBType) {
    this.#db = db;
    this.#statements = createPreparedStatement(db);
  }

  async getForUser(userId: ID) {
    const result = await this.#statements.findByUserId.execute({ userId });
    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Never return values directly from this function. Use {@link getAllPublic} instead.
   */
  async getAll() {
    const result = await this.#statements.findAll.execute();
    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Returns all clients without sensitive data
   */
  async getAllPublic() {
    const result = await this.#statements.findAllPublic.execute();
    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Get clients based on user ID and filter conditions
   */
  async getForUserFiltered(userId: ID, filter: string) {
    const filterPattern = `%${filter.toLowerCase()}%`;

    const result = await this.#statements.findByUserIdFiltered.execute({
      userId,
      filter: filterPattern,
    });

    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Get all clients based on filter conditions without sensitive data
   */
  async getAllPublicFiltered(filter: string) {
    const filterPattern = `%${filter.toLowerCase()}%`;

    const result = await this.#statements.findAllPublicFiltered.execute({
      filter: filterPattern,
    });

    return result.map(mapClientRow);
  }

  async getAllPublicPaginated({
    filter,
    page,
    pageSize,
    sort,
  }: ClientListParams) {
    const where = buildClientFilter(filter);
    const offset = (page - 1) * pageSize;
    const orderBy = sort === 'asc' ? asc(client.name) : desc(client.name);

    const [rows, countRows] = await Promise.all([
      this.#db.query.client.findMany({
        where,
        with: { oneTimeLink: true },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
        limit: pageSize,
        offset,
        orderBy,
      }),
      this.#db
        .select({ total: count() })
        .from(client)
        .where(where ?? sql`true`),
    ]);

    return {
      clients: rows.map(mapClientRow),
      total: Number(countRows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  async getForUserPaginated(
    userId: ID,
    { filter, page, pageSize, sort }: ClientListParams
  ) {
    const filterWhere = buildClientFilter(filter);
    const where = filterWhere
      ? and(eq(client.userId, userId), filterWhere)
      : eq(client.userId, userId);
    const offset = (page - 1) * pageSize;
    const orderBy = sort === 'asc' ? asc(client.name) : desc(client.name);

    const [rows, countRows] = await Promise.all([
      this.#db.query.client.findMany({
        where,
        with: { oneTimeLink: true },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
        limit: pageSize,
        offset,
        orderBy,
      }),
      this.#db.select({ total: count() }).from(client).where(where),
    ]);

    return {
      clients: rows.map(mapClientRow),
      total: Number(countRows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  get(id: ID) {
    return this.#statements.findById.execute({ id });
  }

  async create({ name, expiresAt, trafficLimitBytes }: ClientCreateType) {
    const privateKey = await wg.generatePrivateKey();
    const publicKey = await wg.getPublicKey(privateKey);
    const preSharedKey = await wg.generatePreSharedKey();

    return this.#db.transaction(async (tx) => {
      const clients = await tx.query.client.findMany().execute();
      const clientInterface = await tx.query.wgInterface
        .findFirst({
          where: eq(wgInterface.name, 'wg0'),
        })
        .execute();

      if (!clientInterface) {
        throw new Error('WireGuard interface not found');
      }

      const clientConfig = await tx.query.userConfig
        .findFirst({
          where: eq(userConfig.id, clientInterface.name),
        })
        .execute();

      if (!clientConfig) {
        throw new Error('WireGuard interface configuration not found');
      }

      assertClientNameAvailable(clients, name);

      const ipv4Cidr = parseCidr(clientInterface.ipv4Cidr);
      const ipv4Address = nextIP(4, ipv4Cidr, clients);
      const ipv6Cidr = parseCidr(clientInterface.ipv6Cidr);
      const ipv6Address = nextIP(6, ipv6Cidr, clients);

      return await tx
        .insert(client)
        .values({
          name,
          // TODO: properly assign user id
          userId: 1,
          interfaceId: 'wg0',
          expiresAt,
          privateKey,
          publicKey,
          preSharedKey,
          ipv4Address,
          ipv6Address,
          mtu: clientConfig.defaultMtu,
          jC: clientConfig.defaultJC,
          jMin: clientConfig.defaultJMin,
          jMax: clientConfig.defaultJMax,
          i1: clientConfig.defaultI1,
          i2: clientConfig.defaultI2,
          i3: clientConfig.defaultI3,
          i4: clientConfig.defaultI4,
          i5: clientConfig.defaultI5,
          persistentKeepalive: clientConfig.defaultPersistentKeepalive,
          serverAllowedIps: [],
          enabled: true,
          trafficLimitBytes: trafficLimitBytes ?? null,
          trafficUsedBytes: 0,
          trafficWgSnapshotBytes: 0,
        })
        .returning({ clientId: client.id })
        .execute();
    });
  }

  toggle(id: ID, enabled: boolean) {
    return this.#statements.toggle.execute({ id, enabled });
  }

  delete(id: ID) {
    return this.#statements.delete.execute({ id });
  }

  updateTrafficStats(
    id: ID,
    trafficUsedBytes: number,
    trafficWgSnapshotBytes: number
  ) {
    return this.#statements.updateTrafficStats.execute({
      id,
      trafficUsedBytes,
      trafficWgSnapshotBytes,
    });
  }

  resetTraffic(id: ID) {
    return this.#statements.resetTraffic.execute({ id });
  }

  update(id: ID, data: UpdateClientType) {
    return this.#db.transaction(async (tx) => {
      const clients = await tx.query.client
        .findMany({ columns: { id: true, name: true } })
        .execute();

      assertClientNameAvailable(clients, data.name, id);

      const clientInterface = await tx.query.wgInterface
        .findFirst({
          where: eq(wgInterface.name, 'wg0'),
        })
        .execute();

      if (!clientInterface) {
        throw new Error('WireGuard interface not found');
      }

      if (!containsCidr(clientInterface.ipv4Cidr, data.ipv4Address)) {
        throw new Error('IPv4 address is not within the CIDR range');
      }

      if (!containsCidr(clientInterface.ipv6Cidr, data.ipv6Address)) {
        throw new Error('IPv6 address is not within the CIDR range');
      }

      await tx.update(client).set(data).where(eq(client.id, id)).execute();
    });
  }

  async createFromExisting({
    name,
    enabled,
    ipv4Address,
    ipv6Address,
    preSharedKey,
    privateKey,
    publicKey,
  }: ClientCreateFromExistingType) {
    const clientConfig = await Database.userConfigs.get();

    return this.#db.transaction(async (tx) => {
      const clients = await tx.query.client
        .findMany({ columns: { id: true, name: true } })
        .execute();

      assertClientNameAvailable(clients, name);

      return tx
        .insert(client)
        .values({
          name,
          userId: 1,
          interfaceId: 'wg0',
          privateKey,
          publicKey,
          preSharedKey,
          ipv4Address,
          ipv6Address,
          mtu: clientConfig.defaultMtu,
          jC: clientConfig.defaultJC,
          jMin: clientConfig.defaultJMin,
          jMax: clientConfig.defaultJMax,
          i1: clientConfig.defaultI1,
          i2: clientConfig.defaultI2,
          i3: clientConfig.defaultI3,
          i4: clientConfig.defaultI4,
          allowedIps: clientConfig.defaultAllowedIps,
          dns: clientConfig.defaultDns,
          persistentKeepalive: clientConfig.defaultPersistentKeepalive,
          serverAllowedIps: [],
          enabled,
        })
        .execute();
    });
  }
}
