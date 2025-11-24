import React, { useState } from 'react';
import useChartStore from '../../store/chartStore';
import ToothZones from '../Tooth/ToothZones';
import './PathologyDrawer.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const PathologyDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const { teeth, updateTooth } = useChartStore();
    const tooth = teeth[toothNumber];

    const [view, setView] = useState('list'); // 'list' or 'configure'
    const [selectedPathologyType, setSelectedPathologyType] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    // Configuration states
    const [selectedZones, setSelectedZones] = useState([]);
    const [decayMaterial, setDecayMaterial] = useState(null);
    const [cavitation, setCavitation] = useState(null);
    const [cavitationLevel, setCavitationLevel] = useState(null);
    const [fractureLocation, setFractureLocation] = useState(null);
    const [fractureDirection, setFractureDirection] = useState(null);
    const [toothWearType, setToothWearType] = useState(null);
    const [toothWearSurface, setToothWearSurface] = useState(null);
    const [discolorationColor, setDiscolorationColor] = useState(null);
    const [apicalPresent, setApicalPresent] = useState(null);
    const [developmentDisorderPresent, setDevelopmentDisorderPresent] = useState(null);

    // Step management
    const [currentStep, setCurrentStep] = useState(0);

    const pathologyTypes = [
        { id: 'decay', label: 'Decay', route: 'decay' },
        { id: 'fracture', label: 'Fracture', route: 'fracture' },
        { id: 'tooth-wear', label: 'Tooth Wear', route: 'tooth-wear' },
        { id: 'discoloration', label: 'Discoloration', route: 'discoloration' },
        { id: 'apical', label: 'Apical', route: 'apical' },
        { id: 'development-disorder', label: 'Development Disorder', route: 'development-disorder' },
    ];

    const resetStates = () => {
        setSelectedZones([]);
        setDecayMaterial(null);
        setCavitation(null);
        setCavitationLevel(null);
        setFractureLocation(null);
        setFractureDirection(null);
        setToothWearType(null);
        setToothWearSurface(null);
        setDiscolorationColor(null);
        setApicalPresent(null);
        setDevelopmentDisorderPresent(null);
        setEditingIndex(null);
        setCurrentStep(0);
    };

    const handleTypeSelect = (typeId) => {
        if (selectedPathologyType === typeId) {
            setCurrentStep(1);
        } else {
            setSelectedPathologyType(typeId);
            setView('configure');
            const type = typeId;
            resetStates();
            setSelectedPathologyType(type);
            setCurrentStep(1);
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedPathologyType(null);
        resetStates();
    };

    const handleSave = () => {
        if (!tooth) return;

        const updatedPathology = { ...tooth.pathology };

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0 && decayMaterial && cavitation && cavitationLevel) {
                    const newDecay = {
                        type: `${decayMaterial}-${cavitation}-${cavitationLevel}`,
                        zones: selectedZones
                    };
                    if (editingIndex !== null && updatedPathology.decay && updatedPathology.decay[editingIndex]) {
                        updatedPathology.decay[editingIndex] = newDecay;
                    } else {
                        updatedPathology.decay = [...(updatedPathology.decay || []), newDecay];
                    }
                }
                break;
            case 'fracture':
                if (fractureLocation === 'crown') {
                    updatedPathology.fracture = { ...updatedPathology.fracture, crown: true };
                } else if (fractureLocation === 'root' && fractureDirection) {
                    updatedPathology.fracture = { ...updatedPathology.fracture, root: fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal' };
                }
                break;
            case 'tooth-wear':
                if (toothWearType && toothWearSurface) {
                    updatedPathology.toothWear = {
                        type: toothWearType === 'abrasion' ? 'Abrasion' : 'Erosion',
                        surface: toothWearSurface === 'buccal' ? 'Buccal' : 'Palatal'
                    };
                }
                break;
            case 'discoloration':
                if (discolorationColor) {
                    updatedPathology.discoloration = discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1);
                }
                break;
            case 'apical':
                if (apicalPresent !== null) {
                    updatedPathology.apicalPathology = apicalPresent;
                }
                break;
            case 'development-disorder':
                if (developmentDisorderPresent !== null) {
                    updatedPathology.developmentDisorder = developmentDisorderPresent;
                }
                break;
        }

        updateTooth(toothNumber, { pathology: updatedPathology });
        handleBack();
    };

    const handleEditItem = (type, item, index) => {
        setSelectedPathologyType(type);
        setView('configure');
        setEditingIndex(index);

        if (type === 'decay') {
            const parts = item.type.split('-');
            setDecayMaterial(parts[0]);
            if (parts[1] === 'no') {
                setCavitation('no-cavitation');
                setCavitationLevel(parts[3]);
            } else {
                setCavitation('cavitation');
                setCavitationLevel(parts[2]);
            }
            setSelectedZones(item.zones);
            setCurrentStep(4);
        }
        if (type === 'fracture') {
            if (item.crown) setFractureLocation('crown');
            if (item.root) {
                setFractureLocation('root');
                setFractureDirection(item.root === 'Vertical' ? 'vertical' : 'horizontal');
            }
            setCurrentStep(2); // Or 3
        }
        if (type === 'tooth-wear') {
            setToothWearType(item.type.toLowerCase());
            setToothWearSurface(item.surface.toLowerCase());
            setCurrentStep(2);
        }
        if (type === 'discoloration') {
            setDiscolorationColor(item.toLowerCase());
            setCurrentStep(1);
        }
        if (type === 'apical') {
            setApicalPresent(item);
            setCurrentStep(1);
        }
        if (type === 'development-disorder') {
            setDevelopmentDisorderPresent(item);
            setCurrentStep(1);
        }
    };

    const renderStepOptions = () => {
        // Step 0: Type Selection
        if (currentStep === 0) {
            return (
                <div className="step-container">
                    <div className="step-label">PATHOLOGY TYPE:</div>
                    <div className="options-stack">
                        {pathologyTypes.map(type => (
                            <button key={type.id} className={`stack-btn ${selectedPathologyType === type.id ? 'active' : ''}`}
                                onClick={() => handleTypeSelect(type.id)}>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (!selectedPathologyType) return null;

        if (selectedPathologyType === 'decay') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">SURFACES:</div>
                        <div className="drawer-zones">
                            <ToothZones selectedZones={selectedZones} onChange={setSelectedZones} />
                        </div>
                        <button className="continue-btn" onClick={() => setCurrentStep(2)}>
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
                            {['dentin', 'enamel'].map(m => (
                                <button key={m} className={`stack-btn ${decayMaterial === m ? 'active' : ''}`}
                                    onClick={() => {
                                        if (decayMaterial === m) {
                                            setDecayMaterial(null);
                                            setCavitation(null);
                                            setCavitationLevel(null);
                                        } else {
                                            setDecayMaterial(m);
                                            setCurrentStep(3);
                                        }
                                    }}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 3) {
                return (
                    <div className="step-container">
                        <div className="step-label">CAVITATION:</div>
                        <div className="options-stack">
                            {['cavitation', 'no-cavitation'].map(c => (
                                <button key={c} className={`stack-btn ${cavitation === c ? 'active' : ''}`}
                                    onClick={() => {
                                        if (cavitation === c) {
                                            setCavitation(null);
                                            setCavitationLevel(null);
                                        } else {
                                            setCavitation(c);
                                            setCurrentStep(4);
                                        }
                                    }}>
                                    {c === 'no-cavitation' ? 'No Cavitation' : 'Cavitation'}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 4) {
                return (
                    <div className="step-container">
                        <div className="step-label">LEVEL:</div>
                        <div className="options-stack">
                            {['C1', 'C2', 'C3', 'C4'].map(l => (
                                <button key={l} className={`stack-btn ${cavitationLevel === l ? 'active' : ''}`}
                                    onClick={() => {
                                        if (cavitationLevel === l) {
                                            setCavitationLevel(null);
                                        } else {
                                            setCavitationLevel(l);
                                        }
                                    }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        // Implement other types similarly...
        if (selectedPathologyType === 'fracture') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">LOCATION:</div>
                        <div className="options-stack">
                            {['crown', 'root'].map(l => (
                                <button key={l} className={`stack-btn ${fractureLocation === l ? 'active' : ''}`}
                                    onClick={() => {
                                        if (fractureLocation === l) {
                                            setFractureLocation(null);
                                            setFractureDirection(null);
                                        } else {
                                            setFractureLocation(l);
                                            setCurrentStep(l === 'root' ? 2 : 3);
                                        }
                                    }}>
                                    {l.charAt(0).toUpperCase() + l.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 2 && fractureLocation === 'root') {
                return (
                    <div className="step-container">
                        <div className="step-label">DIRECTION:</div>
                        <div className="options-stack">
                            {['vertical', 'horizontal'].map(d => (
                                <button key={d} className={`stack-btn ${fractureDirection === d ? 'active' : ''}`}
                                    onClick={() => {
                                        if (fractureDirection === d) {
                                            setFractureDirection(null);
                                        } else {
                                            setFractureDirection(d);
                                        }
                                    }}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        if (selectedPathologyType === 'tooth-wear') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">TYPE:</div>
                        <div className="options-stack">
                            {['abrasion', 'erosion'].map(t => (
                                <button key={t} className={`stack-btn ${toothWearType === t ? 'active' : ''}`}
                                    onClick={() => {
                                        if (toothWearType === t) {
                                            setToothWearType(null);
                                            setToothWearSurface(null);
                                        } else {
                                            setToothWearType(t);
                                            setCurrentStep(2);
                                        }
                                    }}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
            if (currentStep === 2) {
                return (
                    <div className="step-container">
                        <div className="step-label">SURFACE:</div>
                        <div className="options-stack">
                            {['buccal', 'lingual'].map(s => (
                                <button key={s} className={`stack-btn ${toothWearSurface === s ? 'active' : ''}`}
                                    onClick={() => {
                                        if (toothWearSurface === s) {
                                            setToothWearSurface(null);
                                        } else {
                                            setToothWearSurface(s);
                                        }
                                    }}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        if (selectedPathologyType === 'discoloration') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">COLOR:</div>
                        <div className="options-stack">
                            {['gray', 'red', 'yellow'].map(c => (
                                <button key={c} className={`stack-btn ${discolorationColor === c ? 'active' : ''}`}
                                    onClick={() => {
                                        if (discolorationColor === c) {
                                            setDiscolorationColor(null);
                                        } else {
                                            setDiscolorationColor(c);
                                        }
                                    }}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        if (selectedPathologyType === 'apical') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">APICAL PATHOLOGY:</div>
                        <div className="options-stack">
                            <button className={`stack-btn ${apicalPresent === true ? 'active' : ''}`} onClick={() => setApicalPresent(true)}>Yes</button>
                            <button className={`stack-btn ${apicalPresent === false ? 'active' : ''}`} onClick={() => setApicalPresent(false)}>No</button>
                        </div>
                    </div>
                );
            }
        }

        if (selectedPathologyType === 'development-disorder') {
            if (currentStep === 1) {
                return (
                    <div className="step-container">
                        <div className="step-label">DEVELOPMENT DISORDER:</div>
                        <div className="options-stack">
                            <button className={`stack-btn ${developmentDisorderPresent === true ? 'active' : ''}`} onClick={() => setDevelopmentDisorderPresent(true)}>Yes</button>
                            <button className={`stack-btn ${developmentDisorderPresent === false ? 'active' : ''}`} onClick={() => setDevelopmentDisorderPresent(false)}>No</button>
                        </div>
                    </div>
                );
            }
        }

        return null;
    };

    const renderSummary = () => {
        if (!selectedPathologyType && currentStep === 0) return null;

        const summaryItems = [
            { label: 'PATHOLOGY', value: pathologyTypes.find(t => t.id === selectedPathologyType)?.label || 'Select Type', step: 0 },
        ];

        if (selectedPathologyType === 'decay') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (decayMaterial) summaryItems.push({ label: 'MATERIAL', value: decayMaterial, step: 2 });
            if (cavitation) summaryItems.push({ label: 'CAVITATION', value: cavitation, step: 3 });
            if (cavitationLevel) summaryItems.push({ label: 'LEVEL', value: cavitationLevel, step: 4 });
        } else if (selectedPathologyType === 'fracture') {
            if (fractureLocation) summaryItems.push({ label: 'LOCATION', value: fractureLocation, step: 1 });
            if (fractureDirection) summaryItems.push({ label: 'DIRECTION', value: fractureDirection, step: 2 });
        } else if (selectedPathologyType === 'tooth-wear') {
            if (toothWearType) summaryItems.push({ label: 'TYPE', value: toothWearType, step: 1 });
            if (toothWearSurface) summaryItems.push({ label: 'SURFACE', value: toothWearSurface, step: 2 });
        } else if (selectedPathologyType === 'discoloration') {
            if (discolorationColor) summaryItems.push({ label: 'COLOR', value: discolorationColor, step: 1 });
        } else if (selectedPathologyType === 'apical') {
            if (apicalPresent !== null) summaryItems.push({ label: 'PRESENT', value: apicalPresent ? 'Yes' : 'No', step: 1 });
        } else if (selectedPathologyType === 'development-disorder') {
            if (developmentDisorderPresent !== null) summaryItems.push({ label: 'PRESENT', value: developmentDisorderPresent ? 'Yes' : 'No', step: 1 });
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

    const renderAddedItems = () => {
        if (!tooth || !tooth.pathology) return null;
        const p = tooth.pathology;
        const items = [];
        if (p.decay && p.decay.length > 0) {
            p.decay.forEach((d, i) => {
                items.push(
                    <div key={`decay-${i}`} className="added-item" onClick={() => handleEditItem('decay', d, i)}>
                        <div className="added-item-text">Decay</div>
                        <div className="added-item-details">{d.type} - Zones: {d.zones.join(', ')}</div>
                    </div>
                );
            });
        }
        if (p.fracture && (p.fracture.crown || p.fracture.root)) {
            items.push(
                <div key="fracture" className="added-item" onClick={() => handleEditItem('fracture', p.fracture, 0)}>
                    <div className="added-item-text">Fracture</div>
                    <div className="added-item-details">{p.fracture.crown ? 'Crown' : ''} {p.fracture.root ? `Root (${p.fracture.root})` : ''}</div>
                </div>
            );
        }
        if (p.toothWear && p.toothWear.type && p.toothWear.surface) {
            items.push(
                <div key="tooth-wear" className="added-item" onClick={() => handleEditItem('tooth-wear', p.toothWear, 0)}>
                    <div className="added-item-text">Tooth Wear</div>
                    <div className="added-item-details">{p.toothWear.type} - {p.toothWear.surface}</div>
                </div>
            );
        }
        if (p.discoloration) {
            items.push(
                <div key="discoloration" className="added-item" onClick={() => handleEditItem('discoloration', p.discoloration, 0)}>
                    <div className="added-item-text">Discoloration</div>
                    <div className="added-item-details">{p.discoloration}</div>
                </div>
            );
        }
        if (p.apicalPathology) {
            items.push(
                <div key="apical" className="added-item" onClick={() => handleEditItem('apical', p.apicalPathology, 0)}>
                    <div className="added-item-text">Apical Pathology</div>
                    <div className="added-item-details">Yes</div>
                </div>
            );
        }
        if (p.developmentDisorder) {
            items.push(
                <div key="dev-disorder" className="added-item" onClick={() => handleEditItem('development-disorder', p.developmentDisorder, 0)}>
                    <div className="added-item-text">Development Disorder</div>
                    <div className="added-item-details">Yes</div>
                </div>
            );
        }
        return items;
    };

    return (
        <div className={`pathology-drawer ${position}`}>
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
                            {pathologyTypes.map(type => (
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

export default PathologyDrawer;
