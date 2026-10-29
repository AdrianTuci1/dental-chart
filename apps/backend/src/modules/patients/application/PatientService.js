const { v4: uuidv4 } = require('uuid');

const PatientRepository = require('../infrastructure/PatientRepository');
const HistoryRepository = require('../infrastructure/HistoryRepository');
const TreatmentPlanRepository = require('../infrastructure/TreatmentPlanRepository');
const ClinicService = require('../../clinic/application/ClinicService');
const { Clinic } = require('../../clinic/domain/Clinic');
const { Medic } = require('../../identity/domain/Medic');
const { Patient, PatientChart } = require('../domain/Patient');
const {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} = require('../../../shared/errors/AppError');

const EXTERNAL_PATIENT_FIELDS = ['id', 'name', 'dateOfBirth', 'gender', 'phone', 'email'];

/**
 * Patient application service: the patient record plus its chart (history and treatment
 * plan). Workspace access is delegated to the clinic module through the injected service.
 */
class PatientService {
    constructor({
        patientRepository = new PatientRepository(),
        historyRepository = new HistoryRepository(),
        treatmentPlanRepository = new TreatmentPlanRepository(),
        medicRepository = null,
        clinicService = new ClinicService(),
        idGenerator = uuidv4,
    } = {}) {
        this.patientRepository = patientRepository;
        this.historyRepository = historyRepository;
        this.treatmentPlanRepository = treatmentPlanRepository;
        this.medicRepository = medicRepository;
        this.clinicService = clinicService;
        this.idGenerator = idGenerator;
    }

    async createPatient(patientData, options = {}) {
        const name = Patient.resolveName(patientData);
        if (!patientData.medicId || !name) {
            throw new BadRequestError('medicId and name are required');
        }

        const medic = await this.medicRepository.getMedicById(patientData.medicId);
        if (!medic) {
            throw new NotFoundError('Medic not found');
        }

        const clinic = await this.clinicService.resolveClinicForMedic(patientData.medicId, patientData.clinicId);

        if (!options.skipPlanLimit) {
            await this.assertPatientLimit(medic, clinic);
        }

        const { fullName: _unusedFullName, ...rest } = patientData;

        const newPatient = {
            id: rest.id || this.idGenerator(),
            ...rest,
            name,
            clinicId: clinic.id,
            ownerMedicId: patientData.ownerMedicId || patientData.medicId,
        };

        const { history, treatmentPlan, ...metadata } = newPatient;

        await Promise.all([
            this.patientRepository.createPatient(metadata),
            this.historyRepository.updateHistory(newPatient.id, history?.completedItems || []),
            this.treatmentPlanRepository.updateTreatmentPlan(newPatient.id, treatmentPlan?.items || []),
        ]);

        return this.getPatientFullRecord(newPatient.id);
    }

    /**
     * A license covers its own account everywhere and every member of a shared
     * workspace it owns. Each account keeps the five-patient cap in a personal
     * workspace, and a shared workspace without a license is capped per member.
     */
    async assertPatientLimit(medic, clinic) {
        if (new Medic(medic).isLicensed()) {
            return;
        }

        let owner = medic;

        if (clinic.ownerMedicId && String(clinic.ownerMedicId) !== String(medic.id)) {
            owner = await this.medicRepository.getMedicById(clinic.ownerMedicId);
        }

        const isPersonalWorkspace = new Clinic(clinic).isDefaultWorkspace(owner);

        if (!isPersonalWorkspace && new Medic(owner || {}).isLicensed()) {
            return;
        }

        const patientCount = await this.patientRepository
            .countPatientsByOwnerMedicIdInClinic(medic.id, clinic.id);

        if (patientCount >= 5) {
            throw new ForbiddenError('Free accounts can only manage up to 5 patients per workspace');
        }
    }

    async getPatient(id) {
        if (!id) {
            throw new BadRequestError('Patient ID is required');
        }
        return this.patientRepository.getPatientById(id);
    }

    async getPatientFullRecord(id) {
        if (!id) {
            throw new BadRequestError('Patient ID is required');
        }

        const chart = PatientChart.fromRecords(await this.patientRepository.getPatientWithChartAndHistory(id));

        if (!chart.exists) {
            throw new NotFoundError('Patient not found');
        }

        return chart.toFullRecord();
    }

    async getPatientsByMedicId(medicId) {
        if (!medicId) {
            throw new BadRequestError('Medic ID is required');
        }

        const clinics = await this.clinicService.listMedicClinics(medicId);
        const clinicIds = clinics.map((clinic) => clinic.id);
        const [clinicPatients, legacyOwnedPatients] = await Promise.all([
            this.patientRepository.getPatientsByClinicIds(clinicIds),
            this.patientRepository.getPatientsByMedicId(medicId),
        ]);

        return this.deduplicate([...clinicPatients, ...legacyOwnedPatients]);
    }

