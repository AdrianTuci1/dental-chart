const LICENSED_STATUSES = new Set(['active', 'trialing']);
const FREE_STATUSES = new Set(['canceled', 'incomplete_expired']);

const normalizeStatus = (status) => String(status || 'inactive').toLowerCase();

const isLicensedStatus = (status) => LICENSED_STATUSES.has(normalizeStatus(status));

const planForStatus = (status) => (FREE_STATUSES.has(normalizeStatus(status)) ? 'free' : 'pro');

const periodEndToIso = (subscription) => {
    const item = subscription?.items?.data?.[0];
    const timestamp = subscription?.current_period_end || item?.current_period_end;

    return Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : null;
};

/**
 * Maps a Stripe subscription onto the fields the account stores. The status is kept
 * even when the plan is not licensed, so the billing screen can explain why access
 * stopped (past_due, unpaid, canceled).
 */
const snapshotFromSubscription = (subscription = {}) => {
    const status = normalizeStatus(subscription.status);

    return {
        plan: planForStatus(status),
        status,
        currentPeriodEnd: periodEndToIso(subscription),
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    };
};

module.exports = {
    LICENSED_STATUSES,
    isLicensedStatus,
    planForStatus,
    snapshotFromSubscription,
};
