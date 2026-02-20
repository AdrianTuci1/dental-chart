import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import { PeriodontalFacade } from '../../models/PeriodontalFacade';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';
import './ToothPeriodontal.css';

const ToothPeriodontal = () => {
    const { site } = useParams();
    const navigate = useNavigate();
    const { tooth: outletContextTooth } = useOutletContext();
    const { teeth, updateTooth } = useChartStore();

    const facade = new PeriodontalFacade(outletContextTooth?.toothNumber, teeth, updateTooth);
    const tooth = facade.tooth;

    // Default to 'disto-lingual' if no site is selected
    const currentSiteKey = site || 'disto-lingual';

    // Map URL param to internal data keys
    const siteMap = {
        'disto-lingual': 'distoLingual',
        'lingual': 'lingual',
        'mesio-lingual': 'mesioLingual',
        'disto-buccal': 'distoBuccal',
        'buccal': 'buccal',
        'mesio-buccal': 'mesioBuccal'
    };

    const siteLabels = facade.getSiteLabels();
    const displayMap = {
        'disto-lingual': siteLabels.distoLingual,
        'lingual': siteLabels.lingual,
        'mesio-lingual': siteLabels.mesioLingual,
        'disto-buccal': siteLabels.distoBuccal,
        'buccal': siteLabels.buccal,
        'mesio-buccal': siteLabels.mesioBuccal
    };

    const internalKey = siteMap[currentSiteKey];
    const currentData = facade.getSiteData(internalKey);

    const handleSiteChange = (newSite) => {
        navigate(`../periodontal/${newSite}`);
    };

    const handleSiteDataUpdate = (updates) => {
        facade.updateSiteData(internalKey, updates);
    };

    // --- Wave Interaction Logic ---

    // Determine if we are on Buccal or Lingual side
    const isBuccal = ['disto-buccal', 'buccal', 'mesio-buccal'].includes(currentSiteKey);
    const viewSide = isBuccal ? 'buccal' : 'lingual';

    // Define the 3 sites for the current view side (Order matters for visual L->R or R->L?)
    // Assuming standard chart order: Mesial -> Central -> Distal
    // But visual might depend on quadrant/jaw. For now, let's map consistently:
    // [Mesial, Central, Distal]
    const relevantKeys = isBuccal
        ? ['mesioBuccal', 'buccal', 'distoBuccal']
        : ['mesioLingual', 'lingual', 'distoLingual'];

    // Get current values for the model
    const getWaveValues = () => {
        const pd = [];
        const gm = [];
        const OFFSETS = [1, 2, 1];
        relevantKeys.forEach((key, index) => {
            const data = facade.getSiteData(key);
            const offset = OFFSETS[index];
            pd.push((data.probingDepth || 0) + offset);
            gm.push(Math.abs(data.gingivalMargin || 0) + offset);
        });
        return { pd, gm };
    };

    // Create the model instance. Re-create only if the side changes (Buccal <-> Lingual).
    const waveModel = useMemo(() => {
        return new WaveInteractionModel(getWaveValues());
    }, [viewSide]); // Re-init primarily on side switch

    // Sync Store -> Model
    // When `tooth` data changes (e.g. from Keypad or external), update visual model
    useEffect(() => {
        const currentVals = getWaveValues();
        // We could implement a deep equality check here to avoid unnecessary updates if needed
        waveModel.setValues(currentVals);
    }, [tooth, viewSide]); // Dependencies: tooth data or side switch

    // Sync Model -> Store
    useEffect(() => {
        // Subscribe to model changes driven by interaction
        const unsubscribe = waveModel.subscribe(() => {
            if (!tooth?.periodontal?.sites) return;

            const snapshot = waveModel.getSnapshot();
            // snapshot has { pd: [3,4,5], gm: [1,2,3] } matching relevantKeys order

            const newSites = { ...tooth.periodontal.sites };
            let hasChanges = false;

            relevantKeys.forEach((key, index) => {
                const offset = [1, 2, 1][index];

                // Convert Visual to Stored
                let newPD = snapshot.pd[index] - offset;
                if (newPD < 0) newPD = 0;

                // For GM: Visual = Abs(Stored) + Offset
                let visualGMBase = snapshot.gm[index] - offset;
                if (visualGMBase < 0) visualGMBase = 0;

                const newGM = visualGMBase === 0 ? 0 : -visualGMBase;
                const current = newSites[key] || {};

                if (current.probingDepth !== newPD || current.gingivalMargin !== newGM) {
                    newSites[key] = {
                        ...current,
                        probingDepth: newPD,
                        gingivalMargin: newGM
                    };
                    hasChanges = true;
                    facade.updateSiteData(key, { probingDepth: newPD, gingivalMargin: newGM });
                }
            });
        });

        return unsubscribe;
    }, [waveModel, tooth]); // Re-sub if model or tooth identity changes (though tooth ID shouldn't change)


    const handleMobilityChange = (cls) => {
        facade.updateMobility(cls);
    };

    const renderKeypad = (type, range, special = []) => {
        return (
            <div className="number-grid">
                {range.map(num => (
                    <button
                        key={num}
                        onClick={() => handleSiteDataUpdate({ [type]: num })}
                        className={`num-btn ${currentData[type] === num ? 'active' : 'default'}`}
                    >
                        {num}
                    </button>
                ))}
                {special.map(val => (
                    <button
                        key={val}
                        onClick={() => handleSiteDataUpdate({ [type]: val })}
                        className={`num-btn ${currentData[type] === val ? 'active' : 'default'}`}
                    >
                        {val}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="periodontal-container">
            {/* Header */}
            <div className="perio-header">
                <h2 className="perio-title">Periodontal - {isBuccal ? 'Buccal' : 'Lingual'} View</h2>
                <div className="header-controls">
                    <Volume2 className="control-icon" size={20} />
                    <X className="control-icon" size={20} onClick={() => navigate('../')} />
                </div>
            </div>

            <div className="perio-content">


                {/* Top Row: Site Selectors */}
                <div className="site-selector-grid">
                    {Object.keys(siteMap).map((key) => {
                        const data = facade.getSiteData(siteMap[key]);
                        const isSelected = currentSiteKey === key;
                        return (
                            <div
                                key={key}
                                onClick={() => handleSiteChange(key)}
                                className={`site-card ${isSelected ? 'selected' : ''}`}
                            >
                                <div className="site-value-large">{data.probingDepth}</div>
                                <div className="site-value-small">{data.gingivalMargin}</div>
                                <div className="site-label">
                                    {displayMap[key]}
                                </div>
                                {/* Indicators */}
                                <div className="site-indicators">
                                    {data.bleeding && <div className="indicator-dot indicator-red"></div>}
                                    {data.plaque && <div className="indicator-dot indicator-blue"></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Keypads Row */}
                <div className="keypads-row">
                    {/* Probing Depth */}
                    <div>
                        <h3 className="section-label">Probing Depth</h3>
                        {renderKeypad('probingDepth', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ['>12'])}
                    </div>

                    {/* Gingival Margin */}
                    <div>
                        <h3 className="section-label">Gingival Margin</h3>
                        {renderKeypad('gingivalMargin', [0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12], ['<-12', '+/-'])}
                    </div>
                </div>

                {/* Toggles Row */}
                <div className="toggles-row">
                    {[
                        { key: 'bleeding', label: 'Bleeding', dotClass: 'dot-red' },
                        { key: 'plaque', label: 'Plaque', dotClass: 'dot-blue' },
                        { key: 'pus', label: 'Pus', dotClass: 'dot-yellow' },
                        { key: 'tartar', label: 'Tartar', dotClass: 'dot-white' }
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => handleSiteDataUpdate({ [item.key]: !currentData[item.key] })}
                            className={`toggle-btn ${currentData[item.key] ? 'active' : 'inactive'}`}
                        >
                            {item.label}
                            <div className={`status-dot ${item.dotClass}`}></div>
                        </button>
                    ))}
                </div>

                {/* Tooth Mobility */}
                <div>
                    <h3 className="section-label">Tooth Mobility</h3>
                    <div className="mobility-grid">
                        {[
                            { label: 'Class 1', val: 'Class 1', icon: <div className="flex"><ChevronLeft size={12} /><ChevronRight size={12} /></div> },
                            { label: 'Class 2', val: 'Class 2', icon: <div className="flex"><ChevronsLeft size={12} /><ChevronsRight size={12} /></div> },
                            { label: 'Class 3', val: 'Class 3', icon: <div className="flex"><ChevronsLeft size={12} /><ChevronsRight size={12} /></div> }
                        ].map(cls => (
                            <button
                                key={cls.val}
                                onClick={() => handleMobilityChange(cls.val === tooth.periodontal.mobility ? null : cls.val)}
                                className={`mobility-btn ${tooth.periodontal.mobility === cls.val ? 'active' : 'inactive'}`}
                            >
                                {cls.label}
                                <span className="mobility-icon">{cls.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="footer-actions">
                    <button
                        onClick={() => navigate('../')}
                        className="save-btn"
                    >
                        SAVE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToothPeriodontal;
