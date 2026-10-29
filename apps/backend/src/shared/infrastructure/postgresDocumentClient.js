const { Pool } = require('pg');

/**
 * Postgres adapter for the same document commands the repositories already send to
 * DynamoDB. Each row is one item keyed by (PK, SK), which keeps the single-table model
 * and the repository code identical on both drivers.
 *
 * Filters and update expressions are evaluated in Node after reading the candidate rows.
 * The app's scans are scoped by tenant (a medic or a clinic), so this stays predictable;
 * a table that outgrows that can push the same expressions into SQL behind this module.
 */

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DOCUMENTS_TABLE = 'documents';

const splitTopLevel = (text, separator = ',') => {
    const parts = [];
    let current = '';
    let depth = 0;
    let quote = null;

    for (const character of text) {
        if (quote) {
            current += character;
            if (character === quote) quote = null;
            continue;
        }

        if (character === "'" || character === '"') {
            quote = character;
            current += character;
            continue;
        }

        if (character === '(') depth += 1;
        if (character === ')') depth -= 1;

        if (character === separator && depth === 0) {
            if (current.trim()) parts.push(current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    if (current.trim()) parts.push(current.trim());

    return parts;
};

const resolveName = (rawName, names = {}) => {
    const name = String(rawName).trim();

    if (!name.startsWith('#')) return name;

    const resolved = names[name];
    if (!resolved) throw new Error(`Unknown expression attribute name: ${name}`);

    return resolved;
};

const resolveValue = (rawValue, values = {}) => {
    const token = String(rawValue).trim();

    if (token.startsWith(':')) {
        if (!(token in values)) throw new Error(`Unknown expression attribute value: ${token}`);
        return values[token];
    }

    if (/^'.*'$/.test(token)) return token.slice(1, -1);
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);

    return token;
};

const matchClause = (clause, item, values, names) => {
    const beginsWith = clause.match(/^begins_with\s*\((.+?),\s*(.+)\)$/i);

    if (beginsWith) {
        const field = resolveName(beginsWith[1], names);
        const prefix = resolveValue(beginsWith[2], values);

        return String(item[field] ?? '').startsWith(String(prefix ?? ''));
    }

    const inList = clause.match(/^(.+?)\s+IN\s+\((.+)\)$/i);

    if (inList) {
        const field = resolveName(inList[1], names);
        const candidates = splitTopLevel(inList[2]).map((token) => resolveValue(token, values));

        return candidates.includes(item[field]);
    }

    const equality = clause.match(/^(.+?)\s*=\s*(.+)$/);

    if (equality) {
        const field = resolveName(equality[1], names);

        return item[field] === resolveValue(equality[2], values);
    }

    throw new Error(`postgresDocumentClient: unsupported expression clause "${clause}"`);
};

const matchExpression = (expression, item, values, names) => {
    if (!expression) return true;

    return String(expression)
        .split(/\s+AND\s+/i)
        .map((clause) => clause.trim())
        .filter(Boolean)
        .every((clause) => matchClause(clause, item, values, names));
};

const normalizeForStorage = (value) => {
    if (value instanceof Set) return [...value].map(normalizeForStorage);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalizeForStorage);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, normalizeForStorage(entry)])
        );
    }

    return value;
};

const applyUpdateExpression = (item, { UpdateExpression = '', ExpressionAttributeNames = {}, ExpressionAttributeValues = {} }) => {
    const addIndex = UpdateExpression.search(/\bADD\b/i);
    const setSection = (addIndex === -1 ? UpdateExpression : UpdateExpression.slice(0, addIndex))
        .replace(/^\s*SET\s+/i, '');
    const addSection = addIndex === -1 ? '' : UpdateExpression.slice(addIndex).replace(/^\s*ADD\s+/i, '');

    for (const clause of splitTopLevel(setSection)) {
        const equalsIndex = clause.indexOf('=');
        if (equalsIndex === -1) continue;

        const field = resolveName(clause.slice(0, equalsIndex), ExpressionAttributeNames);
        const expression = clause.slice(equalsIndex + 1).trim();
        const ifNotExists = expression.match(/^if_not_exists\s*\((.+?),\s*(.+?)\)(?:\s*\+\s*(.+))?$/i);

        if (ifNotExists) {
            const baseField = resolveName(ifNotExists[1], ExpressionAttributeNames);
            const fallback = resolveValue(ifNotExists[2], ExpressionAttributeValues);
            const delta = ifNotExists[3] ? resolveValue(ifNotExists[3], ExpressionAttributeValues) : 0;

            item[field] = (item[baseField] ?? fallback) + delta;
            continue;
        }

        item[field] = resolveValue(expression, ExpressionAttributeValues);
    }

    for (const clause of splitTopLevel(addSection)) {
        const match = clause.match(/^(.+?)\s+(.+)$/);
        if (!match) continue;

        const field = resolveName(match[1], ExpressionAttributeNames);
        const value = resolveValue(match[2], ExpressionAttributeValues);

        if (typeof value === 'number') {
            item[field] = (item[field] ?? 0) + value;
            continue;
        }

        const incoming = value instanceof Set ? [...value] : Array.isArray(value) ? value : [value];
        const existing = item[field] instanceof Set
            ? [...item[field]]
            : Array.isArray(item[field]) ? item[field] : [];

        item[field] = [...new Set([...existing, ...incoming])];
    }

    return item;
};

