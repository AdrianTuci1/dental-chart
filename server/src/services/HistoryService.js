const HistoryRepository = require('../models/repositories/HistoryRepository');
const { v4: uuidv4 } = require('uuid');

class HistoryService {
    constructor() {
        this.historyRepository = new HistoryRepository();
    }

    async addHistoryRecord(patientId, historyData) {
        if (!patientId || !historyData.procedure) {
            throw new Error('Patient ID and procedure details are required');
        }

        const newRecord = {
            id: uuidv4(),
            ...historyData,
        };

        // Here we could add logic to check if this was part of a treatment plan
        // and mark that plan as completed if necessary.

        return await this.historyRepository.addHistoryRecord(patientId, newRecord);
    }

    async getPatientHistory(patientId) {
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        return await this.historyRepository.getPatientHistory(patientId);
    }
}

module.exports = HistoryService;
