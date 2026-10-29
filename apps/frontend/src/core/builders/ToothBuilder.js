/**
 * Builder Pattern for Tooth creation and modifications.
 * Exposes a fluent interface for constructing a full tooth structure before assigning it.
 */
export class ToothBuilder {
    constructor(toothNumber, existingData = null) {
        this.toothNumber = toothNumber;
        this.tooth = existingData ? JSON.parse(JSON.stringify(existingData)) : {
            toothNumber: toothNumber,
            pathology: {},
            restoration: { fillings: [], crowns: [], veneers: [], advancedRestorations: [] },
            periodontal: { diagnosis: [], sites: {} },
            endodontic: { hasRootCanal: false, tests: {} },
            conditions: []
        };
    }

    addPathology(type, details) {
        this.tooth.pathology[type] = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            status: 'planned', // default status
            ...details
        };
        return this;
    }

    addRestoration(category, details) {
        if (!this.tooth.restoration[category]) {
            this.tooth.restoration[category] = [];
        }

        this.tooth.restoration[category].push({
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            status: 'completed', // restorations usually default to completed if not specified
            ...details
        });

        return this;
    }

    setExtraction(isPlanned) {
        this.tooth.toBeExtracted = isPlanned;
        return this;
    }

    build() {
        return this.tooth;
    }
}
