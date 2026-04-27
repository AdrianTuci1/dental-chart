const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class UserAnalyticsRepository extends BaseRepository {
    constructor() {
        super();
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'DentalChart';
    }

    /**
     * Updates user analytics profile in a single record within the main table.
     */
    async updateUserProfile(userId, updates = {}) {
        if (!userId) {
            console.error('[UserAnalyticsRepository] Cannot update profile: userId is missing');
            return null;
        }

        const timestamp = Date.now();
        const pk = `TELEMETRY#${userId}`;
        const sk = 'ANALYTICS#';

        const expressionAttributeNames = {
            '#lastActive': 'lastActive',
            '#userId': 'userId'
        };
        
        const expressionAttributeValues = {
            ':lastActive': timestamp,
            ':userId': userId,
        };

        let setParts = ['#lastActive = :lastActive', '#userId = :userId'];
        let addParts = [];

        // 1. Increment login count
        if (updates.incrementLogin) {
            expressionAttributeNames['#loginCount'] = 'loginCount';
            expressionAttributeValues[':zero'] = 0;
            expressionAttributeValues[':one'] = 1;
            setParts.push('#loginCount = if_not_exists(#loginCount, :zero) + :one');
        }

        // 2. Set boolean flags
        if (updates.flags) {
            Object.entries(updates.flags).forEach(([key, value]) => {
                const attrName = `#${key}`;
                const valName = `:${key}`;
                expressionAttributeNames[attrName] = key;
                expressionAttributeValues[valName] = value;
                setParts.push(`${attrName} = ${valName}`);
            });
        }

        // 3. Add to visited menus (using Set)
        if (updates.menuVisited) {
            expressionAttributeNames['#visitedMenus'] = 'visitedMenus';
            expressionAttributeValues[':menuSet'] = new Set([updates.menuVisited]);
            addParts.push('#visitedMenus :menuSet');
        }

        let updateExpression = `SET ${setParts.join(', ')}`;
        if (addParts.length > 0) {
            updateExpression += ` ADD ${addParts.join(', ')}`;
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: 'ALL_NEW',
        });

        try {
            const response = await this.send(command);
            return response.Attributes;
        } catch (error) {
            console.error('[UserAnalyticsRepository] Update failed:', error.message);
            throw error;
        }
    }

    async getUserProfile(userId) {
        if (!userId) return null;
        
        const command = new GetCommand({
            TableName: this.tableName,
            Key: { 
                PK: `TELEMETRY#${userId}`, 
                SK: 'ANALYTICS#' 
            },
        });
        const response = await this.send(command);
        return response.Item;
    }
}

module.exports = UserAnalyticsRepository;
