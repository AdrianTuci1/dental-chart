import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Volume2 } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import ToothZones from './ToothZones';
import './ToothRestoration.css';

const ToothRestoration = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();

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

    const handleSave = () => {
        if (!tooth) return;

        // Update tooth restoration based on current type
        const updatedRestoration = { ...tooth.restoration };

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial && fillingQuality) {
                    const newFilling = {
                        zones: selectedZones,
                        material: fillingMaterial,
                        quality: fillingQuality
                    };
                    updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
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
                }
                break;
        }

        updateTooth(tooth.toothNumber, { restoration: updatedRestoration });

        // Reset selections
        resetAllStates();

        // Navigate back to overview
        navigate('../');
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
                <ToothZones
                    selectedZones={selectedZones}
                    onChange={setSelectedZones}
                    inactive={false}
                    toothNumber={tooth?.toothNumber}
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
                        <button className="action-btn monitor">MONITOR</button>
                        <button className="action-btn treat">TREAT</button>
                        <button className="action-btn save" onClick={handleSave}>SAVE</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToothRestoration;
