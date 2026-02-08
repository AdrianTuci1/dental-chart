import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import usePatientStore from '../../store/patientStore';
import ToothZones from './ToothZones';
import './ToothRestoration.css';

const ToothRestoration = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();
    const { selectedPatient, addTreatmentPlanItem, addToHistory } = usePatientStore();

    // Track if a restoration type is selected (null means none selected)
    const [selectedRestorationType, setSelectedRestorationType] = useState(type || null);

    const restorationTypes = [
        { id: 'filling', label: 'Filling', route: 'filling' },
        { id: 'veneer', label: 'Veneer', route: 'veneer' },
        { id: 'crown', label: 'Crown', route: 'crown' },
    ];

    const [selectedZones, setSelectedZones] = useState([]);

    // Filling states
    const [fillingMaterial, setFillingMaterial] = useState(null);
    const [fillingQuality, setFillingQuality] = useState(null);

    // Veneer states
    const [veneerMaterial, setVeneerMaterial] = useState(null);
    const [veneerQuality, setVeneerQuality] = useState(null);
    const [veneerDetail, setVeneerDetail] = useState(null);

    // Crown states
    const [crownMaterial, setCrownMaterial] = useState(null);
    const [crownType, setCrownType] = useState(null);
    const [crownBase, setCrownBase] = useState(null);
    const [implantType, setImplantType] = useState(null);

    const handleTypeChange = (restType) => {
        if (selectedRestorationType === restType.route) {
            // Deselect if clicking the same button
            setSelectedRestorationType(null);
            navigate('../restoration');
            // Reset all states
            resetAllStates();
        } else {
            // Select new restoration type
            setSelectedRestorationType(restType.route);
            navigate(`../restoration/${restType.route}`);
            // Reset all states when changing type
            resetAllStates();
        }
    };

    const { setPreviewData } = useOutletContext();

    const resetAllStates = () => {
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
    };

    // Effect for Real-time Preview
    React.useEffect(() => {
        if (!tooth || !setPreviewData) return;

        if (!selectedRestorationType) {
            setPreviewData(null);
            return;
        }

        const previewRestoration = JSON.parse(JSON.stringify(tooth.restoration || {}));
        let isValidPreview = false;

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial || selectedZones.length > 0) {
                    const newFilling = {
                        zones: selectedZones,
                        material: fillingMaterial || 'Unknown',
                        quality: fillingQuality || 'Sufficient'
                    };
                    previewRestoration.fillings = [...(previewRestoration.fillings || []), newFilling];
                    isValidPreview = true;
                }
                break;
            case 'veneer':
                if (veneerMaterial || selectedZones.length > 0) {
                    const newVeneer = {
                        zones: selectedZones,
                        material: veneerMaterial || 'Unknown',
                        quality: veneerQuality || 'Sufficient',
                        detail: veneerDetail || 'Flush'
                    };
                    if (!previewRestoration.veneers) previewRestoration.veneers = [];
                    previewRestoration.veneers = [...previewRestoration.veneers, newVeneer];
                    isValidPreview = true;
                }
                break;
            case 'crown':
                if (crownMaterial) {
                    const newCrown = {
                        material: crownMaterial,
                        quality: 'Sufficient',
                        type: crownType || 'Single Crown',
                        base: crownBase || 'Natural'
                    };
                    if (crownBase === 'Implant' && implantType) {
                        newCrown.implantType = implantType;
                    }
                    previewRestoration.crowns = [...(previewRestoration.crowns || []), newCrown];
                    isValidPreview = true;
                }
                break;
        }

        if (isValidPreview) {
            setPreviewData({
                ...tooth,
                restoration: previewRestoration
            });
        } else {
            setPreviewData(null);
        }

    }, [
        tooth,
        selectedRestorationType,
        selectedZones,
        fillingMaterial,
        fillingQuality,
        veneerMaterial,
        veneerQuality,
        veneerDetail,
        crownMaterial,
        crownType,
        crownBase,
        implantType,
        setPreviewData
    ]);

    // Cleanup preview
    React.useEffect(() => {
        return () => {
            if (setPreviewData) setPreviewData(null);
        };
    }, [setPreviewData]);

    const handleAction = (actionType) => {
        if (!tooth || !selectedPatient) return;

        const parts = [];
        const typeLabel = restorationTypes.find(t => t.route === selectedRestorationType)?.label;
        if (typeLabel) parts.push(typeLabel);

        if (selectedRestorationType === 'filling') {
            if (fillingMaterial) parts.push(fillingMaterial);
            if (fillingQuality) parts.push(fillingQuality);
            if (selectedZones.length > 0) parts.push(selectedZones.join(', '));
        } else if (selectedRestorationType === 'veneer') {
            if (veneerMaterial) parts.push(veneerMaterial);
            if (veneerQuality) parts.push(veneerQuality);
            if (veneerDetail) parts.push(veneerDetail);
            if (selectedZones.length > 0) parts.push(selectedZones.join(', '));
        } else if (selectedRestorationType === 'crown') {
            if (crownMaterial) parts.push(crownMaterial);
            if (crownType) parts.push(crownType);
            if (crownBase) parts.push(crownBase);
            if (implantType) parts.push(implantType);
        }

        const procedure = parts.join(', ');
        if (parts.length <= 1 && actionType !== 'save') return;

        const baseItem = {
            procedure,
            tooth: tooth.toothNumber,
            cost: actionType === 'monitor' ? 100 : 400,
            priority: actionType === 'monitor' ? 'low' : 'high'
        };

        if (actionType === 'monitor' || actionType === 'treat') {
            addTreatmentPlanItem(selectedPatient.id, {
                ...baseItem,
                status: actionType === 'monitor' ? 'monitoring' : 'planned'
            });
        } else if (actionType === 'save') {
            handleSave(true);
            addToHistory(selectedPatient.id, {
                description: procedure,
                provider: 'Dr. Current',
                tooth: tooth.toothNumber
            });
        }

        navigate('../');
    };

    const handleSave = (silent = false) => {
        if (!tooth) return;

        // Update tooth restoration based on current type
        const updatedRestoration = { ...tooth.restoration };
        let hasChanges = false;

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial && fillingQuality) {
                    const newFilling = {
                        zones: selectedZones,
                        material: fillingMaterial,
                        quality: fillingQuality
                    };
                    updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
                    hasChanges = true;
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
                    // Add veneers array if it doesn't exist
                    if (!updatedRestoration.veneers) {
                        updatedRestoration.veneers = [];
                    }
                    updatedRestoration.veneers = [...updatedRestoration.veneers, newVeneer];
                    hasChanges = true;
                }
                break;
            case 'crown':
                if (crownMaterial && crownType && crownBase) {
                    const newCrown = {
                        material: crownMaterial,
                        quality: 'Sufficient', // Default quality
                        type: crownType,
                        base: crownBase
                    };
                    // Add implant type if base is implant
                    if (crownBase === 'Implant' && implantType) {
                        newCrown.implantType = implantType;
                    }
                    updatedRestoration.crowns = [...(updatedRestoration.crowns || []), newCrown];
                    hasChanges = true;
                }
                break;
        }

        if (hasChanges) {
            updateTooth(tooth.toothNumber, { restoration: updatedRestoration });
        }

        // Reset selections
        resetAllStates();

        // Navigate back to overview if not silent
        if (!silent) {
            navigate('../');
        }
    };

    const renderFillingOptions = () => (
        <div className="restoration-options">
            {/* Step 1: Select Material */}
            <div className="option-group">
                <h3 className="option-label">Material</h3>
                <div className="button-row">
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(material => (
                        <button
                            key={material}
                            className={`option-btn ${fillingMaterial === material ? 'active' : ''}`}
                            onClick={() => {
                                setFillingMaterial(material);
                                setFillingQuality(null);
                            }}
                        >
                            {material}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Show Quality only if material is selected */}
            {fillingMaterial && (
                <div className="option-group">
                    <h3 className="option-label">Quality</h3>
                    <div className="button-row">
                        {['Sufficient', 'Uncertain', 'Insufficient'].map(quality => (
                            <button
                                key={quality}
                                className={`option-btn ${fillingQuality === quality ? 'active' : ''}`}
                                onClick={() => setFillingQuality(quality)}
                            >
                                {quality}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderVeneerOptions = () => (
        <div className="restoration-options">
            {/* Step 1: Select Material */}
            <div className="option-group">
                <h3 className="option-label">Material</h3>
                <div className="button-row">
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(material => (
                        <button
                            key={material}
                            className={`option-btn ${veneerMaterial === material ? 'active' : ''}`}
                            onClick={() => {
                                setVeneerMaterial(material);
                                setVeneerQuality(null);
                                setVeneerDetail(null);
                            }}
                        >
                            {material}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Show Quality only if material is selected */}
            {veneerMaterial && (
                <div className="option-group">
                    <h3 className="option-label">Quality</h3>
                    <div className="button-row">
                        {['Sufficient', 'Uncertain', 'Insufficient'].map(quality => (
                            <button
                                key={quality}
                                className={`option-btn ${veneerQuality === quality ? 'active' : ''}`}
                                onClick={() => {
                                    setVeneerQuality(quality);
                                    setVeneerDetail(null);
                                }}
                            >
                                {quality}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Show Detail only if quality is selected */}
            {veneerMaterial && veneerQuality && (
                <div className="option-group">
                    <h3 className="option-label">Detail</h3>
                    <div className="button-row">
                        {['Overhang', 'Flush', 'Shortfall'].map(detail => (
                            <button
                                key={detail}
                                className={`option-btn ${veneerDetail === detail ? 'active' : ''}`}
                                onClick={() => setVeneerDetail(detail)}
                            >
                                {detail}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderCrownOptions = () => (
        <div className="restoration-options">
            {/* Step 1: Select Material */}
            <div className="option-group">
                <h3 className="option-label">Material</h3>
                <div className="button-row">
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(material => (
                        <button
                            key={material}
                            className={`option-btn ${crownMaterial === material ? 'active' : ''}`}
                            onClick={() => {
                                setCrownMaterial(material);
                                setCrownType(null);
                                setCrownBase(null);
                                setImplantType(null);
                            }}
                        >
                            {material}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Show Crown Type only if material is selected */}
            {crownMaterial && (
                <div className="option-group">
                    <h3 className="option-label">Crown Type</h3>
                    <div className="button-row">
                        {['Single Crown', 'Abutment', 'Pontic'].map(type => (
                            <button
                                key={type}
                                className={`option-btn ${crownType === type ? 'active' : ''}`}
                                onClick={() => {
                                    setCrownType(type);
                                    setCrownBase(null);
                                    setImplantType(null);
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Show Crown Base only if crown type is selected */}
            {crownMaterial && crownType && (
                <div className="option-group">
                    <h3 className="option-label">Crown Base</h3>
                    <div className="button-row">
                        {['Natural', 'Implant'].map(base => (
                            <button
                                key={base}
                                className={`option-btn ${crownBase === base ? 'active' : ''}`}
                                onClick={() => {
                                    setCrownBase(base);
                                    setImplantType(null);
                                }}
                            >
                                {base}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Show Implant Type only if crown base is Implant */}
            {crownMaterial && crownType && crownBase === 'Implant' && (
                <div className="option-group">
                    <h3 className="option-label">Implant Type</h3>
                    <div className="button-row">
                        {['Bone Level', 'Tissue Level'].map(type => (
                            <button
                                key={type}
                                className={`option-btn ${implantType === type ? 'active' : ''}`}
                                onClick={() => setImplantType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderOptions = () => {
        // Only render options if a restoration type is selected
        if (!selectedRestorationType) {
            return null;
        }

        switch (selectedRestorationType) {
            case 'filling':
                return renderFillingOptions();
            case 'veneer':
                return renderVeneerOptions();
            case 'crown':
                return renderCrownOptions();
            default:
                return null;
        }
    };

    return (
        <div className="restoration-container" data-view="restoration">
            <div className="restoration-content">
                {/* Tooth Zones - Left Column - Only for veneer */}
                {/* Tooth Zones - Left Column - Only for veneer */}
                <ToothZones
                    selectedZones={selectedZones}
                    onChange={setSelectedZones}
                    inactive={false}
                    toothNumber={tooth?.toothNumber}
                    zoneColor={(() => {
                        const material = fillingMaterial || veneerMaterial || crownMaterial;
                        switch (material) {
                            case 'Gold': return '#FFD700'; // Gold
                            case 'Amalgam': return '#9CA3AF'; // Gray-400
                            case 'Non-Precious Metal': return '#9CA3AF'; // Gray-400
                            case 'Ceramic': return '#A5F3FC'; // Cyan-200 (light blue/white-ish)
                            case 'Composite': return '#3B82F6'; // Blue-500
                            default: return '#3B82F6'; // Default Blue
                        }
                    })()}
                />

                {/* Main Content - Right Column */}
                <div className="restoration-main">
                    {/* Header */}
                    <div className="restoration-header">
                        <h2 className="restoration-title">Restoration</h2>
                        <div className="header-controls">
                            <Volume2 className="control-icon" size={20} />
                            <X className="control-icon" size={20} onClick={() => navigate('../')} />
                        </div>
                    </div>

                    {/* Restoration Type Selector */}
                    <div className="type-selector-grid">
                        {restorationTypes.map((restType) => {
                            const isSelected = selectedRestorationType === restType.route;
                            return (
                                <button
                                    key={restType.id}
                                    onClick={() => handleTypeChange(restType)}
                                    className={`type-btn ${isSelected ? 'selected' : ''}`}
                                >
                                    {restType.label}
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

export default ToothRestoration;
