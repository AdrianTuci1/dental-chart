const { newDb } = require('pg-mem');
const {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const { createPostgresDocumentClient } = require('../src/shared/infrastructure/postgresDocumentClient');
const MedicRepository = require('../src/modules/identity/infrastructure/MedicRepository');
const RefreshTokenRepository = require('../src/modules/identity/infrastructure/RefreshTokenRepository');
const UserAnalyticsRepository = require('../src/modules/analytics/infrastructure/UserAnalyticsRepository');

const buildClient = () => {
    const db = newDb();
    const { Pool } = db.adapters.createPg();
    const pool = new Pool();

    return { client: createPostgresDocumentClient({ pool }), pool };
};

describe('Postgres document client', () => {
    it('stores and reads an item with the same shape as the Dynamo adapter', async () => {
        const { client } = buildClient();

        await client.send(new PutCommand({
            Item: { PK: 'MEDIC#m-1', SK: 'METADATA#', id: 'm-1', email: 'doctor@clinic.test' },
        }));

        const response = await client.send(new GetCommand({ Key: { PK: 'MEDIC#m-1', SK: 'METADATA#' } }));

        expect(response.Item).toMatchObject({ id: 'm-1', email: 'doctor@clinic.test' });
    });

    it('filters scans and queries with the expressions the repositories send', async () => {
        const { client } = buildClient();

        await client.send(new PutCommand({
            Item: { PK: 'PATIENT#p-1', SK: 'METADATA#', id: 'p-1', medicId: 'm-1' },
        }));
        await client.send(new PutCommand({
            Item: { PK: 'PATIENT#p-2', SK: 'METADATA#', id: 'p-2', medicId: 'm-2' },
        }));

        const scanned = await client.send(new ScanCommand({
            FilterExpression: 'medicId = :medicId AND SK = :sk AND begins_with(PK, :prefix)',
            ExpressionAttributeValues: {
                ':medicId': 'm-1',
                ':sk': 'METADATA#',
                ':prefix': 'PATIENT#',
            },
        }));
        const queried = await client.send(new QueryCommand({
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
            ExpressionAttributeValues: { ':pk': 'PATIENT#p-2', ':prefix': 'METADATA#' },
        }));

        expect(scanned.Items.map((item) => item.id)).toEqual(['p-1']);
        expect(queried.Items.map((item) => item.id)).toEqual(['p-2']);
    });

    it('deletes an item', async () => {
        const { client } = buildClient();

        await client.send(new PutCommand({ Item: { PK: 'A', SK: 'B', id: '1' } }));
        await client.send(new DeleteCommand({ Key: { PK: 'A', SK: 'B' } }));

        const response = await client.send(new GetCommand({ Key: { PK: 'A', SK: 'B' } }));

        expect(response.Item).toBeUndefined();
    });

    it('runs the repositories against Postgres without changing their code', async () => {
        const { client } = buildClient();
        const medicRepository = new MedicRepository({ client, tableName: 'DentalChart' });

        await medicRepository.createMedic({
            id: 'm-1',
            name: 'Dr. Postgres',
            email: 'postgres@clinic.test',
        });

        await expect(medicRepository.getMedicById('m-1'))
            .resolves.toMatchObject({ id: 'm-1', email: 'postgres@clinic.test' });
        await expect(medicRepository.getMedicByEmail('postgres@clinic.test'))
            .resolves.toMatchObject({ id: 'm-1' });
    });

    it('keeps refresh tokens and analytics counters working', async () => {
        const { client } = buildClient();
        const refreshTokens = new RefreshTokenRepository({ client, tableName: 'DentalChart' });
        const analytics = new UserAnalyticsRepository({ client, tableName: 'DentalChart' });

        await refreshTokens.save({
            tokenHash: 'hash-1',
            medicId: 'm-1',
            familyId: 'family-1',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        });
        await expect(refreshTokens.findByHash('hash-1'))
            .resolves.toMatchObject({ medicId: 'm-1', familyId: 'family-1' });

        await analytics.updateUserProfile('m-1', {
            incrementLogin: true,
            incrementTime: 2,
            flags: { onboarding_registered: true },
            metadata: { gtagClientId: '123.456' },
            menuVisited: 'Patients',
        });

        await expect(analytics.getUserProfile('m-1')).resolves.toMatchObject({
            userId: 'm-1',
            loginCount: 1,
            totalTimeSpent: 2,
            onboarding_registered: true,
            gtagClientId: '123.456',
            visitedMenus: ['Patients'],
        });
    });
});
