const db = require('../models/db');

exports.createPatient = async (req, res) => {
    const { medic_id, full_name, dob, gender, address, phone, email } = req.body;
    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Create Patient
            const patientRes = await client.query(
                'INSERT INTO patients (medic_id, full_name, dob, gender, address, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [medic_id, full_name, dob, gender, address, phone, email]
            );
            const patient = patientRes.rows[0];

            // Initialize Chart for Patient
            await client.query('INSERT INTO charts (patient_id) VALUES ($1)', [patient.id]);

            await client.query('COMMIT');
            res.status(201).json(patient);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPatient = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPatientChart = async (req, res) => {
    const { id } = req.params;
    try {
        // Get Chart ID
        const chartRes = await db.query('SELECT * FROM charts WHERE patient_id = $1', [id]);
        if (chartRes.rows.length === 0) {
            return res.status(404).json({ error: 'Chart not found' });
        }
        const chart = chartRes.rows[0];

        // Get Teeth
        const teethRes = await db.query('SELECT * FROM teeth WHERE chart_id = $1', [chart.id]);

        // Structure response
        const response = {
            chartId: chart.id,
            patientId: id,
            teeth: teethRes.rows // Array of tooth objects
        };

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
