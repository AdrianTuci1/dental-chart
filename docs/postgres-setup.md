# Run the API on PostgreSQL

The API keeps its data in DynamoDB by default. Switching to PostgreSQL is a deployment
setting: the repositories are written against one document command set, and
`src/shared/infrastructure/documentClient.js` picks the adapter at startup.

## Where it runs

PostgreSQL works on long-running Node hosts: local development, the VPS, Docker and
Kubernetes. These hosts keep one process alive, so one pool serves every request.

Serverless hosts use DynamoDB. Lambda starts a pool per execution environment, and
`max_connections` is shared by every environment that happens to run at once; Cloudflare
Workers have no TCP sockets. `DB_DRIVER=postgres` on either host fails at startup with a
clear message instead of exhausting database connections under load. If a serverless
deployment ever needs PostgreSQL, route it through a pooler such as PgBouncer, RDS Proxy
or the Hyperdrive binding, and treat that as a separate deployment target.

## Configuration

```bash
DB_DRIVER=postgres
DATABASE_URL=postgres://user:password@host:5432/pixtooth
DATABASE_SSL=false
DATABASE_SCHEMA=public
DATABASE_AUTO_MIGRATE=true
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT_MS=10000
DATABASE_POOL_CONNECTION_TIMEOUT_MS=10000
```

`DATABASE_POOL_MAX` counts connections per process. PM2 runs `instances: 'max'`, so a
four-core VPS with the default opens up to 40 connections. Set it from the host's CPU
count and the database `max_connections`; leave room for migrations and admin sessions.
The API drains the pool on `SIGTERM`/`SIGINT`.

`DATABASE_SCHEMA` must be an existing schema; the default `public` is created by
PostgreSQL. With `DATABASE_AUTO_MIGRATE=true` the app creates `documents` on first use.
To run the DDL yourself, set `DATABASE_AUTO_MIGRATE=false` and apply:

```sql
CREATE TABLE IF NOT EXISTS public.documents (
    pk text NOT NULL,
    sk text NOT NULL,
    item text NOT NULL,
    PRIMARY KEY (pk, sk)
);
```

## Data model

One table, one row per item, with the same `PK`/`SK` keys the DynamoDB adapter uses.
`item` holds the JSON document the repository wrote, so accounts, workspaces, patients,
history, treatment plans, refresh tokens and analytics all live in `documents`.

The Postgres adapter evaluates filter and update expressions in Node after reading the
candidate rows. Current scans are scoped to a medic or a clinic, which keeps that
predictable. If a table outgrows it, the same expressions can move into SQL behind
`postgresDocumentClient.js` without touching the repositories.

## Moving existing data

Switching drivers starts from an empty PostgreSQL database; the app does not copy
DynamoDB rows. Export the items (`PK`, `SK` and attributes), keep the same JSON shape the
repositories write, and insert them into `documents` before cutting over.

## Operations

- Use SSL (`DATABASE_SSL=true`) when the database is not on a private network.
- The database user needs `SELECT`, `INSERT`, `UPDATE` and `DELETE` on `documents`.
- Backups and retention belong to the PostgreSQL service; DynamoDB TTL does not apply,
  so expired refresh tokens stay in the table until they are deleted.
- `tests/postgresDocumentClient.test.js` runs the adapter against `pg-mem`, so the test
  suite needs no PostgreSQL server.
- Watch connection counts after a deploy. Each PM2 worker holds its own pool, and a
  restart starts new connections before the old process exits.
