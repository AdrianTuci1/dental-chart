const ClinicService = require('../services/ClinicService');

const clinicService = new ClinicService();

exports.createClinic = async (req, res) => {
    try {
        const clinicData = req.body;
        const newClinic = await clinicService.createClinic(clinicData);
        res.status(201).json(newClinic);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
};
