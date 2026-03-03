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
    // Note: To implement this properly we need to query patients by medic_id.
    // In DynamoDB Single-Table Design with our current access patterns,
    // we would likely need a Global Secondary Index (GSI) like GSI1PK = MEDIC#123 to query all patients for a medic.
    res.status(501).json({ error: 'Not implemented (Requires GSI on Patient Table)' });
};
