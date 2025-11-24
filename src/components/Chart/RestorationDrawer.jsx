import React, { useState, useEffect } from 'react';
import useChartStore from '../../store/chartStore';
import ToothZones from '../Tooth/ToothZones';
import './RestorationDrawer.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const RestorationDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const { teeth, updateTooth } = useChartStore();
    const tooth = teeth[toothNumber];

    const [view, setView] = useState('list'); // 'list' or 'configure'
    const [selectedRestorationType, setSelectedRestorationType] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    // Configuration states
    const [selectedZones, setSelectedZones] = useState([]);
    const [fillingMaterial, setFillingMaterial] = useState(null);
    const [fillingQuality, setFillingQuality] = useState(null);
    const [veneerMaterial, setVeneerMaterial] = useState(null);
    const [veneerQuality, setVeneerQuality] = useState(null);
    const [veneerDetail, setVeneerDetail] = useState(null);
    const [crownMaterial, setCrownMaterial] = useState(null);
    const [crownType, setCrownType] = useState(null);
    const [crownBase, setCrownBase] = useState(null);
    const [implantType, setImplantType] = useState(null);

    // Step management
    const [currentStep, setCurrentStep] = useState(0);

    const restorationTypes = [
        { id: 'filling', label: 'Filling', route: 'filling' },
        { id: 'veneer', label: 'Veneer', route: 'veneer' },
        { id: 'crown', label: 'Crown', route: 'crown' },
    ];

    const resetStates = () => {
        setSelectedZones([]);
        setFillingMaterial(null);
        setFillingQuality(null);
        setVeneerMaterial(null);
        setVeneerQuality(null);
        setVeneerDetail(null);
        setCrownMaterial(null);
        setCrownType(null);
        setCrownBase(null);
        setImplantType(null);
        setEditingIndex(null);
        setCurrentStep(0);
    };

    const handleTypeSelect = (typeId) => {
        if (selectedRestorationType === typeId) {
            // If clicking the same type, maybe just go to step 1?
            // But if we are in step 0, we are selecting type.
            setCurrentStep(1);
        } else {
            setSelectedRestorationType(typeId);
            setView('configure');
            // Reset other states but keep type
            const type = typeId;
            resetStates();
            setSelectedRestorationType(type);
            setCurrentStep(1);
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedRestorationType(null);
        resetStates();
    };

    const handleSave = () => {
        if (!tooth) return;

        const updatedRestoration = { ...tooth.restoration };

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial && fillingQuality) {
                    const newFilling = {
                        zones: selectedZones,
                        material: fillingMaterial,
                        quality: fillingQuality
                    };
                    if (editingIndex !== null && updatedRestoration.fillings && updatedRestoration.fillings[editingIndex]) {
                        updatedRestoration.fillings[editingIndex] = newFilling;
                    } else {
                        updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
                    }
                }
                break;
            case 'veneer':
                if (selectedZones.length > 0 && veneerMaterial && veneerQuality && veneerDetail) {
                    const newVeneer = {
                        zones: selectedZones,
                        material: veneerMaterial,
                        quality: veneerQuality,
                        detail: veneerDetail
                    };
                    if (editingIndex !== null && updatedRestoration.veneers && updatedRestoration.veneers[editingIndex]) {
                        updatedRestoration.veneers[editingIndex] = newVeneer;
                    } else {
                        updatedRestoration.veneers = [...(updatedRestoration.veneers || []), newVeneer];
                    }
                }
                break;
            case 'crown':
                if (crownMaterial && crownType && crownBase) {
                    const newCrown = {
                        material: crownMaterial,
                        quality: 'Sufficient',
                        type: crownType,
                        base: crownBase
                    };
                    if (crownBase === 'Implant' && implantType) {
                        newCrown.implantType = implantType;
                    }
                    if (editingIndex !== null && updatedRestoration.crowns && updatedRestoration.crowns[editingIndex]) {
                        updatedRestoration.crowns[editingIndex] = newCrown;
                    } else {
                        updatedRestoration.crowns = [...(updatedRestoration.crowns || []), newCrown];
                    }
                }
                break;
        }

        updateTooth(toothNumber, { restoration: updatedRestoration });
        handleBack();
    };

    const handleEditItem = (type, item, index) => {
        setSelectedRestorationType(type);
        setView('configure');
        setEditingIndex(index);

        if (type === 'filling') {
            setSelectedZones(item.zones || []);
            setFillingMaterial(item.material);
            setFillingQuality(item.quality);
            setCurrentStep(3);
        }
        if (type === 'veneer') {
            setSelectedZones(item.zones || []);
            setVeneerMaterial(item.material);
            setVeneerQuality(item.quality);
            setVeneerDetail(item.detail);
            setCurrentStep(4);
        }
        if (type === 'crown') {
            setCrownMaterial(item.material);
            setCrownType(item.type);
            setCrownBase(item.base);
            if (item.implantType) setImplantType(item.implantType);
            setCurrentStep(item.base === 'Implant' ? 5 : 4);
        }
    };

    // Render Steps Logic
    const renderStepOptions = () => {
        // Step 0: Type Selection (If we allow going back to 0)
        if (currentStep === 0) {
            return (
                <div className="step-container">
                    <div className="step-label">RESTORATION TYPE:</div>
                    <div className="options-stack">
                        {restorationTypes.map(type => (
                            <button key={type.id} className={`stack-btn ${selectedRestorationType === type.id ? 'active' : ''}`}
                                onClick={() => handleTypeSelect(type.id)}>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (!selectedRestorationType) return null;

        // Filling Flow: Type -> Zones -> Material -> Quality
        if (selectedRestorationType === 'filling') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">SURFACES:</div>
                        <div className="drawer-zones">
                            <ToothZones selectedZones={selectedZones} onChange={setSelectedZones} />
                        </div>
                        <button className="continue-btn" onClick={() => setCurrentStep(2)} disabled={selectedZones.length === 0}>
                            ADD DETAILS
                        </button>
                    </div>
                );
            }
            if (currentStep === 2) {
                return (
                    <div className="step-container">
                        <div className="step-label">MATERIAL:</div>
                        <div className="options-stack">
                            {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                                <button key={m} className={`stack-btn ${fillingMaterial === m ? 'active' : ''}`}
                                    onClick={() => {
                                        if (fillingMaterial === m) {
                                            setFillingMaterial(null);
                                            setFillingQuality(null); // Reset dependent
                                        } else {
                                            setFillingMaterial(m);
                                            setCurrentStep(3);
                                        }
                                    }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 3) {
                return (
                    <div className="step-container">
                        <div className="step-label">QUALITY:</div>
                        <div className="options-stack">
                            {['Sufficient', 'Uncertain', 'Insufficient'].map(q => (
                                <button key={q} className={`stack-btn ${fillingQuality === q ? 'active' : ''}`}
                                    onClick={() => {
                                        if (fillingQuality === q) {
                                            setFillingQuality(null);
                                        } else {
                                            setFillingQuality(q);
                                        }
                                    }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        // Veneer Flow: Type -> Zones -> Material -> Quality -> Detail
        if (selectedRestorationType === 'veneer') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">SURFACES:</div>
                        <div className="drawer-zones">
                            <ToothZones selectedZones={selectedZones} onChange={setSelectedZones} />
                        </div>
                        <button className="continue-btn" onClick={() => setCurrentStep(2)} disabled={selectedZones.length === 0}>
                            ADD DETAILS
                        </button>
                    </div>
                );
            }
            if (currentStep === 2) {
                return (
                    <div className="step-container">
                        <div className="step-label">MATERIAL:</div>
                        <div className="options-stack">
                            {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                                <button key={m} className={`stack-btn ${veneerMaterial === m ? 'active' : ''}`}
                                    onClick={() => {
                                        if (veneerMaterial === m) {
                                            setVeneerMaterial(null);
                                            setVeneerQuality(null);
                                            setVeneerDetail(null);
                                        } else {
                                            setVeneerMaterial(m);
                                            setCurrentStep(3);
                                        }
                                    }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 3) {
                return (
                    <div className="step-container">
                        <div className="step-label">QUALITY:</div>
                        <div className="options-stack">
                            {['Sufficient', 'Uncertain', 'Insufficient'].map(q => (
                                <button key={q} className={`stack-btn ${veneerQuality === q ? 'active' : ''}`}
                                    onClick={() => {
                                        if (veneerQuality === q) {
                                            setVeneerQuality(null);
                                            setVeneerDetail(null);
                                        } else {
                                            setVeneerQuality(q);
                                            setCurrentStep(4);
                                        }
                                    }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 4) {
                return (
                    <div className="step-container">
                        <div className="step-label">DETAIL:</div>
                        <div className="options-stack">
                            {['Overhang', 'Flush', 'Shortfall'].map(d => (
                                <button key={d} className={`stack-btn ${veneerDetail === d ? 'active' : ''}`}
                                    onClick={() => {
                                        if (veneerDetail === d) {
                                            setVeneerDetail(null);
                                        } else {
                                            setVeneerDetail(d);
                                        }
                                    }}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        // Crown Flow: Type -> Material -> Crown Type -> Crown Base -> (Implant Type)
        if (selectedRestorationType === 'crown') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">MATERIAL:</div>
                        <div className="options-stack">
                            {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                                <button key={m} className={`stack-btn ${crownMaterial === m ? 'active' : ''}`}
                                    onClick={() => {
                                        if (crownMaterial === m) {
                                            setCrownMaterial(null);
                                            setCrownType(null);
                                            setCrownBase(null);
                                            setImplantType(null);
                                        } else {
                                            setCrownMaterial(m);
                                            setCurrentStep(2);
                                        }
                                    }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 2) {
                return (
                    <div className="step-container">
                        <div className="step-label">CROWN TYPE:</div>
                        <div className="options-stack">
                            {['Single Crown', 'Abutment', 'Pontic'].map(t => (
                                <button key={t} className={`stack-btn ${crownType === t ? 'active' : ''}`}
                                    onClick={() => {
                                        if (crownType === t) {
                                            setCrownType(null);
                                            setCrownBase(null);
                                            setImplantType(null);
                                        } else {
                                            setCrownType(t);
                                            setCurrentStep(3);
                                        }
                                    }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 3) {
                return (
                    <div className="step-container">
                        <div className="step-label">CROWN BASE:</div>
                        <div className="options-stack">
                            {['Natural', 'Implant'].map(b => (
                                <button key={b} className={`stack-btn ${crownBase === b ? 'active' : ''}`}
                                    onClick={() => {
                                        if (crownBase === b) {
                                            setCrownBase(null);
                                            setImplantType(null);
                                        } else {
                                            setCrownBase(b);
                                            setCurrentStep(b === 'Implant' ? 4 : 5);
                                        }
                                    }}>
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 4 && crownBase === 'Implant') {
                return (
                    <div className="step-container">
                        <div className="step-label">IMPLANT TYPE:</div>
                        <div className="options-stack">
                            {['Bone Level', 'Tissue Level'].map(t => (
                                <button key={t} className={`stack-btn ${implantType === t ? 'active' : ''}`}
                                    onClick={() => {
                                        if (implantType === t) {
                                            setImplantType(null);
                                        } else {
                                            setImplantType(t);
                                        }
                                    }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        return null;
    };

    const renderSummary = () => {
        if (!selectedRestorationType && currentStep === 0) return null;

        const summaryItems = [
            { label: 'RESTORATION', value: restorationTypes.find(t => t.id === selectedRestorationType)?.label || 'Select Type', step: 0 },
        ];

        if (selectedRestorationType === 'filling') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (fillingMaterial) summaryItems.push({ label: 'MATERIAL', value: fillingMaterial, step: 2 });
            if (fillingQuality) summaryItems.push({ label: 'QUALITY', value: fillingQuality, step: 3 });
        } else if (selectedRestorationType === 'veneer') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (veneerMaterial) summaryItems.push({ label: 'MATERIAL', value: veneerMaterial, step: 2 });
            if (veneerQuality) summaryItems.push({ label: 'QUALITY', value: veneerQuality, step: 3 });
            if (veneerDetail) summaryItems.push({ label: 'DETAIL', value: veneerDetail, step: 4 });
        } else if (selectedRestorationType === 'crown') {
            if (crownMaterial) summaryItems.push({ label: 'MATERIAL', value: crownMaterial, step: 1 });
            if (crownType) summaryItems.push({ label: 'TYPE', value: crownType, step: 2 });
            if (crownBase) summaryItems.push({ label: 'BASE', value: crownBase, step: 3 });
            if (implantType) summaryItems.push({ label: 'IMPLANT', value: implantType, step: 4 });
        }

        return (
            <div className="summary-list">
                {summaryItems.map((item, index) => (
                    <div key={index} className="summary-row" onClick={() => setCurrentStep(item.step)}>
                        <span className="summary-label">{item.label}:</span>
                        <span className="summary-value">{item.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Helper to render added items list (Only shown in 'list' view)
    const renderAddedItems = () => {
        if (!tooth || !tooth.restoration) return null;
        const r = tooth.restoration;
        const items = [];

        if (r.fillings && r.fillings.length > 0) {
            r.fillings.forEach((f, i) => {
                items.push(
                    <div key={`filling-${i}`} className="added-item" onClick={() => handleEditItem('filling', f, i)}>
                        <div className="added-item-text">Filling</div>
                        <div className="added-item-details">{f.material} - {f.quality} - Zones: {f.zones?.join(', ')}</div>
                    </div>
                );
            });
        }
        if (r.veneers && r.veneers.length > 0) {
            r.veneers.forEach((v, i) => {
                items.push(
                    <div key={`veneer-${i}`} className="added-item" onClick={() => handleEditItem('veneer', v, i)}>
                        <div className="added-item-text">Veneer</div>
                        <div className="added-item-details">{v.material} - {v.quality} - {v.detail}</div>
                    </div>
                );
            });
        }
        if (r.crowns && r.crowns.length > 0) {
            r.crowns.forEach((c, i) => {
                items.push(
                    <div key={`crown-${i}`} className="added-item" onClick={() => handleEditItem('crown', c, i)}>
                        <div className="added-item-text">Crown</div>
                        <div className="added-item-details">{c.material} - {c.type} - {c.base} {c.implantType ? `(${c.implantType})` : ''}</div>
                    </div>
                );
            });
        }

        return items;
    };

    return (
        <div className={`restoration-drawer ${position}`}>
            <div className="drawer-header">
                <div className="drawer-nav">
                    <span className="nav-arrow" onClick={onPrevious}><ChevronLeft size={24} /></span>
                    <span className="nav-arrow" onClick={onNext}><ChevronRight size={24} /></span>
                </div>
                <div className="tooth-title">TOOTH {toothNumber}</div>
                <div className="drawer-actions">
                    <span className="action-icon">🔇</span>
                    <span className="action-icon" onClick={onClose}><X size={24} /></span>
                </div>
            </div>

            <div className="drawer-content">
                {view === 'list' ? (
                    <div className="scrollable-content">
                        <div className="added-items-list">
                            {renderAddedItems()}
                        </div>
                        <div className="type-selector-grid">
                            {restorationTypes.map(type => (
                                <button key={type.id} className="type-btn" onClick={() => handleTypeSelect(type.id)}>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="scrollable-content configuration-view">
                            {renderSummary()}
                            {renderStepOptions()}
                        </div>
                        <div className="fixed-footer">
                            <button className="action-btn save-full" onClick={handleSave}>SAVE</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RestorationDrawer;
