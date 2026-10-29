/**
 * Hand-managed files live under one prefix, separate from Vite's hashed build output.
 *
 * Vite emits content-hashed bundles into /assets/, while everything copied from
 * public/ keeps its name. The two must not share a prefix, otherwise a cache rule
 * that treats /assets/* as immutable would pin tooth images and fixtures forever.
 * Keep every hand-managed path in this module so the split stays visible in code:
 * hashed build output -> /assets/, everything below -> STATIC_BASE.
 */
export const STATIC_BASE = '/static';

export const staticPath = (relativePath) => `${STATIC_BASE}/${String(relativePath).replace(/^\/+/, '')}`;
