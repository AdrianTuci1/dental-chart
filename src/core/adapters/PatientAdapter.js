import { PatientBuilder } from '../builders/PatientBuilder';
import { ChartAdapter } from './ChartAdapter';

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
            .withMedicId(apiResponse.medicId || apiResponse.medic_id)
            .withName(apiResponse.full_name || apiResponse.fullName || apiResponse.name)
            .withEmail(apiResponse.email)
            .withPhone(apiResponse.phone)
            .withDateOfBirth(apiResponse.dateOfBirth || apiResponse.date_of_birth)
            .withGender(apiResponse.gender)
            .withLastExamDate(apiResponse.lastExamDate || apiResponse.last_exam_date)
            .withTreatmentPlan(apiResponse.treatmentPlan?.items || apiResponse.treatment_plan?.items || [])
            .withHistory(apiResponse.history?.completedItems || apiResponse.history?.completed_items || [])
            .withChartContext(ChartAdapter.toDomain(apiResponse.dental_chart || apiResponse.chart))
            .withOralHealth(apiResponse.oralHealth || apiResponse.oral_health)
            .withBPE(apiResponse.bpe)
            .withMedicalIssues(apiResponse.medicalIssues || apiResponse.medical_issues);

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
            id: domainObject.id,
            medicId: domainObject.medicId,
            name: domainObject.name || domainObject.fullName,
            email: domainObject.email,
            phone: domainObject.phone,
            dateOfBirth: domainObject.dateOfBirth,
            gender: domainObject.gender,
            lastExamDate: domainObject.lastExamDate,
            treatmentPlan: domainObject.treatmentPlan,
            history: domainObject.history,
            dental_chart: ChartAdapter.toApi(domainObject.chart),
            oralHealth: domainObject.oralHealth,
            bpe: domainObject.bpe,
            medicalIssues: domainObject.medicalIssues
        };
    }
}
