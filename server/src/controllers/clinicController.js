const db = require('../models/db');

exports.createClinic = async (req, res) => {
    const { name, address, phone, email } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO clinics (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, address, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClinic = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM clinics WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clinic not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
