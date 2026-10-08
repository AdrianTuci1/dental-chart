const express = require('express');
const { routes, expressPatternFor } = require('./definitions');

const router = express.Router();

// The one route that takes a raw image upload. Every other route is parsed by the
// body parsers mounted in app.js.
const rawBody = express.raw({ type: 'application/octet-stream', limit: '10mb' });

for (const route of routes) {
    const handlers = [...route.middleware];

    if (route.rawBody) {
        handlers.push(rawBody);
    }

    handlers.push(route.handler);
    router[route.method](expressPatternFor(route.path), ...handlers);
}

module.exports = router;
