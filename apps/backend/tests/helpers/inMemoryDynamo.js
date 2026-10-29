/**
 * In-memory stand-in for the DynamoDB document client.
 *
 * It understands the subset of key-condition and filter expressions used by the
 * repositories in this project, which lets route tests exercise the real services
 * and HTTP layer without touching AWS.
 */

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const recordKey = (item) => `${item.PK}::${item.SK}`;

const resolveName = (rawName, expressionNames = {}) => {
    const name = rawName.trim();
    if (name.startsWith('#')) {
        const resolved = expressionNames[name];
        if (!resolved) {
            throw new Error(`Unknown expression attribute name: ${name}`);
        }
        return resolved;
    }
    return name;
};

const resolveValue = (rawValue, expressionValues = {}) => {
    const token = rawValue.trim();
    if (token.startsWith(':')) {
        if (!(token in expressionValues)) {
            throw new Error(`Unknown expression attribute value: ${token}`);
        }
        return expressionValues[token];
    }
    return token.replace(/^'|'$/g, '');
};

const splitClauses = (expression) => expression.split(/\s+AND\s+/i).map((clause) => clause.trim()).filter(Boolean);

const matchClause = (clause, item, expressionValues, expressionNames) => {
    const beginsWith = clause.match(/^begins_with\((.+),(.+)\)$/i);
    if (beginsWith) {
        const field = resolveName(beginsWith[1], expressionNames);
        const prefix = resolveValue(beginsWith[2], expressionValues);
        return String(item[field] ?? '').startsWith(String(prefix ?? ''));
    }

    const inList = clause.match(/^(.+?)\s+IN\s+\((.+)\)$/i);
    if (inList) {
        const field = resolveName(inList[1], expressionNames);
        const candidates = inList[2].split(',').map((token) => resolveValue(token, expressionValues));
        return candidates.includes(item[field]);
    }

    const equality = clause.match(/^(.+?)\s*=\s*(.+)$/);
    if (equality) {
        const field = resolveName(equality[1], expressionNames);
        return item[field] === resolveValue(equality[2], expressionValues);
    }

    throw new Error(`inMemoryDynamo: unsupported expression clause "${clause}"`);
};

const matchExpression = (expression, item, expressionValues, expressionNames) => {
    if (!expression) {
        return true;
    }

    return splitClauses(expression).every((clause) => matchClause(clause, item, expressionValues, expressionNames));
};

class InMemoryDynamo {
    constructor() {
        this.store = new Map();
        this.sentCommands = [];
    }

    reset() {
        this.store.clear();
        this.sentCommands = [];
    }

    seed(items) {
        items.forEach((item) => this.store.set(recordKey(item), clone(item)));
    }

    all() {
        return Array.from(this.store.values()).map(clone);
    }

    async send(command) {
        const type = command.constructor.name;
        const input = command.input || {};
        this.sentCommands.push({ type, input: clone(input) });

        const {
            ExpressionAttributeValues: values,
            ExpressionAttributeNames: names,
        } = input;

        switch (type) {
            case 'PutCommand': {
                const item = clone(input.Item);
                this.store.set(recordKey(item), item);
                return { Attributes: clone(item) };
            }

            case 'GetCommand': {
                const item = this.store.get(`${input.Key.PK}::${input.Key.SK}`);
                return { Item: clone(item) };
            }

            case 'DeleteCommand': {
                this.store.delete(`${input.Key.PK}::${input.Key.SK}`);
                return {};
            }

            case 'QueryCommand': {
                const items = this.all().filter(
                    (item) => matchExpression(input.KeyConditionExpression, item, values, names)
                );
                return { Items: items, Count: items.length };
            }

            case 'ScanCommand': {
                const items = this.all().filter(
                    (item) => matchExpression(input.FilterExpression, item, values, names)
                );
                return { Items: items, Count: items.length };
            }

            default:
                throw new Error(`inMemoryDynamo: unsupported command "${type}"`);
        }
    }
}

const instance = new InMemoryDynamo();

module.exports = instance;
