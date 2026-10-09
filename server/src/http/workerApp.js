/**
 * Runs the API on the Cloudflare Worker runtime.
 *
 * Express cannot run on workerd, so this module rebuilds the part of its request and
 * response surface that the controllers actually use: res.status/json/send/setHeader,
 * and req.body/params/headers/query/ip/path. Everything below that line — the route
 * table, the controllers, the services, the repositories — is the same code the
 * Node/Lambda host runs, so there is one behaviour to maintain.
 *
 * Known differences from the Express host, both deliberate:
 *  - Rate limiting counts per isolate, because the in-memory buckets are not shared.
 *    A Durable Object is the upgrade path when exact limits matter.
 *  - Unhandled errors answer with JSON instead of Express's default HTML page.
 */
const { routes, API_PREFIX } = require('../routes/definitions');
const { NO_STORE, cacheControlFor } = require('./staticPolicy');
const { SECURITY_HEADERS } = require('./securityHeaders');
const { setAssetProvider } = require('../services/assetProvider');
const { createAssetsProvider } = require('./workerAssets');
const { healthPayload } = require('./health');

const JSON_TYPE = 'application/json; charset=utf-8';

// Every use of json() is either an API answer, a health probe or an error, and none of
// them may be kept by the edge. See NO_STORE.
const json = (status, payload) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': JSON_TYPE, 'Cache-Control': NO_STORE },
});

// --- route matching -------------------------------------------------------

const compileRoute = (route) => {
    const wildcard = route.path.endsWith('/*');
    const path = wildcard ? route.path.slice(0, -2) : route.path;

    return {
        ...route,
        wildcard,
        segments: path.split('/').filter(Boolean),
    };
};

const compiledRoutes = routes.map(compileRoute);

const matchRoute = (method, pathname) => {
    if (!pathname.startsWith(`${API_PREFIX}/`)) return null;

    const parts = pathname.slice(API_PREFIX.length).split('/').filter(Boolean);

    for (const route of compiledRoutes) {
        if (route.method.toUpperCase() !== method) continue;
        if (route.wildcard ? parts.length <= route.segments.length : parts.length !== route.segments.length) continue;

        const params = {};
        let matched = true;

        for (let index = 0; index < route.segments.length; index += 1) {
            const segment = route.segments[index];

            if (segment.startsWith(':')) {
                params[segment.slice(1)] = decodeURIComponent(parts[index]);
            } else if (segment !== parts[index]) {
                matched = false;
                break;
            }
        }

        if (!matched) continue;

        if (route.wildcard) {
            params[0] = decodeURIComponent(parts.slice(route.segments.length).join('/'));
        }

        return { route, params };
    }

    return null;
};

// --- request and response shims -------------------------------------------

const parseBody = async (request) => {
    const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    if (!contentType) return undefined;

    if (contentType === 'application/json') {
        const text = await request.text();
        if (!text) return undefined;

        try {
            return JSON.parse(text);
        } catch {
            return undefined;
        }
    }

    if (contentType === 'application/x-www-form-urlencoded') {
        return Object.fromEntries(new URLSearchParams(await request.text()));
    }

    // The AI controller hands this straight to fetch as an octet-stream body.
    if (contentType === 'application/octet-stream') {
        return Buffer.from(await request.arrayBuffer());
    }

    return undefined;
};

const lowerCaseHeaders = (request) => {
    const headers = {};
    request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });
    return headers;
};

const buildRequest = async (request, url, params) => {
    const headers = lowerCaseHeaders(request);
    const ip = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || 'unknown';

    return {
        method: request.method,
        path: url.pathname,
        url: request.url,
        originalUrl: `${url.pathname}${url.search}`,
        headers,
        params,
        query: Object.fromEntries(url.searchParams),
        body: await parseBody(request),
        ip,
        socket: { remoteAddress: ip },
        get: (name) => headers[String(name).toLowerCase()],
        header: (name) => headers[String(name).toLowerCase()],
    };
};

