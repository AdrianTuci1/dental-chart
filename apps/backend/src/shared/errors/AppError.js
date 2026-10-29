/**
 * Errors that carry an HTTP meaning. The application and domain layers throw these;
 * the HTTP adapters only translate them, so no controller decides a status code.
 */
class AppError extends Error {
    constructor(message, statusCode = 500, { code = null, details = null, meta = null, expose = statusCode < 500 } = {}) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.meta = meta;
        this.expose = expose;
    }

    toJSON() {
        return {
            error: this.message,
            ...(this.code ? { code: this.code } : {}),
            ...(this.details ? { details: this.details } : {}),
            ...(this.meta || {}),
        };
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request', options = {}) {
        super(message, 400, options);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', options = {}) {
        super(message, 401, options);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', options = {}) {
        super(message, 403, options);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Not found', options = {}) {
        super(message, 404, options);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflict', options = {}) {
        super(message, 409, options);
    }
}

class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', options = {}) {
        super(message, 503, options);
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ServiceUnavailableError,
};
