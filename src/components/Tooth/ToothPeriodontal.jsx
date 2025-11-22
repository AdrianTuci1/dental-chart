import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import './ToothPeriodontal.css';

const ToothPeriodontal = () => {
    const { site } = useParams();
    const navigate = useNavigate();
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();

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

    const displayMap = {
        'disto-lingual': 'Disto Lingual',
        'lingual': 'Lingual',
        'mesio-lingual': 'Mesio Lingual',
        'disto-buccal': 'Disto Buccal',
        'buccal': 'Buccal',
        'mesio-buccal': 'Mesio Buccal'
    };

    const internalKey = siteMap[currentSiteKey];

    // Helper to get current site data safely
    const getSiteData = (key) => {
        if (tooth && tooth.periodontal && tooth.periodontal.sites && tooth.periodontal.sites[key]) {
            return tooth.periodontal.sites[key];
        }
        return { probingDepth: 0, gingivalMargin: 0, bleeding: false, plaque: false, pus: false, tartar: false };
    };

    const currentData = getSiteData(internalKey);

    const handleSiteChange = (newSite) => {
        navigate(`../periodontal/${newSite}`);
    };

    const updateSiteData = (updates) => {
        if (!tooth) return;

        const newSites = { ...tooth.periodontal.sites };
        newSites[internalKey] = { ...newSites[internalKey], ...updates };

        updateTooth(tooth.toothNumber, {
            periodontal: {
                ...tooth.periodontal,
                sites: newSites
            }
        });
    };

    const handleMobilityChange = (cls) => {
        updateTooth(tooth.toothNumber, {
            periodontal: {
                ...tooth.periodontal,
                mobility: cls
            }
        });
    };

    const renderKeypad = (type, range, special = []) => {
        return (
            <div className="number-grid">
                {range.map(num => (
                    <button
                        key={num}
                        onClick={() => updateSiteData({ [type]: num })}
                        className={`num-btn ${currentData[type] === num ? 'active' : 'default'}`}
                    >
                        {num}
                    </button>
                ))}
                {special.map(val => (
                    <button
                        key={val}
                        onClick={() => updateSiteData({ [type]: val })}
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
                <h2 className="perio-title">Periodontal</h2>
                <div className="header-controls">
                    <Volume2 className="control-icon" size={20} />
                    <X className="control-icon" size={20} onClick={() => navigate('../')} />
                </div>
            </div>

            <div className="perio-content">
                {/* Top Row: Site Selectors */}
                <div className="site-selector-grid">
                    {Object.keys(siteMap).map((key) => {
                        const data = getSiteData(siteMap[key]);
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
                            onClick={() => updateSiteData({ [item.key]: !currentData[item.key] })}
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
