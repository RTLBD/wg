---
title: Migrate from SQLite to PostgreSQL
---

Starting with this release, `wg-easy` stores application data in **PostgreSQL** instead of the legacy SQLite file (`wg-easy.db`).

## Automatic upgrade

If you upgrade an existing installation that still has `/etc/wireguard/wg-easy.db` on the mounted volume:

1. Add a PostgreSQL service (see [Getting Started](../getting-started.md) or `docker-compose.yml` in the repository).
2. Set `DATABASE_URL` on the `wg` container, for example:

    ```env
    DATABASE_URL=postgresql://wgeasy:wgeasy@postgres:5432/wgeasy
    ```

3. Start the stack with `docker compose up -d`.

On first startup the application will:

1. Apply PostgreSQL schema migrations.
2. Detect the legacy SQLite database on the WireGuard volume.
3. Import users, clients, interfaces, hooks, and configuration into PostgreSQL.
4. Rename the SQLite file to `wg-easy.db.migrated` so the import does not run again.

Your WireGuard keys and interface configuration in `/etc/wireguard` are unchanged.

## Fresh installs

New installations only need PostgreSQL and `DATABASE_URL`. No SQLite file is created.

## Environment variables

| Env                  | Default                     | Description                              |
| -------------------- | --------------------------- | ---------------------------------------- |
| `DATABASE_URL`       | _(required)_                | PostgreSQL connection string             |
| `LEGACY_SQLITE_PATH` | `/etc/wireguard/wg-easy.db` | Path checked for automatic SQLite import |

## Manual rollback

The original SQLite database is preserved as `wg-easy.db.migrated` after a successful import. To inspect it:

```shell
sqlite3 /etc/wireguard/wg-easy.db.migrated '.tables'
```

Do not delete this file until you have verified the PostgreSQL migration in the Web UI.

## Troubleshooting

### `Missing environment variable: DATABASE_URL`

The application now requires PostgreSQL. Add the `postgres` service and `DATABASE_URL` to your Compose file.

### Import skipped

SQLite import is skipped when PostgreSQL already contains user records. This protects against overwriting an active database.

To force a re-import, stop the stack, clear the PostgreSQL volume, remove users from PostgreSQL, and restore `wg-easy.db` from the `.migrated` backup before starting again.
