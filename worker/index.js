/**
 * Cloudflare Worker entry point.
 *
 * One deployment carries both halves: `apps/frontend/dist` through the ASSETS binding and
 * the API through the shared route table. This file stays thin on purpose, so both hosts
 * keep running the same code under apps/backend/.
 */
import workerApp from '../apps/backend/src/http/workerApp.js';

export default {
    async fetch(request, env, ctx) {
        return workerApp.handle(request, env, ctx);
    },
};
