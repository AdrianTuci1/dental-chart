import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import ToothZones from './ToothZones';
import './ToothPathology.css';

const ToothPathology = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();

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

    const handleSave = () => {
        if (!tooth) return;

        // Update tooth pathology based on current type
        const updatedPathology = { ...tooth.pathology };

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0 && decayMaterial && cavitation && cavitationLevel) {
                    const newDecay = {
                        type: `${decayMaterial}-${cavitation}-${cavitationLevel}`,
                        zones: selectedZones
                    };
                    updatedPathology.decay = [...(updatedPathology.decay || []), newDecay];
                }
                break;
            case 'fracture':
                if (fractureLocation === 'crown') {
                    updatedPathology.fracture.crown = true;
                } else if (fractureLocation === 'root' && fractureDirection) {
                    updatedPathology.fracture.root = fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal';
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

        updateTooth(tooth.toothNumber, { pathology: updatedPathology });

        // Reset selections
        setSelectedZones([]);
        resetAllStates();

        // Navigate back to overview
        navigate('../');
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
                {/* Tooth Zones - Left Column */}
                <ToothZones
                    selectedZones={selectedZones}
                    onChange={setSelectedZones}
                    inactive={selectedPathologyType !== 'decay'}
                />

                {/* Main Content - Right Column */}
                <div className="pathology-main">
                    {/* Header */}
                    <div className="pathology-header">
                        <h2 className="pathology-title">Pathology</h2>
                        <div className="header-controls">
                            <Volume2 className="control-icon" size={20} />
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
                        <button className="action-btn monitor">MONITOR</button>
                        <button className="action-btn treat">TREAT</button>
                        <button className="action-btn save" onClick={handleSave}>SAVE</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToothPathology;
