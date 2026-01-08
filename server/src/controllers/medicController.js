const db = require('../models/db');

exports.createMedic = async (req, res) => {
    const { clinic_id, full_name, specialization, email, phone } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO medics (clinic_id, full_name, specialization, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [clinic_id, full_name, specialization, email, phone]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMedic = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM medics WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Medic not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMedicPatients = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM patients WHERE medic_id = $1', [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
