/**
 * Wraps an async route handler so a rejected promise reaches the express error
 * middleware (or the Worker chain) instead of leaving the request hanging.
 *
 * The returned function keeps the (req, res, next) shape both HTTP hosts understand.
 */
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

module.exports = { asyncHandler };
