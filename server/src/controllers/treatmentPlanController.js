const TreatmentPlanService = require('../services/TreatmentPlanService');
const PatientService = require('../services/PatientService');
const TelemetryService = require('../services/TelemetryService');
const { extractMedicIdFromAuthHeader } = require('../utils/auth');
const treatmentPlanService = new TreatmentPlanService();
const patientService = new PatientService();
const telemetryService = new TelemetryService();

exports.addTreatmentPlanItem = async (req, res) => {
    try {
        const { patientId } = req.params;
        const planData = req.body;

        const newItem = await treatmentPlanService.addTreatmentPlanItem(patientId, planData);
        const patient = await patientService.getPatient(patientId);
        await telemetryService.trackEvent({
            eventName: 'treatment_plan_item_added',
            category: 'treatment',
            userId: extractMedicIdFromAuthHeader(req.headers.authorization) || patient?.medicId || null,
            clinicId: patient?.clinicId || null,
            entityType: 'patient',
            entityId: patientId,
            metadata: {
                treatmentType: planData.type || null,
                procedure: planData.procedure || null,
            },
        });
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPatientTreatmentPlans = async (req, res) => {
    try {
        const { patientId } = req.params;
        const plans = await treatmentPlanService.getPatientTreatmentPlans(patientId);
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
