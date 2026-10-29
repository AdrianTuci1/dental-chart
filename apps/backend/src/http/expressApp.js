const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const { CSP_DIRECTIVES, SECURITY_HEADERS } = require('./securityHeaders');
const { createRateLimit } = require('./rateLimitMiddleware');
const { resolveApiRateLimitKey } = require('./rateLimitKey');
const { rateLimitConfig } = require('./config/rateLimitConfig');
const { setAssetProvider } = require('../modules/ai/infrastructure/assetProvider');
const { createNodeAssetProvider } = require('../modules/ai/infrastructure/nodeAssetProvider');
const { NO_STORE, cacheControlFor } = require('./staticPolicy');
const { healthPayload } = require('./health');
const { errorHandler } = require('../shared/http/errorHandler');
const apiRoutes = require('../routes/api');
const { API_PREFIX } = require('../routes/definitions');

const parseAllowedOrigins = (value) => {
    const configuredOrigins = value
        ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
        : [];

    const defaults = [
        'http://localhost:5173',
        'https://app.pixtooth.com',
    ];

    return [...new Set([...defaults, ...configuredOrigins])];
};

const pagesDomainPattern = /\.pages\.dev$/;

// The built frontend lives in apps/frontend/dist next to apps/backend, both in the
// repository and in the Lambda artifact. A host that serves the files elsewhere, such as
// the VPS behind Nginx, points STATIC_DIR at it.
const distDir = process.env.STATIC_DIR || path.join(__dirname, '../../../frontend/dist');
const docsDir = path.join(__dirname, '../../docs');

/**
 * Builds the Express host: middleware, the shared route table, the docs, the SPA shell
 * and the error mapper. `app.js` owns the process concerns; this module owns the HTTP
 * adapter, mirroring `workerApp.js` on the Worker host.
 */
const createExpressApp = () => {
    const app = express();
    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

    // The AI module reads its assets through this provider. They come from the same built
    // tree the browser downloads them from, so /api/ai/assets/chart2.png and
    // /static/chart2.png can never disagree.
    setAssetProvider(createNodeAssetProvider(path.join(distDir, 'static')));

    // Middleware
    app.set('trust proxy', 1);

    // helmet needs Node, so the Worker sets its header set by hand. Both read the values
    // from securityHeaders.js, which keeps the two hosts from drifting.
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            useDefaults: false,
            directives: CSP_DIRECTIVES,
        },
    }));

    // helmet emits its own set. Setting every shared entry here, after helmet, is what
    // makes the Node response byte-for-byte identical to the Worker's, CSP string included.
    app.use((req, res, next) => {
        for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
            res.setHeader(name, value);
        }

        next();
    });
    app.use(cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin) || pagesDomainPattern.test(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Origin not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    const apiRateLimit = createRateLimit({
        ...rateLimitConfig.api,
        keyResolver: resolveApiRateLimitKey,
    });

    // The DNS zone sits on Cloudflare, which caches by file extension on its own, and a
    // cache rule can widen that further. Marking the whole API no-store here means the
    // edge can only ever hold the built frontend, whatever the rules say. A controller
    // that wants a different value still can: setHeader below overrides this one.
    app.use(API_PREFIX, (req, res, next) => {
        res.setHeader('Cache-Control', NO_STORE);
        next();
    });

    app.use(API_PREFIX, apiRateLimit, apiRoutes);

    // An API path that no route claims. Without this the request falls through to
    // Express's HTML error page, while the Worker answers the same path with JSON, so a
    // client would have to parse two formats for one condition.
    app.use(API_PREFIX, (req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    // sendFile only fills Cache-Control in when nothing has set it, so this is what the
    // response carries. It also keeps the two hosts identical: the Worker answers /docs
    // with the value from cacheControlFor, and Express would otherwise say public,
    // max-age=0.
    const sendDoc = (res, file) => {
        res.setHeader('Cache-Control', cacheControlFor('/docs'));

        return res.sendFile(path.join(docsDir, file));
    };

    app.get('/docs', (req, res) => sendDoc(res, 'index.html'));

    app.get('/docs/', (req, res) => sendDoc(res, 'index.html'));

    app.get('/docs/openapi.yaml', (req, res) => {
        res.type('application/yaml');

        return sendDoc(res, 'openapi.yaml');
    });

    app.get('/health', (req, res) => {
        res.setHeader('Cache-Control', NO_STORE);

        res.status(200).json(healthPayload());
    });

    // Deployments without a local dist/ (an API-only shape) skip this block entirely.
    const distIndex = path.join(distDir, 'index.html');

    if (fs.existsSync(distIndex)) {
        app.use(express.static(distDir, {
            index: false,
            setHeaders(res, filePath) {
                const relative = '/' + path.relative(distDir, filePath).split(path.sep).join('/');
                res.setHeader('Cache-Control', cacheControlFor(relative));
            },
        }));

        // Deep links fall back to the SPA shell. A path that names a file keeps its 404,
        // so a missing image or bundle stays visible instead of arriving as HTML with
        // status 200.
        app.use((req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') return next();
            if (req.path.startsWith('/api/') || req.path.startsWith('/docs')) return next();
            if (path.extname(req.path)) return next();

            res.setHeader('Cache-Control', cacheControlFor('/index.html'));
            res.sendFile(distIndex);
        });
    }

    // Only failures reach this middleware: controllers and the Worker chain both forward
    // the error, and the mapping from error to status/body lives in shared/http/errorMapper.
    app.use(errorHandler);

    return app;
};

module.exports = { createExpressApp };
