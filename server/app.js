const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const helmet = require('helmet');

const EmailService = require('./src/services/EmailService');

const app = express();
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST;

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

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
const pagesDomainPattern = /\.pages\.dev$/;

const path = require('path');
const fs = require('fs');
const { createRateLimit } = require('./src/middleware/rateLimitMiddleware');
const { resolveApiRateLimitKey } = require('./src/utils/rateLimit');
const { rateLimitConfig } = require('./src/config/rateLimit');
const { setAssetProvider } = require('./src/services/assetProvider');
const { createNodeAssetProvider } = require('./src/services/nodeAssetProvider');
const { NO_STORE, cacheControlFor } = require('./src/http/staticPolicy');
const { healthPayload } = require('./src/http/health');

// Static frontend. The single-artifact Lambda package carries dist/ next to the API, so
// one process serves both. A host that serves dist/ elsewhere, such as the VPS behind
// Nginx, points STATIC_DIR at it.
const distDir = process.env.STATIC_DIR || path.join(__dirname, '../dist');

// The AI module reads its assets through this provider. They come from the same built
// tree the browser downloads them from, so /api/ai/assets/chart2.png and
// /static/chart2.png can never disagree.
setAssetProvider(createNodeAssetProvider(path.join(distDir, 'static')));

// Middleware
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "https://api.pixtooth.com", "https://*.pages.dev", "https://cdn.jsdelivr.net"],
        },
    },
}));
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

// Routes
const apiRoutes = require('./src/routes/api');
const { API_PREFIX } = require('./src/routes/definitions');

const apiRateLimit = createRateLimit({
    ...rateLimitConfig.api,
    keyResolver: resolveApiRateLimitKey,
});

// The DNS zone sits on Cloudflare, which caches by file extension on its own, and a cache
// rule can widen that further. Marking the whole API no-store here means the edge can only
// ever hold the built frontend, whatever the rules say. A controller that wants a
// different value still can: setHeader below overrides this one.
app.use(API_PREFIX, (req, res, next) => {
    res.setHeader('Cache-Control', NO_STORE);
    next();
});

app.use(API_PREFIX, apiRateLimit, apiRoutes);

// An API path that no route claims. Without this the request falls through to Express's
// HTML error page, while the Worker answers the same path with JSON, so a client would
// have to parse two formats for one condition.
app.use(API_PREFIX, (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const docsDir = path.join(__dirname, 'docs');

// sendFile only fills Cache-Control in when nothing has set it, so this is what the
// response carries. It also keeps the two hosts identical: the Worker answers /docs with
// the value from cacheControlFor, and Express would otherwise say public, max-age=0.
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

// Health Check Route
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

    // Deep links fall back to the SPA shell. A path that names a file keeps its 404, so a
    // missing image or bundle stays visible instead of arriving as HTML with status 200.
    app.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        if (req.path.startsWith('/api/') || req.path.startsWith('/docs')) return next();
        if (path.extname(req.path)) return next();

        res.setHeader('Cache-Control', cacheControlFor('/index.html'));
        res.sendFile(distIndex);
    });
}

// Start Server only if not imported as a module (e.g for testing)
if (require.main === module) {
    const onListen = () => {
        const address = HOST || '0.0.0.0';
        console.log(`Server is running on ${address}:${PORT}`);

        const emailProvider = EmailService.describeProvider();
        if (emailProvider.configured) {
            console.log(`[EmailService] outbound email provider: ${emailProvider.provider}`);
        } else {
            console.warn(`[EmailService] WARNING: outbound email is disabled - ${emailProvider.detail}`);
        }
    };

    if (HOST) {
        app.listen(PORT, HOST, onListen);
    } else {
        app.listen(PORT, onListen);
    }
}

module.exports = app;
