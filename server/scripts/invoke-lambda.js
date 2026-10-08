#!/usr/bin/env node
/**
 * Runs the Lambda handler locally with a synthetic event, so the single-artifact
 * deployment can be exercised without deploying it.
 *
 * The default is the payload format 2.0 that API Gateway HTTP APIs send. Pass --v1 to
 * build a REST API (payload 1.0) event instead.
 *
 * Usage:
 *   node scripts/invoke-lambda.js GET /static/logo.png
 *   node scripts/invoke-lambda.js POST /api/ai/analyze @../dist/static/chart2.png
 *   node scripts/invoke-lambda.js --v1 GET /health
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const payloadVersion = argv.includes('--v1') ? '1.0' : '2.0';
const [methodArg = 'GET', pathArg = '/', bodyArg] = argv.filter((arg) => arg !== '--v1');

const method = methodArg.toUpperCase();
const isBinaryPath = /\.(png|jpe?g|svg|woff2?|ico)$/.test(pathArg);

const headers = {
    host: 'localhost',
    accept: isBinaryPath ? 'image/*' : 'text/html,application/json',
    'x-forwarded-for': '127.0.0.1',
};

if (bodyArg) {
    headers['content-type'] = 'application/octet-stream';
}

const buildEvent = (body) => {
    const encodedBody = body ? body.toString('base64') : undefined;

    if (payloadVersion === '1.0') {
        return {
            httpMethod: method,
            path: pathArg,
            resource: '/{proxy+}',
            headers,
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: { proxy: pathArg.replace(/^\//, '') },
            stageVariables: null,
            requestContext: {
                httpMethod: method,
                path: pathArg,
                identity: { sourceIp: '127.0.0.1' },
                protocol: 'HTTP/1.1',
            },
            body: encodedBody || null,
            isBase64Encoded: Boolean(body),
        };
    }

    return {
        version: '2.0',
        routeKey: '$default',
        rawPath: pathArg,
        rawQueryString: '',
        cookies: [],
        headers,
        requestContext: {
            http: {
                method,
                path: pathArg,
                protocol: 'HTTP/1.1',
                sourceIp: '127.0.0.1',
            },
        },
        body: encodedBody,
        isBase64Encoded: Boolean(body),
    };
};

const readBody = () => {
    if (!bodyArg) return null;
    const target = bodyArg.startsWith('@') ? bodyArg.slice(1) : bodyArg;
    return fs.readFileSync(path.resolve(__dirname, '..', target));
};

const main = async () => {
    const { handler } = require('../lambda');
    const response = await handler(buildEvent(readBody()), {});

    console.log(`payload: ${payloadVersion}`);
    console.log(`status:  ${response.statusCode}`);
    console.log(`binary:  ${response.isBase64Encoded === true}`);
    console.log(`headers: ${JSON.stringify(response.headers)}`);

    const bytes = response.isBase64Encoded
        ? Buffer.from(response.body || '', 'base64')
        : Buffer.from(response.body || '', 'utf8');

    console.log(`bytes:   ${bytes.length}`);
    console.log(`preview: ${bytes.subarray(0, 120).toString('utf8').replace(/\s+/g, ' ')}`);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
