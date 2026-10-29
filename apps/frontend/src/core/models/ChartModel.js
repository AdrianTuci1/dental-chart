import { ToothModel } from './ToothModel';

const cloneTeeth = (baseTeeth) => {
    if (!baseTeeth) return {};

    try {
        return JSON.parse(JSON.stringify(baseTeeth));
    } catch (error) {
        console.error('[ChartModel] Failed to clone baseTeeth, falling back to empty', error);
        return {};
    }
};

const upsertArrayItem = (items = [], nextItem = {}) => {
    const normalizedItems = Array.isArray(items) ? items : [];

    if (!nextItem?.id) {
        return [...normalizedItems, nextItem];
    }

    const existingIndex = normalizedItems.findIndex((item) => item?.id === nextItem.id);

    if (existingIndex === -1) {
        return [...normalizedItems, nextItem];
    }

    return normalizedItems.map((item, index) => (
        index === existingIndex ? { ...item, ...nextItem } : item
    ));
};

const mergeRecord = (currentValue, nextValue) => {
    if (!nextValue) return currentValue;

    if (!currentValue || typeof currentValue !== 'object') {
        return { ...nextValue };
    }

    return {
        ...currentValue,
        ...nextValue,
    };
};

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
        const teeth = cloneTeeth(baseTeeth);

        // Handle both array and object formats (aligned with PatientModels.js)
        const completedList = Array.isArray(history) ? history : (history?.completedItems || []);
        const plannedList = Array.isArray(treatmentPlan) ? treatmentPlan : (treatmentPlan?.items || []);

        const allItems = [...completedList, ...plannedList];

        // Pre-initialize all 52 teeth so that healthy teeth also exist in state
        const ALL_VALID_TEETH = [
            18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
            48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
            55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
            85, 84, 83, 82, 81, 71, 72, 73, 74, 75
        ];

        ALL_VALID_TEETH.forEach(num => {
            if (!teeth[num]) teeth[num] = ToothModel.create(num);
            ToothModel.initializeData(teeth[num], num);
        });

        allItems.forEach(item => {
            const { isoNumber, tooth: toothNumber, type, subtype, ...data } = item;
            const targetToothNumber = isoNumber || toothNumber;
            if (!targetToothNumber) return;

            const tooth = teeth[targetToothNumber];
            if (!tooth) return; // Should not happen with pre-initialization

            switch (type) {
                case 'decay':
                    tooth.pathology.decay = upsertArrayItem(tooth.pathology.decay, {
                        ...data,
                        id: item.id,
                    });
                    break;
                case 'restoration':
                    if (subtype === 'filling') {
                        tooth.restoration.fillings = upsertArrayItem(tooth.restoration.fillings, {
                            ...data,
                            subtype,
                            id: item.id,
                        });
                    } else if (subtype === 'crown') {
                        tooth.restoration.crowns = upsertArrayItem(tooth.restoration.crowns, {
                            ...data,
                            subtype,
                            id: item.id,
                            type: data.type || data.crownType || 'Single Crown',
                        });
                    } else if (subtype === 'veneer') {
                        tooth.restoration.veneers = upsertArrayItem(tooth.restoration.veneers, {
                            ...data,
                            subtype,
                            id: item.id,
                        });
                    } else if (subtype) {
                        tooth.restoration.advancedRestorations = upsertArrayItem(
                            tooth.restoration.advancedRestorations,
                            {
                                ...data,
                                id: item.id,
                                type: data.type || subtype,
                            }
                        );
                    }
                    break;
                case 'pathology':
                    if (subtype === 'fracture') {
                        tooth.pathology.fracture = mergeRecord(tooth.pathology.fracture, {
                            ...data,
                            id: item.id,
                        });
                    } else if (subtype === 'tooth-wear') {
                        tooth.pathology.toothWear = mergeRecord(tooth.pathology.toothWear, {
                            ...data,
                            id: item.id,
                            type: data.type || (data.wearType ? `${data.wearType.charAt(0).toUpperCase()}${data.wearType.slice(1)}` : undefined),
                            surface: data.surface ? `${data.surface.charAt(0).toUpperCase()}${data.surface.slice(1)}` : undefined,
                        });
                    } else if (subtype === 'discoloration') {
                        tooth.pathology.discoloration = mergeRecord(tooth.pathology.discoloration, {
                            ...data,
                            id: item.id,
                            color: data.color ? `${data.color.charAt(0).toUpperCase()}${data.color.slice(1)}` : data.color,
                        });
                    } else if (subtype === 'apical') {
                        tooth.pathology.apicalPathology = mergeRecord(tooth.pathology.apicalPathology, {
                            ...data,
                            id: item.id,
                        });
                    } else if (subtype === 'development-disorder') {
                        tooth.pathology.developmentDisorder = mergeRecord(tooth.pathology.developmentDisorder, {
                            ...data,
                            id: item.id,
                        });
                    }
                    break;
                case 'endodontic': {
                    const endoData = {
                        ...tooth.endodontic,
                        ...data,
                        id: item.id,
                        tests: {
                            ...(tooth.endodontic.tests || {}),
                            ...(data.tests || {}),
                        },
                    };

                    // 1. Handle structured tests (from UI)
                    if (data.tests) {
                        if (data.tests.cold) endoData.cold = true;
                        if (data.tests.heat) endoData.heat = true;
                        if (data.tests.percussion) endoData.percussion = true;
                        if (data.tests.palpation) endoData.palpation = true;
                        if (data.tests.electricity !== undefined && data.tests.electricity !== null && data.tests.electricity !== '') {
                            endoData.electricity = true;
                        }
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
                }
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
                    if (data.plaqueSites) {
                        data.plaqueSites.forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].plaque = true;
                        });
                    }
                    if (data.pusSites) {
                        data.pusSites.forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].pus = true;
                        });
                    }
                    if (data.tartarSites) {
                        data.tartarSites.forEach(siteKey => {
                            if (!tooth.periodontal.sites[siteKey]) tooth.periodontal.sites[siteKey] = {};
                            tooth.periodontal.sites[siteKey].tartar = true;
                        });
                    }
                    if (data.mobility !== undefined) {
                        tooth.periodontal.mobility = data.mobility;
                    }
                    break;
                case 'missing':
                    tooth.isMissing = true;
                    tooth.missingDate = item.date || tooth.missingDate;
                    break;
                case 'extraction':
                    tooth.toBeExtracted = true;
                    break;
            }
        });

        return teeth;
    }
}
