const db = require('../models/db');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// NOTE: In a real app, use Multer to handle uploads to disk/S3. 
// For this prototype, we'll assume the file path is passed or mocked, 
// OR we implement a simple multer middleware in the route.
// We will rely on route implementation for the actual file handling.

exports.uploadScan = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { patient_id } = req.body;
    const fileUrl = req.file.path; // Local path for now

    try {
        // 1. Create Scan Record
        const scanRes = await db.query(
            'INSERT INTO scans (patient_id, file_url, status) VALUES ($1, $2, $3) RETURNING *',
            [patient_id, fileUrl, 'PENDING']
        );
        const scan = scanRes.rows[0];

        // 2. Trigger ML Service (Async)
        // We don't await this to keep response fast, OR we await if we want immediate results.
        // Let's await for this prototype to show the flow.

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(fileUrl));

            const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            const mlResponse = await axios.post(`${mlServiceUrl}/scan`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            const findings = mlResponse.data.findings;

            // 3. Update Scan Record
            await db.query(
                'UPDATE scans SET status = $1, results = $2 WHERE id = $3',
                ['COMPLETED', JSON.stringify(findings), scan.id]
            );

            // 4. Update Chart (Complex Logic - For now we just log/notify)
            // Ideally, loop through findings and update 'teeth' table.
            // Simplified update logic:
            if (findings && findings.length > 0) {
                const chartRes = await db.query('SELECT id FROM charts WHERE patient_id = $1', [patient_id]);
                if (chartRes.rows.length > 0) {
                    const chartId = chartRes.rows[0].id;
                    for (const item of findings) {
                        const { isoNumber, ...data } = item;
                        // Upsert logic for tooth
                        await db.query(`
                            INSERT INTO teeth (chart_id, iso_number, pathology_data, periodontal_data, restoration_data)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (chart_id, iso_number) 
                            DO UPDATE SET 
                                pathology_data = COALESCE(teeth.pathology_data, '{}'::jsonb) || $3,
                                periodontal_data = COALESCE(teeth.periodontal_data, '{}'::jsonb) || $4,
                                restoration_data = COALESCE(teeth.restoration_data, '{}'::jsonb) || $5
                         `, [
                            chartId,
                            isoNumber,
                            data.pathology || {},
                            data.periodontal || {},
                            data.restoration || {}
                        ]);
                    }
                }
            }

            res.json({ status: 'success', scanId: scan.id, findings });

        } catch (mlErr) {
            console.error('ML Service Error:', mlErr.message);
            await db.query('UPDATE scans SET status = $1 WHERE id = $2', ['FAILED', scan.id]);
            res.status(500).json({ error: 'ML Processing failed' });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
