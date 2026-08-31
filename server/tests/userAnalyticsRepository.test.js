const UserAnalyticsRepository = require('../src/models/repositories/UserAnalyticsRepository');

describe('UserAnalyticsRepository', () => {
    it('builds a DynamoDB update without nested data path overlaps', async () => {
        const repository = new UserAnalyticsRepository();
        repository.send = jest.fn().mockResolvedValue({ Attributes: {} });

        await repository.updateUserProfile('medic-1', {
            incrementLogin: true,
            incrementTime: 2,
            flags: { onboarding_registered: true },
            metadata: { gtagClientId: '123.456' },
            menuVisited: 'Patients',
        });

        expect(repository.send).toHaveBeenCalledTimes(1);

        const command = repository.send.mock.calls[0][0];
        const { UpdateExpression, ExpressionAttributeNames } = command.input;

        expect(UpdateExpression).toContain('#loginCount = if_not_exists(#loginCount, :zero) + :one');
        expect(UpdateExpression).toContain('#firstActive = if_not_exists(#firstActive, :lastActive)');
        expect(UpdateExpression).toContain('#totalTimeSpent = if_not_exists(#totalTimeSpent, :zeroTime) + :timeIncrement');
        expect(UpdateExpression).toContain('ADD #visitedMenus :menuSet');
        expect(UpdateExpression).not.toContain('#data');
        expect(ExpressionAttributeNames['#meta_gtagClientId']).toBe('gtagClientId');
        expect(ExpressionAttributeNames['#flag_onboarding_registered']).toBe('onboarding_registered');
    });

    it('increments named counters without clobbering other attributes', async () => {
        const repository = new UserAnalyticsRepository();
        repository.send = jest.fn().mockResolvedValue({ Attributes: {} });

        await repository.updateUserProfile('medic-1', {
            increments: { emailFailureCount: 1 },
            metadata: { lastEmailFailureReason: 'not_configured' },
        });

        const { UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames } = repository.send.mock.calls[0][0].input;

        expect(UpdateExpression).toContain('#inc_emailFailureCount = if_not_exists(#inc_emailFailureCount, :inc_emailFailureCount_zero) + :inc_emailFailureCount_delta');
        expect(ExpressionAttributeNames['#inc_emailFailureCount']).toBe('emailFailureCount');
        expect(ExpressionAttributeValues[':inc_emailFailureCount_delta']).toBe(1);
        expect(ExpressionAttributeValues[':inc_emailFailureCount_zero']).toBe(0);
    });
});
