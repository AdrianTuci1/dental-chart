const { docClient } = require('../../config/dynamoConfig');

class BaseRepository {
    constructor() {
        this.docClient = docClient;
        this.tableName = process.env.DYNAMODB_TABLE || 'DChartTable';
    }
}

module.exports = BaseRepository;
