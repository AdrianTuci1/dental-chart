const { docClient } = require('../../config/dynamoConfig');

const SEARCHABLE_FIELDS_BY_SK = {
    'METADATA#': ['id', 'medicId', 'name', 'email', 'clinicId', 'createdAt', 'updatedAt', 'phoneNumber'],
    'HISTORY#': ['updatedAt', 'items'],
    'PLAN#': ['updatedAt', 'items'],
    'CLINIC#': ['id', 'name', 'createdAt', 'updatedAt'],
    'MEDIC#': ['id', 'clinicId', 'email', 'name', 'createdAt', 'updatedAt'],
};

const getSearchableFields = (sk = '') => {
    for (const [prefix, fields] of Object.entries(SEARCHABLE_FIELDS_BY_SK)) {
        if (sk.startsWith(prefix)) return fields;
    }
    return [];
};

class BaseRepository {
    constructor() {
        this.docClient = docClient;
        this.tableName = process.env.DYNAMODB_TABLE_NAME || process.env.DYNAMODB_TABLE || 'DentalChart';
    }

    /**
     * Centralized send method that handles transparent transformations.
     */
    async send(command) {
        this._transformOutgoing(command);
        const response = await this.docClient.send(command);
        this._transformIncoming(response);
        return response;
    }

    _transformOutgoing(command) {
        const cmdName = command.constructor.name;
        
        // More robust check for PutCommand
        const isPut = cmdName === 'PutCommand' || (command.input && command.input.Item && !command.input.Key);
        
        if (!isPut) return;

        const originalItem = command.input.Item;
        if (!originalItem || !originalItem.SK) return;

        const searchableFields = getSearchableFields(originalItem.SK);
        const newItem = {};
        const data = {};

        Object.keys(originalItem).forEach(key => {
            if (searchableFields.includes(key) || key === 'PK' || key === 'SK' || key === 'id' || key === 'medicId') {
                newItem[key] = originalItem[key];
            } else {
                data[key] = originalItem[key];
            }
        });

        if (Object.keys(data).length > 0) {
            newItem.data = data;
            // Replace the item in the command with the transformed one
            command.input.Item = newItem;
        }
    }

    _transformIncoming(response) {
        if (!response) return response;

        if (response.Item) {
            response.Item = this._flatten(response.Item);
        }
        if (response.Items) {
            response.Items = response.Items.map(item => this._flatten(item));
        }
        return response;
    }

    _flatten(item) {
        if (!item || !item.data || typeof item.data !== 'object' || Array.isArray(item.data)) {
            return item;
        }

        const { data, ...rest } = item;
        return { ...rest, ...data };
    }
}

module.exports = BaseRepository;
