/**
 * Domain-Driven Design Model for Tooth.
 * Encapsulates all business logic and rules related to a single tooth.
 * Methods are pure and manipulate state directly by receiving the draft object (via Immer).
 */
export class ToothModel {
    /**
     * Initializes an empty tooth structure if it doesn't exist.
     * @param {Object} tooth - The drafted tooth object
     * @param {number} toothNumber - The ISO tooth number
     */
    static initializeData(tooth, toothNumber) {
        if (!tooth.toothNumber) tooth.toothNumber = toothNumber;

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
        if (payload.pathology) tooth.pathology = { ...tooth.pathology, ...payload.pathology };
        if (payload.restoration) tooth.restoration = { ...tooth.restoration, ...payload.restoration };
        if (payload.periodontal) tooth.periodontal = { ...tooth.periodontal, ...payload.periodontal };
        if (payload.endodontic) tooth.endodontic = { ...tooth.endodontic, ...payload.endodontic };
        if (payload.conditions) tooth.conditions = payload.conditions;

        // Handle root level props like toBeExtracted
        if (payload.toBeExtracted !== undefined) {
            tooth.toBeExtracted = payload.toBeExtracted;
        }
    }
}
