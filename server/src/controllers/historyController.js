const HistoryService = require('../services/HistoryService');

const historyService = new HistoryService();

exports.addHistoryRecord = async (req, res) => {
    try {
        const { patientId } = req.params;
        const historyData = req.body;

        const newRecord = await historyService.addHistoryRecord(patientId, historyData);
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const history = await historyService.getPatientHistory(patientId);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
