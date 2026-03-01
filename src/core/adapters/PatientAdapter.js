import { PatientBuilder } from '../builders/PatientBuilder';

/**
 * Adapter (Anti-Corruption Layer) for Patient data.
 * Translates between external API formats and our internal Domain format.
 */
export class PatientAdapter {
    /**
     * Translates an API response into a standardized domain object.
     * @param {Object} apiResponse - The raw payload from the backend API.
     * @returns {Object} - A standardized Patient object.
     */
    static toDomain(apiResponse) {
        if (!apiResponse) return null;

        // Use Builder to securely construct the object
        const builder = new PatientBuilder()
            .withId(apiResponse.patient_id || apiResponse.id) // Normalizing ID field names
            .withName(apiResponse.full_name || apiResponse.name)
            .withTreatmentPlan(apiResponse.treatment_plan?.items || [])
            .withHistory(apiResponse.history?.completedItems || [])
            .withChartContext(apiResponse.dental_chart || apiResponse.chart);

        return builder.build();
    }

    /**
     * Translates an internal domain object back to the API format for saving.
     * @param {Object} domainObject - The internal Patient object
     * @returns {Object} - The payload to send to the backend
     */
    static toApi(domainObject) {
        if (!domainObject) return null;

        // Strip UI-specific fields or transform to backend's required structure
        return {
            patient_id: domainObject.id,
            full_name: domainObject.name,
            treatment_plan: domainObject.treatmentPlan,
            history: domainObject.history,
            dental_chart: domainObject.chart
        };
    }
}
