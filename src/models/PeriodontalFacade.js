export class PeriodontalFacade {
    constructor(toothNumber, teeth, updateToothFunction) {
        this.toothNumber = toothNumber;
        this.tooth = teeth[toothNumber];
        this.updateToothFunction = updateToothFunction;
    }

    _getInternalKey(siteKey) {
        if (!this.toothNumber) return siteKey;
        const num = parseInt(this.toothNumber, 10);
        const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);

        if (isUpper) {
            if (siteKey === 'distoLingual') return 'distoPalatal';
            if (siteKey === 'lingual') return 'palatal';
            if (siteKey === 'mesioLingual') return 'mesioPalatal';
        }
        return siteKey;
    }

    getSiteData(siteKey) {
        const internalKey = this._getInternalKey(siteKey);
        const defaultData = { probingDepth: 0, gingivalMargin: 0, bleeding: false, plaque: false, pus: false, tartar: false };

        if (this.tooth && this.tooth.periodontal && this.tooth.periodontal.sites && this.tooth.periodontal.sites[internalKey]) {
            return { ...defaultData, ...this.tooth.periodontal.sites[internalKey] };
        }
        return defaultData;
    }

    updateSiteData(siteKey, updates) {
        if (!this.tooth) return;

        const internalKey = this._getInternalKey(siteKey);
        const newSites = { ...(this.tooth.periodontal?.sites || {}) };
        const currentData = this.getSiteData(siteKey);

        // Apply new updates
        const nextData = { ...currentData, ...updates };

        // Enforce constraint: Probing Depth (PD) >= Gingival Margin (GM)
        // Note: GM in the UI/data model is often represented as positive absolute values by the UI, but let's stick to the constraint logically.
        // Assuming both PD and GM are stored as positive values or handled based on their absolute values.
        let pd = nextData.probingDepth || 0;
        let gm = nextData.gingivalMargin !== undefined ? Math.abs(nextData.gingivalMargin) : 0;

        if (updates.gingivalMargin !== undefined && pd < gm) {
            // GM changed and is now greater than PD -> Increase PD
            nextData.probingDepth = gm;
        } else if (updates.probingDepth !== undefined && pd < gm) {
            // PD changed and is now less than GM -> Decrease GM
            // Maintain the sign of GM if it was negative (recession)
            nextData.gingivalMargin = nextData.gingivalMargin < 0 ? -pd : pd;
        }

        newSites[internalKey] = nextData;

        this.updateToothFunction(this.toothNumber, {
            periodontal: {
                ...(this.tooth.periodontal || {}),
                sites: newSites
            }
        });
    }

    updateMultipleSitesData(sitesMap) {
        if (!this.tooth) return;

        const newSites = { ...(this.tooth.periodontal?.sites || {}) };

        Object.keys(sitesMap).forEach(siteKey => {
            const internalKey = this._getInternalKey(siteKey);
            const currentData = this.getSiteData(siteKey);
            newSites[internalKey] = { ...currentData, ...sitesMap[siteKey] };
        });

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