    async getPatientsByClinic(medicId, clinicId) {
        if (!medicId || !clinicId) {
            throw new BadRequestError('medicId and clinicId are required');
        }

        const [medic, clinics] = await Promise.all([
            this.medicRepository.getMedicById(medicId),
            this.clinicService.listMedicClinics(medicId),
        ]);

        const clinic = clinics.find((entry) => String(entry.id) === String(clinicId));
        if (!clinic) {
            throw new ForbiddenError('Medic does not have access to the selected clinic');
        }

        const isDefaultWorkspace = String(clinicId) === String(medic?.defaultClinicId);

        const [clinicPatients, ownedPatients] = await Promise.all([
            this.patientRepository.getPatientsByClinicIds([clinicId]),
            // Patients that predate workspaces only show up in the default one.
            isDefaultWorkspace ? this.patientRepository.getPatientsByMedicId(medicId) : Promise.resolve([]),
        ]);

        return this.deduplicate([
            ...clinicPatients,
            ...ownedPatients.filter((patient) => !patient.clinicId),
        ]);
    }

    /**
     * Attaches patients that have no workspace yet to the given one. Used when an
     * account is migrated to the default-workspace structure.
     */
    async assignPatientsWithoutClinic(medicId, clinicId) {
        if (!medicId || !clinicId) {
            throw new BadRequestError('medicId and clinicId are required');
        }

        const patients = await this.patientRepository.getPatientsByMedicId(medicId);
        const unassigned = patients.filter((patient) => !patient.clinicId);

        for (const patient of unassigned) {
            const { history, treatmentPlan, PK, SK, ...metadata } = patient;
            await this.patientRepository.updatePatient(patient.id, {
                ...metadata,
                clinicId,
            });
        }

        return unassigned.length;
    }

    async deletePatient(id) {
        if (!id) {
            throw new BadRequestError('Patient ID is required');
        }
        return this.patientRepository.deletePatient(id);
    }

    async updatePatient(id, patientData) {
        if (!id) {
            throw new BadRequestError('Patient ID is required');
        }

        const normalized = Patient.normalizePayload(patientData);
        const { history, treatmentPlan, ...incomingMetadata } = normalized;

        // Partial updates from the patient modal must not erase fields they did not send.
        let finalMetadata = incomingMetadata;
        try {
            const existing = await this.getPatientFullRecord(id);
            const { history: _history, treatmentPlan: _plan, ...existingMetadata } = existing;
            finalMetadata = { ...existingMetadata, ...incomingMetadata };
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }

        const updates = [this.patientRepository.updatePatient(id, finalMetadata)];

        if (history && history.completedItems) {
            updates.push(this.historyRepository.updateHistory(id, history.completedItems));
        }

        if (treatmentPlan && treatmentPlan.items) {
            updates.push(this.treatmentPlanRepository.updateTreatmentPlan(id, treatmentPlan.items));
        }

        await Promise.all(updates);

        return this.getPatientFullRecord(id);
    }

    async deletePatientsByOwnerMedicId(ownerMedicId) {
        if (!ownerMedicId) {
            throw new BadRequestError('ownerMedicId is required');
        }

        await this.patientRepository.deletePatientsByOwnerMedicId(ownerMedicId);
    }

    async deletePatientsByClinicId(clinicId) {
        if (!clinicId) {
            throw new BadRequestError('clinicId is required');
        }

        await this.patientRepository.deletePatientsByClinicId(clinicId);
    }

    async getPatientsOwnedByMedic(ownerMedicId) {
        return this.patientRepository.getPatientsByOwnerMedicId(ownerMedicId);
    }

    async upsertExternalPatient(medicId, patientPayload) {
        const externalPayload = this._pickExternalFields(patientPayload);
        const name = externalPayload.name || patientPayload.fullName;

        if (!name) {
            throw new BadRequestError('name is required');
        }

        if (externalPayload.id) {
            const existingPatient = await this.getPatient(externalPayload.id);
            if (!existingPatient) {
                throw new NotFoundError('Patient not found');
            }

            if (!(await this.medicHasAccessToPatient(medicId, existingPatient))) {
                throw new ForbiddenError('Medic does not have access to this patient');
            }

            return this.updatePatient(externalPayload.id, {
                ...externalPayload,
                name,
            });
        }

        return this.createPatient({
            ...externalPayload,
            name,
            medicId,
            lastExamDate: 'N/A',
            treatmentPlan: { items: [] },
            history: { completedItems: [] },
            chart: { teeth: {} },
        });
    }

    async deleteExternalPatient(medicId, patientId) {
        const patient = await this.getPatient(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        if (!(await this.medicHasAccessToPatient(medicId, patient))) {
            throw new ForbiddenError('Medic does not have access to this patient');
        }

        await this.deletePatient(patientId);
    }

    async medicHasAccessToPatient(medicId, patient) {
        if (!patient) {
            return false;
        }

        if (patient.ownerMedicId === medicId || patient.medicId === medicId) {
            return true;
        }

        if (!patient.clinicId) {
            return false;
        }

        const clinics = await this.clinicService.listMedicClinics(medicId);
        return clinics.some((clinic) => clinic.id === patient.clinicId);
    }

    deduplicate(patients) {
        const byId = new Map();
        patients.forEach((patient) => {
            byId.set(patient.id, patient);
        });
        return Array.from(byId.values());
    }

    _pickExternalFields(payload = {}) {
        return EXTERNAL_PATIENT_FIELDS.reduce((acc, field) => {
            if (payload[field] !== undefined) {
                acc[field] = payload[field];
            }
            return acc;
        }, {});
    }
}

module.exports = PatientService;
