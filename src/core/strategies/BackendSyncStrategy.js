import { SyncStrategy } from './SyncStrategy';

/**
 * Concrete strategy for synchronizing data with the REST API and Server-Sent Events.
 */
export class BackendSyncStrategy extends SyncStrategy {
    constructor() {
        super();
        this.eventSource = null;
    }

    async sendUpdate(actionType, payload) {
        console.log(`[BackendSyncStrategy] Sending update: ${actionType}`, payload);

        // TODO: Replace with actual fetch/axios call to your backend
        // Example:
        // const response = await fetch('/api/sync', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ actionType, payload })
        // });
        // return await response.json();

        // Simulated network delay for now
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
    }

    listenForChanges() {
        console.log('[BackendSyncStrategy] Setting up SSE listener...');

        // TODO: Replace with actual SSE implementation
        // Example:
        // this.eventSource = new EventSource('/api/stream');
        // this.eventSource.onmessage = (event) => {
        //     const data = JSON.parse(event.data);
        //     callback(data);
        // };

        return () => {
            console.log('[BackendSyncStrategy] Cleaning up SSE listener...');
            if (this.eventSource) {
                this.eventSource.close();
            }
        };
    }
}
