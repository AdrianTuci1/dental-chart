const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class ClinicRepository extends BaseRepository {
    async createClinic(clinicData) {
        const item = {
            PK: `CLINIC#${clinicData.id}`,
            SK: `METADATA#`,
            ...clinicData,
            createdAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.send(command);
        return item;
    }

    async getClinicById(id) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `CLINIC#${id}`,
                SK: `METADATA#`
            }
        });

        const response = await this.send(command);
        return response.Item;
    }
}

module.exports = ClinicRepository;
