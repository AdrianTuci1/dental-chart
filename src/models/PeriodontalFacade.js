export class PeriodontalFacade {
    constructor(toothNumber, teeth, updateToothFunction) {
        this.toothNumber = toothNumber;
        this.tooth = teeth[toothNumber];
        this.updateToothFunction = updateToothFunction;
    }

    _getInternalKey(siteKey) {
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

    /**
     * Generates a history event object for the current state of this tooth's periodontal data.
     * Complies with the backend mockData.js format for event-sourced projection.
     */
    generateHistoryEvent() {
        if (!this.tooth || !this.tooth.periodontal || !this.tooth.periodontal.sites) return null;

        const pd = {};
        const gm = {};
        const bleeding = [];

        Object.keys(this.tooth.periodontal.sites).forEach(siteKey => {
            const siteData = this.tooth.periodontal.sites[siteKey];
            if (siteData.probingDepth !== undefined) pd[siteKey] = siteData.probingDepth;
            if (siteData.gingivalMargin !== undefined) gm[siteKey] = siteData.gingivalMargin;
            if (siteData.bleeding) bleeding.push(siteKey);
        });

        // Only generate an event if there's actual data
        if (Object.keys(pd).length === 0 && Object.keys(gm).length === 0 && bleeding.length === 0) {
            return null;
        }

        return {
            id: `perio-${this.toothNumber}-${Date.now()}`,
            tooth: this.toothNumber,
            isoNumber: this.toothNumber,
            type: 'periodontal',
            status: 'completed',
            date: new Date().toISOString().split('T')[0],
            probingDepth: pd,
            gingivalMargin: gm,
            bleedingSites: bleeding
        };
    }
}
