const { BadRequestError } = require('../../../shared/errors/AppError');

/**
 * Patient entity helpers. The record itself is a flat DynamoDB object; these rules keep
 * the two input names and the chart composition identical in every use case.
 */
class Patient {
    static resolveName(data = {}) {
        return data.name || data.fullName;
    }

    static requireName(data = {}) {
        const name = Patient.resolveName(data);
        if (!name) {
            throw new BadRequestError('name is required');
        }
        return name;
    }

    /** The frontend and the external API may send `fullName`; storage keeps `name`. */
    static normalizePayload(data = {}) {
        const { fullName, ...rest } = data;

        if (fullName && !rest.name) {
            rest.name = fullName;
        }

        return rest;
    }
}

/**
 * The patient chart is one aggregate on the outside and three records on the inside:
 * metadata, completed history and treatment plan. This class assembles them.
 */
class PatientChart {
    constructor({ metadata = null, historyItems = [], planItems = [] } = {}) {
        this.metadata = metadata;
        this.historyItems = historyItems;
        this.planItems = planItems;
    }

    static fromRecords(records = []) {
        const find = (sk) => records.find((record) => record.SK === sk);

        return new PatientChart({
            metadata: find('METADATA#') || null,
            historyItems: find('HISTORY#')?.items || [],
            planItems: find('PLAN#')?.items || [],
        });
    }

    get exists() {
        return Boolean(this.metadata);
    }

    toFullRecord() {
        return {
            ...this.metadata,
            treatmentPlan: { items: this.planItems },
            history: { completedItems: this.historyItems },
        };
    }
}

module.exports = { Patient, PatientChart };
