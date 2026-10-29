/**
 * Proxy to wrap store actions or API calls with additional behavior
 * like logging, debouncing, or caching.
 */
export class ActionProxy {
    /**
     * Wraps an action with a debounce mechanism.
     * @param {Function} action - The action to execute.
     * @param {number} delayMs - The debounce delay in milliseconds.
     * @returns {Function} - The debounced action.
     */
    static debounceSync(action, delayMs = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                action.apply(this, args);
            }, delayMs);
        };
    }

    /**
     * Wraps an action with logging before and after execution.
     * @param {Function} action - The action to execute.
     * @param {string} actionName - The name of the action for logging.
     * @returns {Function} - The wrapped action.
     */
    static withLogging(action, actionName) {
        return function (...args) {
            console.log(`[Proxy] Executing ${actionName} with args:`, args);
            const result = action.apply(this, args);
            console.log(`[Proxy] Finished ${actionName}`);
            return result;
        };
    }
}
