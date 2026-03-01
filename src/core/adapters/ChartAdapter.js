import { ToothBuilder } from '../builders/ToothBuilder';

/**
 * Adapter pattern for translating API data to internal Domain representations.
 * Ensures the chart object conforms to UI expectations even if the backend payload is missing fields.
 */
export class ChartAdapter {
    /**
     * Parse raw data from API/DB into the format the UI expects.
     * Guaranteed to return a valid object.
     * @param {Object} rawChartData
     * @returns {Object} Valid structural Chart object
     */
    static toDomain(rawChartData) {
        if (!rawChartData) {
            return { teeth: {} };
        }

        const normalizedTeeth = {};

        // Ensure every tooth currently present in raw data has all required UI fields
        if (rawChartData.teeth) {
            Object.keys(rawChartData.teeth).forEach(toothNumber => {
                const rawTooth = rawChartData.teeth[toothNumber];

                // Use builder to enforce defaults but merge existing data
                normalizedTeeth[toothNumber] = new ToothBuilder(toothNumber, rawTooth).build();
            });
        }

        return {
            ...rawChartData,
            teeth: normalizedTeeth
        };
    }

    /**
     * Map domain object back to API format (strip out UI-only state if necessary)
     * @param {Object} domainChart
     * @returns {Object} API-ready Chart payload
     */
    static toApi(domainChart) {
        if (!domainChart) return {};

        // In the future, this is where you can strip out
        // internal flags or UI state that the backend shouldn't persist.
        return JSON.parse(JSON.stringify(domainChart));
    }
}
