const MedicService = require('../services/MedicService');
const medicService = new MedicService();

/**
 * Auth Controller
 * Handles registration (medic account creation) and login.
 * For now uses simple token placeholder — real JWT integration later.
 */

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }

        // Create the medic account
        const newMedic = await medicService.createMedic({ name, email });

        // In a real app, hash password and store it, then generate JWT
        const token = `placeholder-token-${newMedic.id}`;

        res.status(201).json({
            id: newMedic.id,
            name: newMedic.name,
            email: newMedic.email,
            token,
        });
    } catch (err) {
        console.error('[AuthController Register Error]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        // Look up medic by email
        const medic = await medicService.getMedicByEmail(email);
        if (!medic) {
            return res.status(401).json({ error: 'Invalid credentials: account not found' });
        }

        // In a real app, verify password hash here
        const token = `placeholder-token-${medic.id}`;

        res.status(200).json({
            id: medic.id,
            name: medic.name,
            email: medic.email,
            token,
        });
    } catch (err) {
        console.error('[AuthController Login Error]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        let medicId = token.startsWith('placeholder-token-') 
            ? token.replace('placeholder-token-', '') 
            : null;

        if (!medicId) {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const medic = await medicService.getMedic(medicId);
        if (!medic) {
            return res.status(401).json({ error: 'Session invalid: Medic not found. Please log in again.' });
        }

        res.json(medic);
    } catch (err) {
        console.error('[AuthController getMe Error]', err);
        res.status(500).json({ error: err.message });
    }
};
