const { docClient } = require('../../config/dynamoConfig');

class BaseRepository {
    constructor() {
        this.docClient = docClient;
        this.tableName = process.env.DYNAMODB_TABLE_NAME || process.env.DYNAMODB_TABLE || 'DentalChart';
    }
}

module.exports = BaseRepository;
