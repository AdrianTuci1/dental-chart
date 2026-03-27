const ClinicRepository = require('../models/repositories/ClinicRepository');
const { v4: uuidv4 } = require('uuid');

class ClinicService {
    constructor() {
        this.clinicRepository = new ClinicRepository();
    }

    async createClinic(clinicData) {
        const id = clinicData.id || uuidv4();
        const dataToSave = { ...clinicData, id };
        return await this.clinicRepository.createClinic(dataToSave);
    }

    async getClinic(id) {
        return await this.clinicRepository.getClinicById(id);
    }
}

module.exports = ClinicService;
