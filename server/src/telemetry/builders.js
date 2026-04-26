const buildPatientCreatedEvent = ({ req, responseBody, userId }) => ({
    eventName: 'patient_created',
    category: 'patient',
    userId: userId || req.body.medicId || null,
    clinicId: responseBody?.clinicId || null,
    entityType: 'patient',
    entityId: responseBody?.id || null,
    metadata: {
        ownerMedicId: responseBody?.ownerMedicId || null,
    },
});

const buildPatientUpdatedEvent = ({ req, responseBody, userId }) => ({
    eventName: 'patient_updated',
    category: 'patient',
    userId: userId || responseBody?.medicId || null,
    clinicId: responseBody?.clinicId || null,
    entityType: 'patient',
    entityId: req.params.id,
});

const buildPatientDeletedEvent = ({ req, userId }) => ({
    eventName: 'patient_deleted',
    category: 'patient',
    userId: userId || req.patientContext?.medicId || null,
    clinicId: req.patientContext?.clinicId || null,
    entityType: 'patient',
    entityId: req.params.id,
});

const buildHistoryRecordAddedEvent = ({ req, userId }) => ({
    eventName: 'history_record_added',
    category: 'treatment',
    userId: userId || req.patientContext?.medicId || null,
    clinicId: req.patientContext?.clinicId || null,
    entityType: 'patient',
    entityId: req.params.patientId,
    metadata: {
        treatmentType: req.body.type || null,
        procedure: req.body.procedure || null,
    },
});

const buildTreatmentPlanItemAddedEvent = ({ req, userId }) => ({
    eventName: 'treatment_plan_item_added',
    category: 'treatment',
    userId: userId || req.patientContext?.medicId || null,
    clinicId: req.patientContext?.clinicId || null,
    entityType: 'patient',
    entityId: req.params.patientId,
    metadata: {
        treatmentType: req.body.type || null,
        procedure: req.body.procedure || null,
    },
});

module.exports = {
    buildPatientCreatedEvent,
    buildPatientUpdatedEvent,
    buildPatientDeletedEvent,
    buildHistoryRecordAddedEvent,
    buildTreatmentPlanItemAddedEvent,
};
