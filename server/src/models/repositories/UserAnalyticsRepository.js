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
        const timestamp = Date.now();
        const pk = `TELEMETRY#${userId}`;
        const sk = 'ANALYTICS#'; // Standardized SK format for the main table

        let updateExpression = 'SET lastActive = :lastActive, userId = :userId';
        const expressionAttributeValues = {
            ':lastActive': timestamp,
            ':userId': userId,
        };
        const expressionAttributeNames = {};

        // 1. Increment login count if requested
        if (updates.incrementLogin) {
            updateExpression += ', loginCount = if_not_exists(loginCount, :zero) + :one';
            expressionAttributeValues[':zero'] = 0;
            expressionAttributeValues[':one'] = 1;
        }

        // 2. Set boolean flags (onboarding, feature usage)
        if (updates.flags) {
            Object.entries(updates.flags).forEach(([key, value]) => {
                const attrName = `#${key}`;
                const valName = `:${key}`;
                updateExpression += `, ${attrName} = :${key}`;
                expressionAttributeNames[attrName] = key;
                expressionAttributeValues[valName] = value;
            });
        }

        // 3. Add to visited menus (using a Set in DynamoDB to ensure uniqueness)
        if (updates.menuVisited) {
            // If the expression already has a SET, we need to handle ADD separately 
            // or use a separate command. In DynamoDB, SET and ADD can be in the same UpdateExpression.
            updateExpression += ' ADD visitedMenus :menu';
            expressionAttributeValues[':menu'] = new Set([updates.menuVisited]);
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ReturnValues: 'ALL_NEW',
        });

        const response = await this.send(command);
        return response.Attributes;
    }

    async getUserProfile(userId) {
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
