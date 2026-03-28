/**
 * Domain-Driven Design Model for Tooth.
 * Encapsulates all business logic and rules related to a single tooth.
 * Methods are pure and manipulate state directly by receiving the draft object (via Immer).
 */
export class ToothModel {
    /**
     * Creates a brand new normalized tooth object.
     * @param {number|string} toothNumber
     * @returns {Object}
     */
    static create(toothNumber) {
        const tooth = {};
        this.initializeData(tooth, toothNumber);
        return tooth;
    }

    /**
     * Initializes an empty tooth structure if it doesn't exist.
     * @param {Object} tooth - The drafted tooth object
     * @param {number} toothNumber - The ISO tooth number
     */
    static initializeData(tooth, toothNumber) {
        if (!tooth.toothNumber) tooth.toothNumber = toothNumber;
        if (!tooth.isoNumber) tooth.isoNumber = toothNumber;
        if (tooth.isMissing === undefined) tooth.isMissing = false;
        if (tooth.toBeExtracted === undefined) tooth.toBeExtracted = false;
        if (tooth.developmentState === undefined) tooth.developmentState = 'adult tooth';
        if (tooth.missingDate === undefined) tooth.missingDate = null;

        // Ensure Pathology structure
        if (!tooth.pathology) tooth.pathology = {};
        if (!tooth.pathology.decay) tooth.pathology.decay = [];
        if (!tooth.pathology.fracture) tooth.pathology.fracture = { crown: null, root: null };

        // Ensure Restoration structure
        if (!tooth.restoration) tooth.restoration = {};
        if (!tooth.restoration.fillings) tooth.restoration.fillings = [];
        if (!tooth.restoration.crowns) tooth.restoration.crowns = [];
        if (!tooth.restoration.veneers) tooth.restoration.veneers = [];
        if (!tooth.restoration.advancedRestorations) tooth.restoration.advancedRestorations = [];

        // Ensure Periodontal structure
        if (!tooth.periodontal) tooth.periodontal = {};
        if (!tooth.periodontal.diagnosis) tooth.periodontal.diagnosis = [];
        if (!tooth.periodontal.sites) {
            tooth.periodontal.sites = {
                distoBuccal: {}, buccal: {}, mesioBuccal: {},
                distoLingual: {}, lingual: {}, mesioLingual: {}
            };
        }

        // Ensure Endodontic structure
        if (!tooth.endodontic) tooth.endodontic = {};
        if (tooth.endodontic.hasRootCanal === undefined) tooth.endodontic.hasRootCanal = false;
        if (!tooth.endodontic.tests) tooth.endodontic.tests = { cold: null, heat: null, percussion: null, electricity: 0 };

        if (!tooth.conditions) tooth.conditions = [];
    }

    /**
     * Updates specific data on a tooth, ensuring structural integrity.
     * @param {Object} tooth - The drafted tooth object
     * @param {Object} payload - The updates to apply
     */
    static update(tooth, payload) {
        if (payload.pathology) {
            tooth.pathology = { ...tooth.pathology, ...payload.pathology };
        }

        if (payload.restoration) {
            tooth.restoration = { ...tooth.restoration, ...payload.restoration };
        }

        if (payload.periodontal) {
            const previousSites = tooth.periodontal.sites;
            tooth.periodontal = { ...tooth.periodontal, ...payload.periodontal };

            if (payload.periodontal.sites) {
                tooth.periodontal.sites = {
                    ...previousSites,
                    ...payload.periodontal.sites,
                };
            }
        }

        if (payload.endodontic) {
            const previousTests = tooth.endodontic.tests;
            tooth.endodontic = { ...tooth.endodontic, ...payload.endodontic };

            if (payload.endodontic.tests) {
                tooth.endodontic.tests = {
                    ...previousTests,
                    ...payload.endodontic.tests,
                };
            }
        }

        if (payload.conditions) tooth.conditions = payload.conditions;

        ['toBeExtracted', 'isMissing', 'developmentState', 'missingDate'].forEach((key) => {
            if (payload[key] !== undefined) {
                tooth[key] = payload[key];
            }
        });
    }
}
