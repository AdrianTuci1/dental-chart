const HistoryRepository = require('../models/repositories/HistoryRepository');
const { v4: uuidv4 } = require('uuid');

class HistoryService {
    constructor() {
        this.historyRepository = new HistoryRepository();
    }

    async updateHistory(patientId, items) {
        if (!patientId || !Array.isArray(items)) {
            throw new Error('Patient ID and items array are required');
        }

        return await this.historyRepository.updateHistory(patientId, items);
    }

    async addHistoryRecord(patientId, historyData) {
        // Appends a single record to the consolidated array
        const currentItems = await this.getPatientHistory(patientId);
        const newRecord = {
            id: historyData.id || uuidv4(),
            ...historyData,
            date: historyData.date || new Date().toISOString()
        };
        currentItems.push(newRecord);
        return await this.updateHistory(patientId, currentItems);
    }

    async getPatientHistory(patientId) {
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        return await this.historyRepository.getPatientHistory(patientId);
    }
}

module.exports = HistoryService;
