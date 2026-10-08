const crypto = require('crypto');
const { GetCommand, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

const TOKEN_SK = 'METADATA#';
const REVOCATION_SK = 'REVOKED#';

const TOKEN_PREFIX = 'REFRESHTOKEN#';

/**
 * Durable refresh-token store living in the same DynamoDB table as everything else.
 *
 * Rows are keyed by an HMAC of the token, so a table read never exposes a usable
 * session secret. Rotation marks the old row instead of deleting it, which is what
 * makes token reuse (a stolen or replayed token) detectable.
 */
class RefreshTokenRepository extends BaseRepository {
    constructor() {
        super();
        this.pepper = process.env.REFRESH_TOKEN_SECRET || 'dev-only-insecure-refresh-secret';
    }

    hash(token) {
        return crypto.createHmac('sha256', this.pepper).update(String(token)).digest('hex');
    }

    static tokenKey(tokenHash) {
        return { PK: `${TOKEN_PREFIX}${tokenHash}`, SK: TOKEN_SK };
    }

    static familyKey(familyId) {
        return { PK: `${TOKEN_PREFIX}FAMILY#${familyId}`, SK: REVOCATION_SK };
    }

    static toEpochSeconds(isoDate) {
        const seconds = Math.floor(new Date(isoDate).getTime() / 1000);
        return Number.isFinite(seconds) ? seconds : 0;
    }

    static newToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Persists one issued token. `familyId` groups every token produced by rotating
     * the same login, so a whole session can be revoked at once.
     */
    async save({ tokenHash, medicId, familyId, expiresAt, rotatedToHash = null, rotatedAt = null, createdAt = null }) {
        const now = new Date().toISOString();
        const item = {
            PK: `${TOKEN_PREFIX}${tokenHash}`,
            SK: TOKEN_SK,
            type: 'refresh-token',
            tokenHash,
            medicId,
            familyId,
            expiresAt,
            ttl: RefreshTokenRepository.toEpochSeconds(expiresAt),
            rotatedToHash,
            rotatedAt,
            createdAt: createdAt || now,
            updatedAt: now,
        };

        await this.docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));

        return item;
    }

    async findByHash(tokenHash) {
        const response = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: RefreshTokenRepository.tokenKey(tokenHash),
        }));

        return response.Item || null;
    }

    async markRotated(tokenHash, nextTokenHash) {
        const existing = await this.findByHash(tokenHash);
        if (!existing) {
            return null;
        }

        return this.save({
            ...existing,
            rotatedToHash: nextTokenHash,
            rotatedAt: new Date().toISOString(),
        });
    }

    async remove(tokenHash) {
        await this.docClient.send(new DeleteCommand({
            TableName: this.tableName,
            Key: RefreshTokenRepository.tokenKey(tokenHash),
        }));
    }

    /**
     * Revocation marker for a session family. It lives as long as the longest token in
     * the family, so replaying an old token after a revocation still fails.
     */
    async revokeFamily(familyId, expiresAt) {
        const now = new Date().toISOString();
        const item = {
            ...RefreshTokenRepository.familyKey(familyId),
            type: 'refresh-token-revocation',
            familyId,
            revokedAt: now,
            ttl: RefreshTokenRepository.toEpochSeconds(expiresAt),
        };

        await this.docClient.send(new PutCommand({ TableName: this.tableName, Item: item }));

        return item;
    }

    async findFamilyRevocation(familyId) {
        const response = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: RefreshTokenRepository.familyKey(familyId),
        }));

        return response.Item || null;
    }

    /**
     * Used when an account is deleted. A Scan is acceptable here because the operation
     * is rare and the alternative would be a dedicated index per revocation path.
     */
    async listByMedicId(medicId) {
        const response = await this.docClient.send(new ScanCommand({
            TableName: this.tableName,
            FilterExpression: '#type = :type AND medicId = :medicId',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': 'refresh-token', ':medicId': medicId },
        }));

        return response.Items || [];
    }
}

module.exports = RefreshTokenRepository;
