export class PeriodontalFacade {
    constructor(toothNumber, teeth, updateToothFunction) {
        this.toothNumber = toothNumber;
        this.tooth = teeth[toothNumber];
        this.updateToothFunction = updateToothFunction;
    }

    getSiteData(siteKey) {
        if (this.tooth && this.tooth.periodontal && this.tooth.periodontal.sites && this.tooth.periodontal.sites[siteKey]) {
            return this.tooth.periodontal.sites[siteKey];
        }
        return { probingDepth: 0, gingivalMargin: 0, bleeding: false, plaque: false, pus: false, tartar: false };
    }

    updateSiteData(siteKey, updates) {
        if (!this.tooth) return;

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

    updateMobility(cls) {
        if (!this.tooth) return;
        this.updateToothFunction(this.toothNumber, {
            periodontal: {
                ...(this.tooth.periodontal || {}),
                mobility: cls
            }
        });
    }

    getSiteLabels() {
        if (!this.toothNumber) return {};
        const num = parseInt(this.toothNumber, 10);
        const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);

        return {
            distoLingual: isUpper ? 'Disto Palatal' : 'Disto Lingual',
            lingual: isUpper ? 'Palatal' : 'Lingual',
            mesioLingual: isUpper ? 'Mesio Palatal' : 'Mesio Lingual',
            distoBuccal: 'Disto Buccal',
            buccal: 'Buccal',
            mesioBuccal: 'Mesio Buccal'
        };
    }
}
