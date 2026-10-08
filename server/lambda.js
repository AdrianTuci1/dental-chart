const serverless = require('serverless-http');
const app = require('./app');

/**
 * Entry point for the single-artifact AWS deployment, where one Lambda package serves
 * both the API and the built frontend from dist/.
 *
 * API Gateway sends binary bodies base64 encoded and expects binary responses the same
 * way, so the content types that travel through the function are listed here.
 */
const BINARY_CONTENT_TYPES = [
    'application/octet-stream',
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'font/woff2',
];

module.exports.handler = serverless(app, { binary: BINARY_CONTENT_TYPES });
