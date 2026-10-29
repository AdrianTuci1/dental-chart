const { toHttpError } = require('./errorMapper');

/**
 * Terminal Express error middleware. Controllers call next(error) through asyncHandler
 * and this is the only place that turns an error into a status code and a JSON body.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
    const { statusCode, body } = toHttpError(error);

    if (statusCode >= 500) {
        console.error(`[http] ${req.method} ${req.originalUrl} failed:`, error?.stack || error);
    }

    if (res.headersSent) {
        return next(error);
    }

    res.status(statusCode).json(body);
};

module.exports = { errorHandler };
