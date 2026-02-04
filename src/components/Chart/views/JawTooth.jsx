import React, { useRef, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import ToothRenderer from '../ToothRenderer';
import WaveInteractiveView from '../../Tooth/WaveInteractiveView';
import { WaveInteractionModel } from '../../../models/WaveInteractionModel';
import { mapToothDataToConditions } from '../../../utils/toothUtils';
import PerioGrid from './PerioGrid';
import usePatientStore from '../../../store/patientStore';


const JawTooth = ({
    toothNumber,
    toothData,
    views,
    onToothClick,
    isSelected,
    isDimmed,
    showPerioGrid = false,
    showNumberAtBottom = false,
    showWaves = true
}) => {
    // Determine if tooth is in upper or lower jaw
    const isUpperJaw = toothNumber >= 11 && toothNumber <= 28;
    const { selectedPatient } = usePatientStore();

    // Determine status class
    const treatments = selectedPatient?.treatmentPlan?.items?.filter(item => parseInt(item.tooth) === parseInt(toothNumber)) || [];
    let statusClass = '';
    if (treatments.some(t => t.status === 'planned')) {
        statusClass = 'status-planned';
    } else if (treatments.some(t => t.status === 'monitoring')) {
        statusClass = 'status-monitoring';
    }

    const isExtractionPlanned = treatments.some(
        item => item.procedure === 'Extraction' && item.status === 'planned'
    );

    // Use refs to hold stable models
    const buccalModel = useRef(new WaveInteractionModel()).current;
    const lingualModel = useRef(new WaveInteractionModel()).current;

    // Update models when data changes
    useEffect(() => {
        if (!toothData) return;

        const OFFSETS = [1, 2, 1];

        const getSiteData = (data, key) => {
            if (data && data.periodontal && data.periodontal.sites && data.periodontal.sites[key]) {
                return data.periodontal.sites[key];
            }
            return { probingDepth: 0, gingivalMargin: 0 };
        };

        const getDataValues = (keys) => {
            const pd = [];
            const gm = [];
            keys.forEach((key, index) => {
                const d = getSiteData(toothData, key);
                const offset = OFFSETS[index];
                pd.push((d.probingDepth || 0) + offset);
                // Math.abs used in ToothVisualization
                gm.push(Math.abs(d.gingivalMargin || 0) + offset);
            });
            return { pd, gm };
        };

        const buccalKeys = ['mesioBuccal', 'buccal', 'distoBuccal'];
        const lingualKeys = ['mesioLingual', 'lingual', 'distoLingual'];

        buccalModel.setValues(getDataValues(buccalKeys));
        lingualModel.setValues(getDataValues(lingualKeys));

    }, [toothData]);

    // Extract site data for PerioGrid
    const getSite = (key) => toothData?.periodontal?.sites?.[key] || {};

    // Choose sites based on the top-most view in the stack to match visual context
    // Upper Jaw: Frontal (Buccal) is top.
    // Lower Jaw: Lingual is top.
    // However, for consistency we default to Buccal (outer) sites as the 'primary' status unless specified.
    // Using Buccal for both for now.
    const perioSites = [
        getSite('mesioBuccal'),
        getSite('buccal'),
        getSite('distoBuccal')
    ];

    const perioGrid = showPerioGrid && <PerioGrid sites={perioSites} />;

    const OverlapIcon = () => (
        <div className="extraction-overlap-icon" style={{
            height: 0,
            width: '100%',
            position: 'relative',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center'
        }}>
            <div className="extraction-icon-container" style={{
                margin: 0,
                position: 'absolute',
                top: 0,
                transform: 'translateY(-50%)'
            }}>
                <div className="extraction-icon">
                    <Hourglass />
                </div>
            </div>
        </div>
    );

    // Separate number view from others to handle wrapping
    const numberView = views.find(v => v === 'number');
    const visualViews = views.filter(v => v !== 'number');

    const renderNumber = () => (
        <span key="number" className={`number ${statusClass}`} onClick={() => onToothClick(toothNumber)}>
            {toothNumber}
        </span>
    );

    const renderVisuals = () => (
        <div className="visuals-container">
            {visualViews.map((view, index) => {
                const isBuccal = view === 'frontal';
                const isLingual = view === 'lingual';
                const isOcclusal = view === 'topview';

                const shouldShowWave = index === 0 || index === 2; // Original logic based on full index?
                // Visual views length is 2 or 3.
                // We need to map `index` from visualViews to original context for Wave Logic?
                // Wave Logic relies on index 0 (Top) and index 2 (Bottom).
                // If we excluded 'number', the indices shift.
                // Let's rely on View Type for Wave Logic instead of Index.
                // Upper: Frontal (0), Top (1), Lingual (2). -> Wave on Frontal (down) and Lingual (up).
                // Lower: Lingual (0), Top (1), Frontal (2). -> Wave on Lingual (down) and Frontal (up).
                // Normal Upper: Frontal (0), Top (1). (Number was 2). -> Wave on Frontal (down). And... nothing on bottom?
                // Normal View usually matches JawView logic but Number is inserted.
                // Let's preserve `index` logic by checking `view` against original `views` array?
                // Or:
                // Frontal is always "Outside". Lingual is "Inside".
                // If Upper: Frontal is Top (Wave Down). Lingual is Bottom (Wave Up).
                // If Lower: Lingual is Top (Wave Down). Frontal is Bottom (Wave Up).

                let modelToUse = null;
                let waveDirection = 'down';
                let waveTopOffset = 0;
                let waveBottomOffset = 0;

                // Recover wave logic based on view type + jaw
                if (isUpperJaw) {
                    if (view === 'frontal') { // Top
                        modelToUse = buccalModel;
                        waveDirection = 'down';
                        waveTopOffset = 25;
                    } else if (view === 'lingual') { // Bottom
                        modelToUse = lingualModel;
                        waveDirection = 'up';
                        waveBottomOffset = -25;
                    }
                } else {
                    if (view === 'lingual') { // Top
                        modelToUse = lingualModel;
                        waveDirection = 'down';
                        waveTopOffset = 25;
                    } else if (view === 'frontal') { // Bottom
                        modelToUse = buccalModel;
                        waveDirection = 'up';
                        waveBottomOffset = -25;
                    }
                }

                // Check if this view should have a wave
                const hasWave = showWaves && modelToUse;

                const needsRotation = isLingual && (isUpperJaw ? true : false); // Example based on observation
                // Actually existing logic was: `isLingual && index === 2`.
                // For Upper Jaw: Lingual is index 2. So yes.
                // For Lower Jaw: Lingual is index 0. No rotation.
                // So `isLingual && isUpperJaw` covers it.

                const content = (
                    <div
                        className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                        style={needsRotation ? { transform: 'rotate(180deg)' } : {}}
                        onClick={() => onToothClick(toothNumber)}
                    >
                        <ToothRenderer
                            toothNumber={toothNumber}
                            view={view}
                            conditions={mapToothDataToConditions(toothData)}
                            toothData={toothData}
                            interactive={true}
                            onSurfaceClick={(surface) => console.log(`Clicked surface ${surface} on tooth ${toothNumber}`)}
                        />
                        {isSelected && isBuccal && (
                            <div className="selection-overlay">
                                <div className="checkmark-circle">
                                    ✓
                                </div>
                            </div>
                        )}
                    </div>
                );

                const wrappedContent = hasWave ? (
                    <WaveInteractiveView
                        viewType={view}
                        direction={waveDirection}
                        model={modelToUse}
                        onClick={() => onToothClick(toothNumber)}
                        topOffset={waveTopOffset}
                        bottomOffset={waveBottomOffset}
                    >
                        {content}
                    </WaveInteractiveView>
                ) : content;

                return (
                    <React.Fragment key={view}>
                        <div className="view-stack">
                            {wrappedContent}
                            {isExtractionPlanned && <div className="extraction-frame-overlay" />}
                        </div>
                        {/* Render overlapping icon at the intersection */}
                        {isExtractionPlanned && index < visualViews.length - 1 && (
                            <OverlapIcon />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    // Determine render order based on original views array presence
    // Upper Normal: visual, number
    // Lower Normal: number, visual
    const numberIsLast = views[views.length - 1] === 'number';

    return (
        <div className={`tooth ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`} data-number={toothNumber}>
            {/* Perio Status Grid (Top - Visual only? usually outside visuals) */}
            {perioGrid}

            {!numberIsLast && numberView && renderNumber()}

            {renderVisuals()}

            {numberIsLast && numberView && renderNumber()}

            {/* Perio Status Grid (Bottom) */}
            {perioGrid}

            {/* Tooth Number (Bottom) - Conditional Prop */}
            {showNumberAtBottom && !numberView && (
                <span className={`number ${statusClass}`} onClick={() => onToothClick(toothNumber)}>
                    {toothNumber}
                </span>
            )}
        </div>
    );
};

export default JawTooth;
