const { docClient: dynamoDocumentClient } = require('./dynamoClient');

/**
 * Repository infrastructure picks the document store once, when the composition root
 * starts. Both adapters understand the same command objects, so the repositories do not
 * branch on the driver.
 */
const createDocumentClient = (config) => {
    if (config.database.driver !== 'postgres') {
        return dynamoDocumentClient;
    }

    // A variable specifier keeps `pg` (and its Node-only sockets) out of the Worker
    // bundle. The Worker never selects the Postgres driver.
    const modulePath = './postgresDocumentClient';
    const { createPostgresDocumentClient } = require(modulePath);

    const { pool, ...postgres } = config.database.postgres;

    return createPostgresDocumentClient({
        ...postgres,
        max: pool.max,
        idleTimeoutMillis: pool.idleTimeoutMillis,
        connectionTimeoutMillis: pool.connectionTimeoutMillis,
    });
};

module.exports = { createDocumentClient };
