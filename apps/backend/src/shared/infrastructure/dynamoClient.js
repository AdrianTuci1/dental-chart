const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const isWorkerRuntime = globalThis.navigator?.userAgent === 'Cloudflare-Workers';

/**
 * On workerd there are no sockets, so the SDK has to talk over fetch, and credentials
 * arrive as Worker secrets rather than through the Node credential chain (which walks
 * config files and SSO caches that do not exist there). Everywhere else the defaults
 * stay untouched.
 */
const buildClientOptions = () => {
    const options = {
        region: process.env.AWS_REGION || 'eu-central-1',
    };

    if (!isWorkerRuntime) {
        return options;
    }

    const { FetchHttpHandler } = require('@smithy/fetch-http-handler');
    options.requestHandler = new FetchHttpHandler();

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        options.credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
        };
    } else {
        // Placeholder credentials keep client construction away from the Node provider
        // chain, which cannot run here. Requests then fail with a clear access error and
        // a log line instead of breaking every route, including the static ones.
        console.warn('[dynamo] AWS credentials are not configured; data routes will fail');
        options.credentials = { accessKeyId: 'unconfigured', secretAccessKey: 'unconfigured' };
    }

    return options;
};

let documentClient = null;

/**
 * Built on first use rather than at import time: a broken credential setup should fail
 * the request that needs DynamoDB instead of stopping the isolate from booting.
 */
const getDocumentClient = () => {
    if (!documentClient) {
        documentClient = DynamoDBDocumentClient.from(new DynamoDBClient(buildClientOptions()), {
            marshallOptions: {
                removeUndefinedValues: true,
            },
        });
    }

    return documentClient;
};

const docClient = {
    send: (command) => getDocumentClient().send(command),
};

module.exports = { docClient, getDocumentClient };
