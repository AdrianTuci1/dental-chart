/**
 * Base interface/class for synchronization strategies.
 * Defines the contract that all concrete strategies must implement.
 */
export class SyncStrategy {
    /**
     * Sends an update to the remote source (e.g., backend API).
     * @param {string} actionType - The type of action (e.g., 'UPDATE_PATIENT', 'ADD_TREATMENT').
     * @param {Object} payload - The data to send.
     * @returns {Promise<any>}
     */
    async sendUpdate() {
        throw new Error("Method 'sendUpdate()' must be implemented.");
    }

    /**
     * Subscribes to changes from the remote source (e.g., via SSE or WebSockets).
     * @param {Function} callback - The function to call when an update is received.
     * @returns {Function} - A function to unsubscribe/cleanup the listener.
     */
    listenForChanges() {
        throw new Error("Method 'listenForChanges()' must be implemented.");
    }
}
