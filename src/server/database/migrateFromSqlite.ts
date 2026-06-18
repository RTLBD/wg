import { existsSync, renameSync } from 'node:fs';

import { createClient } from '@libsql/client';
import { createDebug } from 'obug';
import { sql } from 'drizzle-orm';

import type { DBType } from './postgres';
import * as schema from './schema';

const MIGRATE_DEBUG = createDebug('Database');

type SqliteRow = Record<string, unknown>;

function sqliteBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function parseJsonColumn<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value as T;
}

async function readSqliteTable(
  sqlitePath: string,
  table: string
): Promise<SqliteRow[]> {
  const client = createClient({ url: `file:${sqlitePath}` });
  const result = await client.execute(`SELECT * FROM ${table}`);
  return result.rows as SqliteRow[];
}

export function getLegacySqlitePath() {
  return process.env.LEGACY_SQLITE_PATH ?? '/etc/wireguard/wg-easy.db';
}

export function legacySqliteDatabaseExists() {
  return existsSync(getLegacySqlitePath());
}

export async function migrateFromSqlite(db: DBType) {
  const sqlitePath = getLegacySqlitePath();

  if (!existsSync(sqlitePath)) {
    return false;
  }

  const users = await db.query.user.findMany({ columns: { id: true } });
  if (users.length > 0) {
    MIGRATE_DEBUG(
      'PostgreSQL already has user data; skipping SQLite import from',
      sqlitePath
    );
    return false;
  }

  MIGRATE_DEBUG('Importing data from legacy SQLite database:', sqlitePath);

  await db.execute(sql`TRUNCATE TABLE
    one_time_links_table,
    clients_table,
    user_configs_table,
    hooks_table,
    interfaces_table,
    general_table,
    users_table
    RESTART IDENTITY CASCADE`);

  const usersRows = await readSqliteTable(sqlitePath, 'users_table');
  if (usersRows.length > 0) {
    await db.insert(schema.user).values(
      usersRows.map((row) => ({
        id: Number(row.id),
        username: String(row.username),
        password: String(row.password),
        email: row.email ? String(row.email) : null,
        name: String(row.name),
        role: Number(row.role) as Role,
        totpKey: row.totp_key ? String(row.totp_key) : null,
        totpVerified: sqliteBool(row.totp_verified),
        enabled: sqliteBool(row.enabled),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('users_table', 'id'), COALESCE((SELECT MAX(id) FROM users_table), 1))`
    );
  }

  const interfaceRows = await readSqliteTable(sqlitePath, 'interfaces_table');
  if (interfaceRows.length > 0) {
    await db.insert(schema.wgInterface).values(
      interfaceRows.map((row) => ({
        name: String(row.name),
        device: String(row.device),
        port: Number(row.port),
        privateKey: String(row.private_key),
        publicKey: String(row.public_key),
        ipv4Cidr: String(row.ipv4_cidr),
        ipv6Cidr: String(row.ipv6_cidr),
        mtu: Number(row.mtu),
        jC: row.j_c === null ? null : Number(row.j_c),
        jMin: row.j_min === null ? null : Number(row.j_min),
        jMax: row.j_max === null ? null : Number(row.j_max),
        s1: row.s1 === null ? null : Number(row.s1),
        s2: row.s2 === null ? null : Number(row.s2),
        s3: row.s3 === null ? null : Number(row.s3),
        s4: row.s4 === null ? null : Number(row.s4),
        h1: row.h1 ? String(row.h1) : null,
        h2: row.h2 ? String(row.h2) : null,
        h3: row.h3 ? String(row.h3) : null,
        h4: row.h4 ? String(row.h4) : null,
        i1: row.i1 ? String(row.i1) : null,
        i2: row.i2 ? String(row.i2) : null,
        i3: row.i3 ? String(row.i3) : null,
        i4: row.i4 ? String(row.i4) : null,
        i5: row.i5 ? String(row.i5) : null,
        enabled: sqliteBool(row.enabled),
        firewallEnabled: sqliteBool(row.firewall_enabled ?? false),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
  }

  const generalRows = await readSqliteTable(sqlitePath, 'general_table');
  if (generalRows.length > 0) {
    await db.insert(schema.general).values(
      generalRows.map((row) => ({
        id: Number(row.id),
        setupStep: Number(row.setup_step),
        sessionPassword: String(row.session_password),
        sessionTimeout: Number(row.session_timeout),
        metricsPrometheus: sqliteBool(row.metrics_prometheus),
        metricsJson: sqliteBool(row.metrics_json),
        metricsPassword: row.metrics_password
          ? String(row.metrics_password)
          : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
  }

  const hooksRows = await readSqliteTable(sqlitePath, 'hooks_table');
  if (hooksRows.length > 0) {
    await db.insert(schema.hooks).values(
      hooksRows.map((row) => ({
        id: String(row.id),
        preUp: String(row.pre_up),
        postUp: String(row.post_up),
        preDown: String(row.pre_down),
        postDown: String(row.post_down),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
  }

  const userConfigRows = await readSqliteTable(
    sqlitePath,
    'user_configs_table'
  );
  if (userConfigRows.length > 0) {
    await db.insert(schema.userConfig).values(
      userConfigRows.map((row) => ({
        id: String(row.id),
        defaultMtu: Number(row.default_mtu),
        defaultPersistentKeepalive: Number(row.default_persistent_keepalive),
        defaultDns: parseJsonColumn<string[]>(row.default_dns) ?? [],
        defaultAllowedIps:
          parseJsonColumn<string[]>(row.default_allowed_ips) ?? [],
        defaultJC: row.default_j_c === null ? null : Number(row.default_j_c),
        defaultJMin:
          row.default_j_min === null ? null : Number(row.default_j_min),
        defaultJMax:
          row.default_j_max === null ? null : Number(row.default_j_max),
        defaultI1: row.default_i1 ? String(row.default_i1) : null,
        defaultI2: row.default_i2 ? String(row.default_i2) : null,
        defaultI3: row.default_i3 ? String(row.default_i3) : null,
        defaultI4: row.default_i4 ? String(row.default_i4) : null,
        defaultI5: row.default_i5 ? String(row.default_i5) : null,
        host: String(row.host),
        port: Number(row.port),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
  }

  const clientRows = await readSqliteTable(sqlitePath, 'clients_table');
  if (clientRows.length > 0) {
    await db.insert(schema.client).values(
      clientRows.map((row) => ({
        id: Number(row.id),
        userId: Number(row.user_id),
        interfaceId: String(row.interface_id),
        name: String(row.name),
        ipv4Address: String(row.ipv4_address),
        ipv6Address: String(row.ipv6_address),
        preUp: String(row.pre_up ?? ''),
        postUp: String(row.post_up ?? ''),
        preDown: String(row.pre_down ?? ''),
        postDown: String(row.post_down ?? ''),
        privateKey: String(row.private_key),
        publicKey: String(row.public_key),
        preSharedKey: String(row.pre_shared_key),
        expiresAt: row.expires_at ? String(row.expires_at) : null,
        allowedIps: parseJsonColumn<string[]>(row.allowed_ips),
        serverAllowedIps:
          parseJsonColumn<string[]>(row.server_allowed_ips) ?? [],
        firewallIps: parseJsonColumn<string[] | null>(row.firewall_ips),
        persistentKeepalive: Number(row.persistent_keepalive),
        mtu: Number(row.mtu),
        jC: row.j_c === null ? null : Number(row.j_c),
        jMin: row.j_min === null ? null : Number(row.j_min),
        jMax: row.j_max === null ? null : Number(row.j_max),
        i1: row.i1 ? String(row.i1) : null,
        i2: row.i2 ? String(row.i2) : null,
        i3: row.i3 ? String(row.i3) : null,
        i4: row.i4 ? String(row.i4) : null,
        i5: row.i5 ? String(row.i5) : null,
        dns: parseJsonColumn<string[]>(row.dns),
        serverEndpoint: row.server_endpoint
          ? String(row.server_endpoint)
          : null,
        trafficLimitBytes:
          row.traffic_limit_bytes === null
            ? null
            : Number(row.traffic_limit_bytes),
        trafficUsedBytes: Number(row.traffic_used_bytes ?? 0),
        trafficWgSnapshotBytes: Number(row.traffic_wg_snapshot_bytes ?? 0),
        enabled: sqliteBool(row.enabled),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('clients_table', 'id'), COALESCE((SELECT MAX(id) FROM clients_table), 1))`
    );
  }

  const otlRows = await readSqliteTable(sqlitePath, 'one_time_links_table');
  if (otlRows.length > 0) {
    await db.insert(schema.oneTimeLink).values(
      otlRows.map((row) => ({
        id: Number(row.id),
        oneTimeLink: String(row.one_time_link),
        expiresAt: String(row.expires_at),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    );
  }

  const backupPath = `${sqlitePath}.migrated`;
  renameSync(sqlitePath, backupPath);
  MIGRATE_DEBUG('SQLite import complete. Renamed database to', backupPath);

  return true;
}
