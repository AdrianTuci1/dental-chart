const ClinicService = require('../services/ClinicService');

const clinicService = new ClinicService();

exports.createClinic = async (req, res) => {
    try {
        const clinicData = req.body;
        const newClinic = await clinicService.createClinic(clinicData);
        res.status(201).json(newClinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const clinic = await clinicService.getClinic(id);

        if (!clinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.listMedicClinics = async (req, res) => {
    try {
        const { id } = req.params;
        const clinics = await clinicService.listMedicClinics(id);
        res.json(clinics);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getClinicMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const members = await clinicService.getClinicMembers(id);
        res.json(members);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.inviteMedic = async (req, res) => {
    try {
        const { id } = req.params;
        const invitation = await clinicService.inviteMedic(id, req.body);
        res.status(201).json(invitation);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.acceptInvitation = async (req, res) => {
    try {
        const { id, inviteId } = req.params;
        const { medicId } = req.body;
        const clinic = await clinicService.acceptInvitation(id, inviteId, medicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.transferOwnership = async (req, res) => {
    try {
        const { id } = req.params;
        const { newOwnerMedicId } = req.body;
        const clinic = await clinicService.transferOwnership(id, newOwnerMedicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
