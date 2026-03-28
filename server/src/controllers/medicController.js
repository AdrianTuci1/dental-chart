const MedicService = require('../services/MedicService');
const medicService = new MedicService();

exports.createMedic = async (req, res) => {
    try {
        const medicData = req.body;
        const newMedic = await medicService.createMedic(medicData);
        res.status(201).json(newMedic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMedic = async (req, res) => {
    try {
        const { id } = req.params;
        const medic = await medicService.getMedic(id);

        if (!medic) {
            return res.status(404).json({ error: 'Medic not found' });
        }
        res.json(medic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMedicPatients = async (req, res) => {
    try {
        const { id } = req.params;
        const patients = await medicService.getMedicPatients(id);
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.seedMedicData = async (req, res) => {
    try {
        const { id } = req.params;
        await medicService.seedMedicData(id);
        res.json({ message: 'Success: Seeded/Updated mock data for medic' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
