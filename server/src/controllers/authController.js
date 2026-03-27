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
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        // In a real app, find user by email, verify password, generate JWT
        // For now, return a placeholder token
        const token = `placeholder-token-login`;

        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    // In a real app, decode JWT from Authorization header and return user info
    res.status(501).json({ error: 'Not implemented (requires JWT middleware)' });
};
