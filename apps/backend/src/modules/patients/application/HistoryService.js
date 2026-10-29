const { v4: uuidv4 } = require('uuid');

const HistoryRepository = require('../infrastructure/HistoryRepository');
const { BadRequestError } = require('../../../shared/errors/AppError');

/** Completed clinical history for one patient, stored as a single ordered array. */
class HistoryService {
    constructor({
        historyRepository = new HistoryRepository(),
        idGenerator = uuidv4,
    } = {}) {
        this.historyRepository = historyRepository;
        this.idGenerator = idGenerator;
    }

    async updateHistory(patientId, items) {
        if (!patientId || !Array.isArray(items)) {
            throw new BadRequestError('Patient ID and items array are required');
        }

        return this.historyRepository.updateHistory(patientId, items);
    }

    async addHistoryRecord(patientId, historyData) {
        const currentItems = await this.getPatientHistory(patientId);
        const newRecord = {
            id: historyData.id || this.idGenerator(),
            ...historyData,
            date: historyData.date || new Date().toISOString(),
        };
        currentItems.push(newRecord);
        return this.updateHistory(patientId, currentItems);
    }

    async getPatientHistory(patientId) {
        if (!patientId) {
            throw new BadRequestError('Patient ID is required');
        }

        return this.historyRepository.getPatientHistory(patientId);
    }
}

module.exports = HistoryService;
