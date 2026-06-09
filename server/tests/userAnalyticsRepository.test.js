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
});
