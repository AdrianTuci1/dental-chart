/**
 * Domain-Driven Design Model for Patient.
 * Encapsulates all business logic and rules related to patients.
 * Methods are pure and manipulate state directly by receiving the draft object (via Immer).
 */
export class PatientModel {

    /**
     * Mark a treatment plan item as completed.
     * Moves it from treatmentPlan.items to history.completedItems
     * and updates the corresponding tooth pathology/restoration if it matches.
     * 
     * @param {Object} patient - The patient drafted object (from Immer)
     * @param {string} itemId - The ID of the item to complete
     */
    static completeTreatment(patient, itemId) {
        if (!patient || !patient.treatmentPlan?.items) return;

        const itemIndex = patient.treatmentPlan.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToComplete = patient.treatmentPlan.items[itemIndex];
        const currentDate = new Date().toISOString().split('T')[0];

        // 1. Remove from treatment plan
        patient.treatmentPlan.items.splice(itemIndex, 1);

        // 2. Add to history
        if (!patient.history) patient.history = { completedItems: [] };
        if (!patient.history.completedItems) patient.history.completedItems = [];

        patient.history.completedItems.push({
            ...itemToComplete,
            date: currentDate,
            status: 'completed'
        });

        // 3. Update related tooth item if applicable
        this._updateToothChartStatus(patient, itemToComplete, itemId);
    }

    /**
     * Directly add an independent item to the history.
     * 
     * @param {Object} patient - The patient drafted object
     * @param {Object} item - The history item
     */
    static addToHistory(patient, item) {
        if (!patient) return;

        if (!patient.history) patient.history = { completedItems: [] };
        if (!patient.history.completedItems) patient.history.completedItems = [];

        patient.history.completedItems.push({
            ...item,
            id: item.id || Date.now().toString(),
            date: item.date || new Date().toISOString().split('T')[0],
            status: item.status || 'completed'
        });
    }

    /**
     * Internal business rule for updating chart status when an item is completed.
     * @private
     */
    static _updateToothChartStatus(patient, itemToComplete, itemId) {
        if (!patient.chart?.teeth || !itemToComplete.tooth) return;

        const tooth = patient.chart.teeth[itemToComplete.tooth];
        if (!tooth) return;

        const fullIsoDate = new Date().toISOString();

        const markDone = (itemsArray) => {
            if (!itemsArray) return;
            // Handle case where itemsArray is a single object rather than an array
            if (!Array.isArray(itemsArray)) {
                if (itemsArray.id === itemId) {
                    itemsArray.status = 'completed';
                    itemsArray.date = fullIsoDate;
                }
                return;
            }
            
            for (let obj of itemsArray) {
                if (obj.id === itemId) {
                    obj.status = 'completed';
                    obj.date = fullIsoDate;
                }
            }
        };

        if (tooth.restoration) {
            markDone(tooth.restoration.fillings);
            markDone(tooth.restoration.veneers);
            markDone(tooth.restoration.crowns);
            markDone(tooth.restoration.advancedRestorations);
        }

        if (tooth.pathology) {
            markDone(tooth.pathology.decay);
            // Handling individual object references
            const patKeys = ['fracture', 'toothWear', 'discoloration', 'apicalPathology', 'developmentDisorder'];
            for (const key of patKeys) {
                if (tooth.pathology[key] && tooth.pathology[key].id === itemId) {
                    tooth.pathology[key].status = 'completed';
                    tooth.pathology[key].date = fullIsoDate;
                }
            }
        }
    }
}