const parseRow = (row) => {
    if (!row) return undefined;

    return typeof row.item === 'string' ? JSON.parse(row.item) : row.item;
};

const parseKeyCondition = (expression, values, names) => {
    const match = String(expression || '').match(/PK\s*=\s*(:[A-Za-z0-9_]+)/i);
    if (!match) throw new Error('postgresDocumentClient: query needs a PK equality condition');

    return resolveValue(match[1], values);
};

class PostgresDocumentClient {
    constructor({
        connectionString,
        ssl = false,
        schema = 'public',
        pool = null,
        autoMigrate = true,
        max = 10,
        idleTimeoutMillis = 10000,
        connectionTimeoutMillis = 10000,
    } = {}) {
        if (!IDENTIFIER.test(schema)) {
            throw new Error(`Invalid DATABASE_SCHEMA "${schema}"`);
        }

        this.schema = schema;
        this.table = `${schema}.${DOCUMENTS_TABLE}`;
        this.autoMigrate = autoMigrate;
        this.ownsPool = !pool;
        this.pool = pool || new Pool({
            connectionString,
            max,
            idleTimeoutMillis,
            connectionTimeoutMillis,
            ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
        });
        this.schemaReady = null;
    }

    async ensureSchema() {
        if (!this.autoMigrate) return;

        if (!this.schemaReady) {
            this.schemaReady = this.pool.query(
                `CREATE TABLE IF NOT EXISTS ${this.table} (`
                + 'pk text NOT NULL, sk text NOT NULL, item text NOT NULL, PRIMARY KEY (pk, sk))'
            );
        }

        try {
            await this.schemaReady;
        } catch (error) {
            this.schemaReady = null;
            throw error;
        }
    }

    async put(item) {
        const normalized = normalizeForStorage(item);

        await this.pool.query(
            `INSERT INTO ${this.table} (pk, sk, item) VALUES ($1, $2, $3) `
            + 'ON CONFLICT (pk, sk) DO UPDATE SET item = EXCLUDED.item',
            [normalized.PK, normalized.SK, JSON.stringify(normalized)]
        );

        return normalized;
    }

    async get(pk, sk) {
        const result = await this.pool.query(
            `SELECT item FROM ${this.table} WHERE pk = $1 AND sk = $2`,
            [pk, sk]
        );

        return parseRow(result.rows[0]);
    }

    async delete(pk, sk) {
        await this.pool.query(
            `DELETE FROM ${this.table} WHERE pk = $1 AND sk = $2`,
            [pk, sk]
        );
    }

    async query(command) {
        const { KeyConditionExpression, ExpressionAttributeValues = {}, ExpressionAttributeNames = {} } = command.input;
        const pk = parseKeyCondition(KeyConditionExpression, ExpressionAttributeValues, ExpressionAttributeNames);
        const result = await this.pool.query(
            `SELECT item FROM ${this.table} WHERE pk = $1`,
            [pk]
        );

        return result.rows
            .map(parseRow)
            .filter((item) => matchExpression(
                KeyConditionExpression,
                item,
                ExpressionAttributeValues,
                ExpressionAttributeNames
            ));
    }

    async scan(command) {
        const { FilterExpression, ExpressionAttributeValues = {}, ExpressionAttributeNames = {} } = command.input;
        const result = await this.pool.query(`SELECT item FROM ${this.table}`);

        return result.rows
            .map(parseRow)
            .filter((item) => matchExpression(
                FilterExpression,
                item,
                ExpressionAttributeValues,
                ExpressionAttributeNames
            ));
    }

    async update(command) {
        const key = command.input.Key;
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            const found = await client.query(
                `SELECT item FROM ${this.table} WHERE pk = $1 AND sk = $2 FOR UPDATE`,
                [key.PK, key.SK]
            );
            const item = parseRow(found.rows[0]) || { PK: key.PK, SK: key.SK };

            applyUpdateExpression(item, command.input);

            const normalized = normalizeForStorage(item);
            await client.query(
                `INSERT INTO ${this.table} (pk, sk, item) VALUES ($1, $2, $3) `
                + 'ON CONFLICT (pk, sk) DO UPDATE SET item = EXCLUDED.item',
                [normalized.PK, normalized.SK, JSON.stringify(normalized)]
            );
            await client.query('COMMIT');

            return { Attributes: normalized };
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    }

    async send(command) {
        await this.ensureSchema();

        switch (command.constructor.name) {
            case 'PutCommand': {
                const item = await this.put(command.input.Item);
                return { Attributes: item };
            }
            case 'GetCommand': {
                const item = await this.get(command.input.Key.PK, command.input.Key.SK);
                return item ? { Item: item } : {};
            }
            case 'DeleteCommand':
                await this.delete(command.input.Key.PK, command.input.Key.SK);
                return {};
            case 'QueryCommand': {
                const items = await this.query(command);
                return { Items: items };
            }
            case 'ScanCommand': {
                const items = await this.scan(command);
                return { Items: items };
            }
            case 'UpdateCommand':
                return this.update(command);
            default:
                throw new Error(`postgresDocumentClient: unsupported command ${command.constructor.name}`);
        }
    }

    async close() {
        if (this.ownsPool) {
            await this.pool.end();
        }
    }
}

const createPostgresDocumentClient = (options) => new PostgresDocumentClient(options);

module.exports = {
    PostgresDocumentClient,
    createPostgresDocumentClient,
    // Exported for tests of the expression subset.
    matchExpression,
    applyUpdateExpression,
};
