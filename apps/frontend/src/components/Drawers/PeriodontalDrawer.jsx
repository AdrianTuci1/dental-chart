import React, { useState } from 'react';
import { useAppStore } from '../../core/store/appStore';
import { AppFacade } from '../../core/AppFacade';
import { PeriodontalFacade } from '../../models/PeriodontalFacade';
import './PeriodontalDrawer.css';

const PeriodontalDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const [activeTab, setActiveTab] = useState('probing'); // 'probing' or 'gingival'
    const [selectedSite, setSelectedSite] = useState('distoLingual');
    const [autoSequential, setAutoSequential] = useState(false);

    const { teeth, updateTooth, selectedPatient } = useAppStore();

    const facade = React.useMemo(() => new PeriodontalFacade(toothNumber, teeth, updateTooth), [toothNumber, teeth, updateTooth]);

    const handleActionWithSave = async (actionFn) => {
        if (selectedPatient && facade) {
            const freshStore = useAppStore.getState();
            const perioEvent = facade.generateHistoryEvent();

            if (perioEvent) {
                await AppFacade.patient.addToHistory(selectedPatient.id, perioEvent);
            } else {
                const patient = { ...freshStore.selectedPatient };
                patient.chart = { ...patient.chart, teeth: freshStore.teeth };
                freshStore.updatePatient(patient);
                await AppFacade.patient.update(patient.id, patient);
            }
        }
        if (actionFn) actionFn();
    };

    const siteLabels = facade.getSiteLabels();
    const siteKeys = ['distoLingual', 'lingual', 'mesioLingual', 'distoBuccal', 'buccal', 'mesioBuccal'];

    const sites = siteKeys.map(key => {
        const data = facade.getSiteData(key);
        const indicators = [];
        if (data.bleeding) indicators.push('red');
        if (data.plaque) indicators.push('blue');
        if (data.pus) indicators.push('yellow');
        if (data.tartar) indicators.push('white');

        return {
            id: key,
            label: siteLabels[key],
            val: activeTab === 'probing' ? data.probingDepth : Math.abs(data.gingivalMargin),
            indicators: indicators.length > 0 ? indicators : undefined
        };
    });

    const currentSiteData = facade.getSiteData(selectedSite);

    const handleNumpadClick = (val) => {
        const value = val === '>12' ? 13 : val; // simplify for now

        if (activeTab === 'probing') {
            facade.updateSiteData(selectedSite, { probingDepth: value });
        } else {
            // GM is often recorded as negative or positive, let's keep it simple
            facade.updateSiteData(selectedSite, { gingivalMargin: value });
        }

        if (autoSequential) {
            if (activeTab === 'probing') {
                setActiveTab('gingival');
            } else {
                const currentIndex = siteKeys.indexOf(selectedSite);
                if (currentIndex < siteKeys.length - 1) {
                    // Move to next site and reset back to probing
                    setSelectedSite(siteKeys[currentIndex + 1]);
                    setActiveTab('probing');
                } else {
                    // Reached the end of the sites for this tooth, move to next tooth
                    if (onNext) {
                        // Reset selected site to the first one for the next tooth
                        setSelectedSite(siteKeys[0]);
                        setActiveTab('probing');
                        handleActionWithSave(onNext);
                    }
                }
            }
        }
    };

    const handleToggleClick = (toggleKey) => {
        facade.updateSiteData(selectedSite, { [toggleKey]: !currentSiteData[toggleKey] });
    };

    const numpadValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, '>12'];

    return (
        <div className={`periodontal-drawer ${position}`}>
            <div className="drawer-header">
                <div className="drawer-nav">
                    <span className="nav-arrow" onClick={() => handleActionWithSave(onPrevious)}>&lt;</span>
                    <span className="nav-arrow" onClick={() => handleActionWithSave(onNext)}>&gt;</span>
                </div>
                <div className="tooth-title">TOOTH {toothNumber}</div>
                <div className="drawer-actions">
                    <span className="action-icon" onClick={() => handleActionWithSave(onClose)}>✕</span>
                </div>
            </div>

            <div className="probing-grid">
                {sites.map(site => (
                    <div
                        key={site.id}
                        className={`probing-cell ${selectedSite === site.id ? 'active' : ''}`}
                        onClick={() => setSelectedSite(site.id)}
                    >
                        <div className="probing-value">{site.val !== undefined && site.val !== null ? site.val : 0}</div>
                        <div className="probing-label">{site.label}</div>
                        {site.indicators && (
                            <div className="indicators">
                                {site.indicators.map((color, i) => (
                                    <div key={i} className={`indicator-dot ${color}`}></div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="measurement-tabs">
                <div
                    className={`tab ${activeTab === 'probing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('probing')}
                >
                    PROBING DEPTH
                </div>
                <div
                    className={`tab ${activeTab === 'gingival' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gingival')}
                >
                    GINGIVAL MARGIN
                </div>
            </div>

            <div className="numpad">
                {numpadValues.map(val => {
                    return (
                        <button
                            key={val}
                            className="numpad-btn"
                            onClick={() => handleNumpadClick(val)}
                        >
                            {val}
                        </button>
                    );
                })}
            </div>

            <div className="toggles-section">
                <button
                    className={`toggle-btn ${currentSiteData.bleeding ? 'active' : ''}`}
                    onClick={() => handleToggleClick('bleeding')}
                >
                    Bleeding
                    <span className="toggle-indicator red"></span>
                </button>
                <button
                    className={`toggle-btn ${currentSiteData.plaque ? 'active' : ''}`}
                    onClick={() => handleToggleClick('plaque')}
                >
                    Plaque
                    <span className="toggle-indicator blue"></span>
                </button>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    <button
                        className={`toggle-btn ${currentSiteData.pus ? 'active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => handleToggleClick('pus')}
                    >
                        Pus
                        <span className="toggle-indicator yellow"></span>
                    </button>
                    <button
                        className={`toggle-btn ${currentSiteData.tartar ? 'active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => handleToggleClick('tartar')}
                    >
                        Tartar
                        <span className="toggle-indicator white"></span>
                    </button>
                </div>
            </div>

            <div className="drawer-footer">
                <div className="auto-switch">
                    <span>AUTOMATIC SEQUENTIAL PROBING</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={autoSequential}
                            onChange={(e) => setAutoSequential(e.target.checked)}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
                <button className="next-btn" onClick={() => handleActionWithSave(onNext)}>NEXT TOOTH</button>
            </div>
        </div>
    );
};

export default PeriodontalDrawer;
