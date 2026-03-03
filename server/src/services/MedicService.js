const MedicRepository = require('../models/repositories/MedicRepository');
const { v4: uuidv4 } = require('uuid');

class MedicService {
    constructor() {
        this.medicRepository = new MedicRepository();
    }

    async createMedic(medicData) {
        if (!medicData.name || !medicData.email) {
            throw new Error('Name and email are required');
        }

        const newMedic = {
            id: medicData.id || uuidv4(), // Allow custom ID format like 'medic-1' per mockData
            ...medicData,
        };

        return await this.medicRepository.createMedic(newMedic);
    }

    async getMedic(id) {
        if (!id) {
            throw new Error('Medic ID is required');
        }
        return await this.medicRepository.getMedicById(id);
    }
}

module.exports = MedicService;