const createResponse = () => {
    let statusCode = 200;
    let body = null;
    // Default to uncacheable. This shim only serves API routes, and a controller that
    // sets its own Cache-Control replaces this value.
    const headers = new Headers({ 'Cache-Control': NO_STORE });

    const res = {
        finished: false,

        status(code) {
            statusCode = code;
            return res;
        },
        setHeader(name, value) {
            headers.set(name, String(value));
            return res;
        },
        getHeader: (name) => headers.get(name),
        type(value) {
            headers.set('Content-Type', value);
            return res;
        },
        json(payload) {
            headers.set('Content-Type', JSON_TYPE);
            body = JSON.stringify(payload);
            res.finished = true;
            return res;
        },
        send(payload) {
            body = payload === undefined ? null : payload;
            res.finished = true;
            return res;
        },
        end(payload) {
            if (payload !== undefined) body = payload;
            res.finished = true;
            return res;
        },
        sendStatus(code) {
            statusCode = code;
            res.finished = true;
            return res;
        },
        redirect(location) {
            statusCode = 302;
            headers.set('Location', location);
            res.finished = true;
            return res;
        },

        toResponse(method) {
            const isBinary = typeof body !== 'string' && body !== null && body !== undefined;

            return new Response(method === 'HEAD' ? null : body, {
                status: statusCode,
                headers,
            });
        },
    };

    return res;
};

/**
 * Runs middlewares then the handler, in declaration order. A middleware moves the chain
 * along by calling next(), an async controller answers and leaves res.finished set.
 */
const runChain = async (handlers, req, res) => {
    for (const handler of handlers) {
        if (res.finished) break;

        let advanced = false;
        let failure = null;

        const next = (error) => {
            if (error) failure = error;
            advanced = true;
        };

        const returned = handler(req, res, next);

        if (returned && typeof returned.then === 'function') {
            try {
                await returned;
            } catch (error) {
                failure = error;
            }
        }

        if (failure) throw failure;
        if (!advanced) break;
    }
};

// --- dispatch -------------------------------------------------------------

const withCachePolicy = (response, pathname, method) => {
    const headers = new Headers(response.headers);
    // A miss or an error must not sit in the edge cache for an hour.
    headers.set('Cache-Control', response.ok ? cacheControlFor(pathname) : 'no-cache');

    return new Response(method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

const fetchAsset = async (env, request, pathname) => env.ASSETS.fetch(
    new Request(new URL(pathname, new URL(request.url).origin), {
        method: 'GET',
        headers: request.headers,
    }),
);

const runRoute = async (request, url, match, env) => {
    setAssetProvider(createAssetsProvider(env));

    const req = await buildRequest(request, url, match.params);
    const res = createResponse();

    try {
        await runChain([...match.route.middleware, match.route.handler], req, res);
    } catch (error) {
        console.error(`[worker] ${match.route.method} ${match.route.path} failed:`, error?.message || error);
        return json(500, { error: 'Internal server error' });
    }

    if (!res.finished) {
        return json(500, { error: 'Route produced no response' });
    }

    return res.toResponse(request.method);
};

const serveStatic = async (request, env) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const looksLikeFile = /\.[a-z0-9]+$/i.test(pathname);

    // Deep links get the shell; a path that names a file keeps its 404.
    const target = looksLikeFile ? pathname : '/index.html';
    const response = await fetchAsset(env, request, target);

    if (response.status === 404 && !looksLikeFile) {
        return json(404, { error: 'Not found' });
    }

    return withCachePolicy(response, looksLikeFile ? pathname : '/index.html', request.method);
};

const dispatch = async (request, env) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/health') {
        return json(200, healthPayload());
    }

    if (pathname === '/docs' || pathname === '/docs/') {
        return withCachePolicy(await fetchAsset(env, request, '/api-docs/index.html'), '/docs', request.method);
    }

    if (pathname === '/docs/openapi.yaml') {
        const response = await fetchAsset(env, request, '/api-docs/openapi.yaml');

        if (!response.ok) {
            return json(404, { error: 'Not found' });
        }

        const headers = new Headers(response.headers);
        // set, not append: the assets binding answers with text/yaml and the route
        // contract is application/yaml, and appending leaves both on the response.
        headers.set('Content-Type', 'application/yaml');

        const withType = new Response(response.body, { status: response.status, headers });

        return withCachePolicy(withType, '/docs/openapi.yaml', request.method);
    }

    if (pathname.startsWith('/api/')) {
        const match = matchRoute(request.method, pathname);

        if (!match) {
            return json(404, { error: 'Not found' });
        }

        return runRoute(request, url, match, env);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return json(404, { error: 'Not found' });
    }

    return serveStatic(request, env);
};

/**
 * Every answer leaves through here, errors and assets included. helmet is Node-only, so
 * the Worker sets the same header set by hand from the shared module; a header that only
 * covers the happy path is the one that gets forgotten.
 */
const withSecurityHeaders = (response) => {
    const headers = new Headers(response.headers);

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        headers.set(name, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

const handle = async (request, env) => withSecurityHeaders(await dispatch(request, env));

module.exports = {
    handle,
    dispatch,
    withSecurityHeaders,
    matchRoute,
    createResponse,
    runChain,
    parseBody,
};
