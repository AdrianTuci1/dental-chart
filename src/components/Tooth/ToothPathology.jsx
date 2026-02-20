import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import usePatientStore from '../../store/patientStore';
import ToothZones from './ToothZones';
import './ToothPathology.css';

const ToothPathology = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();
    const { selectedPatient, addTreatmentPlanItem, addToHistory } = usePatientStore();

    // Track if a pathology type is selected (null means none selected)
    const [selectedPathologyType, setSelectedPathologyType] = useState(type || null);

    const pathologyTypes = [
        { id: 'decay', label: 'Decay', route: 'decay' },
        { id: 'fracture', label: 'Fracture', route: 'fracture' },
        { id: 'tooth-wear', label: 'Tooth Wear', route: 'tooth-wear' },
        { id: 'discoloration', label: 'Discoloration', route: 'discoloration' },
        { id: 'apical', label: 'Apical', route: 'apical' },
        { id: 'development-disorder', label: 'Development Disorder', route: 'development-disorder' },
    ];

    const [selectedZones, setSelectedZones] = useState([]);

    // Decay progressive states
    const [decayMaterial, setDecayMaterial] = useState(null); // 'dentin' or 'enamel'
    const [cavitation, setCavitation] = useState(null); // 'cavitation' or 'no-cavitation'
    const [cavitationLevel, setCavitationLevel] = useState(null); // 'C1', 'C2', 'C3', 'C4'

    // Fracture states
    const [fractureLocation, setFractureLocation] = useState(null); // 'crown' or 'root'
    const [fractureDirection, setFractureDirection] = useState(null); // 'vertical' or 'horizontal' (only for root)

    // Tooth Wear states
    const [toothWearType, setToothWearType] = useState(null); // 'abrasion', 'erosion'
    const [toothWearSurface, setToothWearSurface] = useState(null); // 'buccal', 'palatal'

    // Discoloration state
    const [discolorationColor, setDiscolorationColor] = useState(null); // 'gray', 'red', 'yellow'

    // Apical state
    const [apicalPresent, setApicalPresent] = useState(null); // true or false

    // Development Disorder state
    const [developmentDisorderPresent, setDevelopmentDisorderPresent] = useState(null); // true or false

    const handleTypeChange = (pathType) => {
        if (selectedPathologyType === pathType.route) {
            // Deselect if clicking the same button
            setSelectedPathologyType(null);
            navigate('../pathology');
            // Reset all states
            resetAllStates();
        } else {
            // Select new pathology type
            setSelectedPathologyType(pathType.route);
            navigate(`../pathology/${pathType.route}`);
            // Reset all states when changing type
            resetAllStates();
        }
    };

    const { setPreviewData } = useOutletContext(); // Get preview setter

    const resetAllStates = () => {
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
    };

    // Effect for Real-time Preview
    React.useEffect(() => {
        if (!tooth || !setPreviewData) return;

        // If no pathology type selected, clear preview
        if (!selectedPathologyType) {
            setPreviewData(null);
            return;
        }

        // Construct preview pathology object based on current selections
        const previewPathology = JSON.parse(JSON.stringify(tooth.pathology || {}));

        // Helper to check if minimum requirements for preview are met
        let isValidPreview = false;

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0) {
                    // Creating a temporary decay item for preview even if incomplete
                    const newDecay = {
                        type: `${decayMaterial || '?'}-${cavitation || '?'}-${cavitationLevel || '?'}`,
                        zones: selectedZones
                    };
                    previewPathology.decay = [...(previewPathology.decay || []), newDecay];
                    isValidPreview = true;
                }
                break;
            case 'fracture':
                if (fractureLocation === 'crown') {
                    previewPathology.fracture.crown = true;
                    isValidPreview = true;
                } else if (fractureLocation === 'root' && fractureDirection) {
                    previewPathology.fracture.root = fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal';
                    isValidPreview = true;
                }
                break;
            case 'tooth-wear':
                // For wear, we need type and surface to render properly? Or just mock it?
                // Visualizer might need surface.
                if (toothWearType && toothWearSurface) {
                    previewPathology.toothWear = {
                        type: toothWearType === 'abrasion' ? 'Abrasion' : 'Erosion',
                        surface: toothWearSurface === 'buccal' ? 'Buccal' : 'Palatal'
                    };
                    isValidPreview = true;
                }
                break;
            case 'discoloration':
                if (discolorationColor) {
                    previewPathology.discoloration = discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1);
                    isValidPreview = true;
                }
                break;
            case 'apical':
                if (apicalPresent !== null) {
                    previewPathology.apicalPathology = apicalPresent;
                    isValidPreview = true;
                }
                break;
            case 'development-disorder':
                if (developmentDisorderPresent !== null) {
                    previewPathology.developmentDisorder = developmentDisorderPresent;
                    isValidPreview = true;
                }
                break;
        }

        if (isValidPreview) {
            setPreviewData({
                ...tooth,
                pathology: previewPathology
            });
        } else {
            setPreviewData(null);
        }

    }, [
        tooth,
        selectedPathologyType,
        selectedZones,
        decayMaterial,
        cavitation,
        cavitationLevel,
        fractureLocation,
        fractureDirection,
        toothWearType,
        toothWearSurface,
        discolorationColor,
        apicalPresent,
        developmentDisorderPresent,
        setPreviewData
    ]);

    // Clear preview when unmounting
    React.useEffect(() => {
        return () => {
            if (setPreviewData) setPreviewData(null);
        }
    }, [setPreviewData]);

    const handleAction = (actionType) => {
        if (!tooth || !selectedPatient) return;

        const parts = [];
        const typeLabel = pathologyTypes.find(t => t.route === selectedPathologyType)?.label;
        if (typeLabel) parts.push(typeLabel);

        if (selectedPathologyType === 'decay') {
            if (selectedZones.length > 0) parts.push(selectedZones.join(', '));
            if (decayMaterial) parts.push(decayMaterial.charAt(0).toUpperCase() + decayMaterial.slice(1));
            if (cavitation) parts.push(cavitation === 'no-cavitation' ? 'No Cavitation' : 'Cavitation');
            if (cavitationLevel) parts.push(cavitationLevel);
        } else if (selectedPathologyType === 'fracture') {
            if (fractureLocation) parts.push(`${fractureLocation.charAt(0).toUpperCase() + fractureLocation.slice(1)} Fracture`);
            if (fractureDirection) parts.push(fractureDirection.charAt(0).toUpperCase() + fractureDirection.slice(1));
        } else if (selectedPathologyType === 'tooth-wear') {
            if (toothWearType) parts.push(toothWearType.charAt(0).toUpperCase() + toothWearType.slice(1));
            if (toothWearSurface) parts.push(toothWearSurface.charAt(0).toUpperCase() + toothWearSurface.slice(1));
        } else if (selectedPathologyType === 'discoloration') {
            if (discolorationColor) parts.push(discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1));
        } else if (selectedPathologyType === 'apical') {
            if (apicalPresent !== null) parts.push(apicalPresent ? 'Present' : 'Not Present');
        } else if (selectedPathologyType === 'development-disorder') {
            if (developmentDisorderPresent !== null) parts.push(developmentDisorderPresent ? 'Present' : 'Not Present');
        }

        const procedure = parts.join(', ');
        if (parts.length <= 1 && actionType !== 'save') return;

        const newItemId = Date.now().toString();

        const baseItem = {
            id: newItemId,
            procedure,
            tooth: tooth.toothNumber,
            cost: actionType === 'monitor' ? 50 : 200,
            priority: actionType === 'monitor' ? 'low' : 'medium'
        };

        if (actionType === 'monitor' || actionType === 'treat') {
            addTreatmentPlanItem(selectedPatient.id, {
                ...baseItem,
                status: actionType === 'monitor' ? 'monitoring' : 'planned'
            });
            handleSave(actionType, newItemId, true);
        } else if (actionType === 'save') {
            handleSave(actionType, newItemId, true);
            addToHistory(selectedPatient.id, {
                id: newItemId,
                description: procedure,
                provider: 'Dr. Current',
                tooth: tooth.toothNumber
            });
        }

        navigate('../');
    };

    const handleSave = (actionType = 'save', newItemId = Date.now().toString(), silent = false) => {
        if (!tooth) return;

        const updatedPathology = { ...tooth.pathology };
        let hasChanges = false;
        const status = actionType === 'monitor' ? 'monitoring' : (actionType === 'treat' ? 'planned' : 'completed');
        const dateStr = actionType === 'save' ? new Date().toISOString() : undefined;

        const attachMeta = (obj) => {
            obj.id = newItemId;
            obj.status = status;
            if (dateStr) obj.date = dateStr;
            return obj;
        };

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0) {
                    const newDecay = attachMeta({
                        type: `${decayMaterial || '?'}-${cavitation || '?'}-${cavitationLevel || '?'}`,
                        zones: selectedZones
                    });
                    updatedPathology.decay = [...(updatedPathology.decay || []), newDecay];
                    hasChanges = true;
                }
                break;
            case 'fracture':
                const fractureBase = updatedPathology.fracture || {};
                updatedPathology.fracture = attachMeta(fractureBase);
                if (fractureLocation === 'crown') {
                    updatedPathology.fracture.crown = true;
                    hasChanges = true;
                } else if (fractureLocation === 'root' && fractureDirection) {
                    updatedPathology.fracture.root = fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal';
                    hasChanges = true;
                }
                break;
            case 'tooth-wear':
                if (toothWearType || toothWearSurface) {
                    updatedPathology.toothWear = attachMeta({
                        type: toothWearType === 'abrasion' ? 'Abrasion' : (toothWearType === 'erosion' ? 'Erosion' : '?'),
                        surface: toothWearSurface === 'buccal' ? 'Buccal' : (toothWearSurface === 'lingual' ? 'Lingual' : '?')
                    });
                    hasChanges = true;
                }
                break;
            case 'discoloration':
                if (discolorationColor) {
                    updatedPathology.discoloration = attachMeta({
                        color: discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1)
                    });
                    hasChanges = true;
                }
                break;
            case 'apical':
                if (apicalPresent !== null) {
                    updatedPathology.apicalPathology = attachMeta({
                        present: apicalPresent
                    });
                    hasChanges = true;
                }
                break;
            case 'development-disorder':
                if (developmentDisorderPresent !== null) {
                    updatedPathology.developmentDisorder = attachMeta({
                        present: developmentDisorderPresent
                    });
                    hasChanges = true;
                }
                break;
        }

        if (hasChanges) {
            updateTooth(tooth.toothNumber, { pathology: updatedPathology });
        }

        // Reset selections
        setSelectedZones([]);
        resetAllStates();

        // Navigate back to overview if not silent
        if (!silent) {
            navigate('../');
        }
    };

    const renderDecayOptions = () => (
        <div className="pathology-options">
            {/* Step 1: Select Dentin or Enamel */}
            <div className="option-group">
                <h3 className="option-label">Material</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${decayMaterial === 'dentin' ? 'active' : ''}`}
                        onClick={() => {
                            setDecayMaterial('dentin');
                            // Reset subsequent selections
                            setCavitation(null);
                            setCavitationLevel(null);
                        }}
                    >
                        Dentin
                    </button>
                    <button
                        className={`option-btn ${decayMaterial === 'enamel' ? 'active' : ''}`}
                        onClick={() => {
                            setDecayMaterial('enamel');
                            // Reset subsequent selections
                            setCavitation(null);
                            setCavitationLevel(null);
                        }}
                    >
                        Enamel
                    </button>
                </div>
            </div>

            {/* Step 2: Show Cavitation options only if material is selected */}
            {decayMaterial && (
                <div className="option-group">
                    <h3 className="option-label">Cavitation</h3>
                    <div className="button-row">
                        <button
                            className={`option-btn ${cavitation === 'cavitation' ? 'active' : ''}`}
                            onClick={() => {
                                setCavitation('cavitation');
                                // Reset level
                                setCavitationLevel(null);
                            }}
                        >
                            Cavitation
                        </button>
                        <button
                            className={`option-btn ${cavitation === 'no-cavitation' ? 'active' : ''}`}
                            onClick={() => {
                                setCavitation('no-cavitation');
                                // Reset level
                                setCavitationLevel(null);
                            }}
                        >
                            No Cavitation
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Show Level options only if cavitation is selected */}
            {decayMaterial && cavitation && (
                <div className="option-group">
                    <h3 className="option-label">Level</h3>
                    <div className="button-row">
                        {['C1', 'C2', 'C3', 'C4'].map(level => (
                            <button
                                key={level}
                                className={`option-btn ${cavitationLevel === level ? 'active' : ''}`}
                                onClick={() => setCavitationLevel(level)}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderFractureOptions = () => (
        <div className="pathology-options">
            {/* Step 1: Select Location (Crown or Root) */}
            <div className="option-group">
                <h3 className="option-label">Location</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${fractureLocation === 'crown' ? 'active' : ''}`}
                        onClick={() => {
                            setFractureLocation('crown');
                            setFractureDirection(null);
                        }}
                    >
                        Crown
                    </button>
                    <button
                        className={`option-btn ${fractureLocation === 'root' ? 'active' : ''}`}
                        onClick={() => {
                            setFractureLocation('root');
                            setFractureDirection(null);
                        }}
                    >
                        Root
                    </button>
                </div>
            </div>

            {/* Step 2: Show Direction only if Root is selected */}
            {fractureLocation === 'root' && (
                <div className="option-group">
                    <h3 className="option-label">Direction</h3>
                    <div className="button-row">
                        <button
                            className={`option-btn ${fractureDirection === 'vertical' ? 'active' : ''}`}
                            onClick={() => setFractureDirection('vertical')}
                        >
                            Vertical
                        </button>
                        <button
                            className={`option-btn ${fractureDirection === 'horizontal' ? 'active' : ''}`}
                            onClick={() => setFractureDirection('horizontal')}
                        >
                            Horizontal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderToothWearOptions = () => (
        <div className="pathology-options">
            {/* Step 1: Select Type */}
            <div className="option-group">
                <h3 className="option-label">Type</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${toothWearType === 'abrasion' ? 'active' : ''}`}
                        onClick={() => {
                            setToothWearType('abrasion');
                            setToothWearSurface(null);
                        }}
                    >
                        Abrasion
                    </button>
                    <button
                        className={`option-btn ${toothWearType === 'erosion' ? 'active' : ''}`}
                        onClick={() => {
                            setToothWearType('erosion');
                            setToothWearSurface(null);
                        }}
                    >
                        Erosion
                    </button>
                </div>
            </div>

            {/* Step 2: Show Surface only if type is selected */}
            {toothWearType && (
                <div className="option-group">
                    <h3 className="option-label">Surface</h3>
                    <div className="button-row">
                        <button
                            className={`option-btn ${toothWearSurface === 'buccal' ? 'active' : ''}`}
                            onClick={() => setToothWearSurface('buccal')}
                        >
                            Buccal
                        </button>
                        <button
                            className={`option-btn ${toothWearSurface === 'lingual' ? 'active' : ''}`}
                            onClick={() => setToothWearSurface('lingual')}
                        >
                            Lingual
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDiscolorationOptions = () => (
        <div className="pathology-options">
            <div className="option-group">
                <h3 className="option-label">Color</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${discolorationColor === 'gray' ? 'active' : ''}`}
                        onClick={() => setDiscolorationColor('gray')}
                    >
                        Gray
                    </button>
                    <button
                        className={`option-btn ${discolorationColor === 'red' ? 'active' : ''}`}
                        onClick={() => setDiscolorationColor('red')}
                    >
                        Red
                    </button>
                    <button
                        className={`option-btn ${discolorationColor === 'yellow' ? 'active' : ''}`}
                        onClick={() => setDiscolorationColor('yellow')}
                    >
                        Yellow
                    </button>
                </div>
            </div>
        </div>
    );

    const renderApicalOptions = () => (
        <div className="pathology-options">
            <div className="option-group">
                <h3 className="option-label">Apical Pathology</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${apicalPresent === true ? 'active' : ''}`}
                        onClick={() => setApicalPresent(true)}
                    >
                        Yes
                    </button>
                    <button
                        className={`option-btn ${apicalPresent === false ? 'active' : ''}`}
                        onClick={() => setApicalPresent(false)}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDevelopmentDisorderOptions = () => (
        <div className="pathology-options">
            <div className="option-group">
                <h3 className="option-label">Development Disorder</h3>
                <div className="button-row">
                    <button
                        className={`option-btn ${developmentDisorderPresent === true ? 'active' : ''}`}
                        onClick={() => setDevelopmentDisorderPresent(true)}
                    >
                        Yes
                    </button>
                    <button
                        className={`option-btn ${developmentDisorderPresent === false ? 'active' : ''}`}
                        onClick={() => setDevelopmentDisorderPresent(false)}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );

    const renderOptions = () => {
        // Only render options if a pathology type is selected
        if (!selectedPathologyType) {
            return null;
        }

        switch (selectedPathologyType) {
            case 'decay':
                return renderDecayOptions();
            case 'fracture':
                return renderFractureOptions();
            case 'tooth-wear':
                return renderToothWearOptions();
            case 'discoloration':
                return renderDiscolorationOptions();
            case 'apical':
                return renderApicalOptions();
            case 'development-disorder':
                return renderDevelopmentDisorderOptions();
            default:
                return null;
        }
    };

    return (
        <div className="pathology-container" data-view="pathology">
            <div className="pathology-content">
                <ToothZones
                    selectedZones={selectedZones}
                    onChange={setSelectedZones}
                    inactive={selectedPathologyType !== 'decay'}
                    toothNumber={tooth?.toothNumber}
                    zoneColor="#EF4444" // Red-500 for pathology
                    restorationType="decay"
                />

                {/* Main Content - Right Column */}
                <div className="pathology-main">
                    {/* Header */}
                    <div className="pathology-header">
                        <h2 className="pathology-title">Pathology</h2>
                        <div className="header-controls">
                            <X className="control-icon" size={20} onClick={() => navigate('../')} />
                        </div>
                    </div>

                    {/* Pathology Type Selector */}
                    <div className="type-selector-grid">
                        {pathologyTypes.map((pathType) => {
                            const isSelected = selectedPathologyType === pathType.route;
                            return (
                                <button
                                    key={pathType.id}
                                    onClick={() => handleTypeChange(pathType)}
                                    className={`type-btn ${isSelected ? 'selected' : ''}`}
                                >
                                    {pathType.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Type-specific Options - Only shown when a type is selected */}
                    {renderOptions()}

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button className="action-btn monitor" onClick={() => handleAction('monitor')}>MONITOR</button>
                        <button className="action-btn treat" onClick={() => handleAction('treat')}>TREAT</button>
                        <button className="action-btn save" onClick={() => handleAction('save')}>SAVE</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToothPathology;
