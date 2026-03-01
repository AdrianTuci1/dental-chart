import { produce } from 'immer';

// Mock Models to trace the bug
class ToothModel {
    static initializeData(tooth, toothNumber) {
        if (!tooth.toothNumber) tooth.toothNumber = toothNumber;
        if (!tooth.periodontal) tooth.periodontal = {
            sites: {
                distoBuccal: {}, buccal: {}, mesioBuccal: {},
                distoLingual: {}, lingual: {}, mesioLingual: {}
            }
        };
    }
    static update(tooth, payload) {
        if (payload.periodontal) {
            Object.assign(tooth.periodontal, payload.periodontal);
        }
    }
}

class ChartModel {
    static updateTooth(chart, toothNumber, payload) {
        if (!chart.teeth) chart.teeth = {};
        if (!chart.teeth[toothNumber]) {
            chart.teeth[toothNumber] = {};
            ToothModel.initializeData(chart.teeth[toothNumber], toothNumber);
        }
        ToothModel.update(chart.teeth[toothNumber], payload);
    }
}

class PeriodontalFacade {
    constructor(toothNumber, teeth, updateFn) {
        this.toothNumber = toothNumber;
        this.tooth = teeth[toothNumber];
        this.updateToothFunction = updateFn;
    }
    getSiteData(siteKey) {
        if (this.tooth && this.tooth.periodontal && this.tooth.periodontal.sites && this.tooth.periodontal.sites[siteKey]) {
            return this.tooth.periodontal.sites[siteKey];
        }
        return { probingDepth: 0 };
    }
    updateSiteData(siteKey, updates) {
        const newSites = { ...(this.tooth.periodontal?.sites || {}) };
        const currentData = this.getSiteData(siteKey);
        newSites[siteKey] = { ...currentData, ...updates };

        this.updateToothFunction(this.toothNumber, {
            periodontal: {
                ...(this.tooth.periodontal || {}),
                sites: newSites
            }
        });
    }
}

let state = {
    teeth: {
        "18": {
            toothNumber: 18,
            periodontal: {
                sites: {
                    distoLingual: { probingDepth: 0 },
                    lingual: { probingDepth: 0 }
                }
            }
        }
    }
};

const updateTooth = (toothNumber, payload) => {
    state = produce(state, draft => {
        ChartModel.updateTooth(draft, toothNumber, payload);
    });
};

console.log("INITIAL:", JSON.stringify(state.teeth["18"].periodontal, null, 2));

const facade = new PeriodontalFacade("18", state.teeth, updateTooth);
facade.updateSiteData("distoLingual", { probingDepth: 5 });

console.log("AFTER:", JSON.stringify(state.teeth["18"].periodontal, null, 2));

const facade2 = new PeriodontalFacade("18", state.teeth, updateTooth);
facade2.updateSiteData("lingual", { probingDepth: 3 });

console.log("AFTER 2:", JSON.stringify(state.teeth["18"].periodontal, null, 2));
