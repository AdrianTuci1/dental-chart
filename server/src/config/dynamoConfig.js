const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-central-1',
    // add credentials here if needed for local dev, otherwise IAM roles/env vars are used
});

const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});

module.exports = { docClient };
