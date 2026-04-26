const TreatmentPlanService = require('../services/TreatmentPlanService');
const treatmentPlanService = new TreatmentPlanService();

exports.addTreatmentPlanItem = async (req, res) => {
    try {
        const { patientId } = req.params;
        const planData = req.body;

        const newItem = await treatmentPlanService.addTreatmentPlanItem(patientId, planData);
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
