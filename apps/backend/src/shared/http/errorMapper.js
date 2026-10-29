const { AppError } = require('../errors/AppError');

const isHttpStatus = (value) => Number.isInteger(value) && value >= 400 && value <= 599;

/**
 * One conversion from a thrown value to an HTTP answer, shared by the Express error
 * middleware and the Cloudflare Worker dispatch. Both hosts must answer the same shape
 * for the same failure; keeping the mapping here is what guarantees it.
 */
const toHttpError = (error) => {
    if (error instanceof AppError) {
        return { statusCode: error.statusCode, body: error.toJSON() };
    }

    if (isHttpStatus(error?.statusCode)) {
        return { statusCode: error.statusCode, body: { error: error.message } };
    }

    // Express's body parser reports malformed JSON with `status`, not `statusCode`.
    if (isHttpStatus(error?.status)) {
        return { statusCode: error.status, body: { error: error.message } };
    }

    // An unexpected failure is a bug, not a message for the caller. Local and test runs
    // keep the detail so a stack trace is not the only clue.
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (error?.message || 'Internal server error');

    return { statusCode: 500, body: { error: message } };
};

module.exports = { toHttpError };
