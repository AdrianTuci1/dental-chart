import { ToothModel } from './ToothModel';

/**
 * Domain-Driven Design Model for Chart.
 * Encapsulates all business logic related to a patient's mouth/chart.
 */
export class ChartModel {
    /**
     * Ensures the chart structure is valid before interacting with it.
     * @param {Object} chart - The drafted chart object
     */
    static initialize(chart) {
        if (!chart.teeth) {
            chart.teeth = {};
        }
    }

    /**
     * Update a specific tooth inside a chart.
     * Creates the tooth implicitly if it doesn't exist yet.
     * 
     * @param {Object} chart - The drafted chart object
     * @param {number|string} toothNumber - The ID of the tooth
     * @param {Object} payload - The data to update
     */
    static updateTooth(chart, toothNumber, payload) {
        this.initialize(chart);

        if (!chart.teeth[toothNumber]) {
            chart.teeth[toothNumber] = {};
            ToothModel.initializeData(chart.teeth[toothNumber], toothNumber);
        }

        ToothModel.update(chart.teeth[toothNumber], payload);
    }

    /**
     * Batch update multiple teeth at once.
     * 
     * @param {Object} chart - The drafted chart object
     * @param {Object} updatesMap - Dictionary of { [toothNumber]: payload }
     */
    static updateTeeth(chart, updatesMap) {
        this.initialize(chart);

        Object.keys(updatesMap).forEach(toothNumber => {
            this.updateTooth(chart, toothNumber, updatesMap[toothNumber]);
        });
    }

    /**
     * Projects history and treatment plan items into a teeth map for visual rendering.
     * Use this when you have the patient data but no explicit visual chart state.
     * 
     * @param {Array} history - Completed interventions
     * @param {Array} treatmentPlan - Planned/Monitoring interventions
     * @param {Object} [baseTeeth] - Optional base teeth map to project onto (preserves static data)
     * @returns {Object} Teeth map with conditions
     */
    static projectTeethFromInterventions(history = [], treatmentPlan = [], baseTeeth = null) {
        let teeth = {};
        
        if (baseTeeth) {
            // Deep clone to avoid mutating the source of truth directly here
            try {
                teeth = JSON.parse(JSON.stringify(baseTeeth));
            } catch (e) {
                console.error("[ChartModel] Failed to clone baseTeeth, falling back to empty", e);
                teeth = {};
            }
        }

        // Handle both array and object formats (aligned with PatientModels.js)
        const completedList = Array.isArray(history) ? history : (history?.completedItems || []);
        const plannedList = Array.isArray(treatmentPlan) ? treatmentPlan : (treatmentPlan?.items || []);

        const allItems = [...completedList, ...plannedList];

        // Pre-initialize all 32 teeth so that healthy teeth also exist in state
        const ALL_VALID_TEETH = [
            18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
            48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
        ];

        ALL_VALID_TEETH.forEach(num => {
            if (!teeth[num]) teeth[num] = {};
            ToothModel.initializeData(teeth[num], num);
            
            // Clear dynamic intervention arrays to avoid duplicates when re-projecting
            // but preserve static properties (like endodontic tests, missing status etc)
            teeth[num].pathology.decay = [];
            teeth[num].restoration.fillings = [];
            teeth[num].restoration.crowns = [];
            teeth[num].restoration.veneers = [];
            teeth[num].restoration.advancedRestorations = [];
        });

        allItems.forEach(item => {
            const { isoNumber, tooth: toothNumber, type, subtype, ...data } = item;
            const targetToothNumber = isoNumber || toothNumber;
            if (!targetToothNumber) return;

            const tooth = teeth[targetToothNumber];
            if (!tooth) return; // Should not happen with pre-initialization

            switch (type) {
                case 'decay':
                    tooth.pathology.decay.push({ ...data, id: item.id });
                    break;
                case 'restoration':
                    if (subtype === 'filling') {
                        tooth.restoration.fillings.push({ ...data, id: item.id });
                    } else if (subtype === 'crown') {
                        tooth.restoration.crowns.push({ ...data, id: item.id });
                    }
                    break;
                case 'pathology':
                    if (subtype === 'fracture') {
                        if (data.crown) tooth.pathology.fracture.crown = data.crown;
                        if (data.root) tooth.pathology.fracture.root = data.root;
                    }
                    break;
                case 'endodontic':
                    const endoData = { ...tooth.endodontic, ...data, id: item.id };

                    // 1. Handle structured tests (from UI)
                    if (data.tests) {
                        if (data.tests.cold) endoData.cold = true;
                        if (data.tests.heat) endoData.heat = true;
                        if (data.tests.percussion) endoData.percussion = true;
                        if (data.tests.palpation) endoData.palpation = true;
                        if (data.tests.electricity) endoData.electricity = true;
                    }
                    // 2. Fallback: Parse procedure string (from mockData)
                    else if (typeof data.procedure === 'string') {
                        const proc = data.procedure.toLowerCase();
                        if (proc.includes('cold')) endoData.cold = true;
                        if (proc.includes('heat')) endoData.heat = true;
                        if (proc.includes('percussion')) endoData.percussion = true;
                        if (proc.includes('palpation')) endoData.palpation = true;
                        if (proc.includes('electricity')) endoData.electricity = true;
                    }

                    tooth.endodontic = endoData;
                    break;
                case 'periodontal':
                    if (data.probingDepth) {
                        Object.keys(data.probingDepth).forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].probingDepth = data.probingDepth[siteKey];
                        });
                    }
                    if (data.gingivalMargin) {
                        Object.keys(data.gingivalMargin).forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].gingivalMargin = data.gingivalMargin[siteKey];
                        });
                    }
                    if (data.bleedingSites) {
                        data.bleedingSites.forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].bleeding = true;
                        });
                    }
                    break;
                case 'missing':
                    tooth.isMissing = true;
                    break;
                case 'extraction':
                    tooth.toBeExtracted = true;
                    break;
            }
        });

        return teeth;
    }
}
