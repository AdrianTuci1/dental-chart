const { BadRequestError } = require('../../../shared/errors/AppError');

/**
 * The one password rule the account endpoints enforce. Kept next to the account domain
 * so registration, reset and change cannot drift apart.
 */
class Password {
    static MIN_LENGTH = 8;

    static assertValid(value, { field = 'password' } = {}) {
        if (typeof value !== 'string' || value.length < Password.MIN_LENGTH) {
            throw new BadRequestError(`${field} must be at least ${Password.MIN_LENGTH} characters long`);
        }
    }
}

module.exports = { Password };
