import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import ToothRenderer from '../ToothRenderer';
import WaveInteractiveView from '../../Tooth/WaveInteractiveView';
import { WaveInteractionModel } from '../../../models/WaveInteractionModel';
import { mapToothDataToConditions } from '../../../utils/toothUtils';
import PerioGrid from './PerioGrid';
import { TOOTH_TRANSFORMS } from './JawToothConfig';
import { useAppStore } from '../../../core/store/appStore';
const JawTooth = ({
    toothNumber,
    toothData,
    views,
    onToothClick,
    isSelected,
    isDimmed,
    showPerioGrid = false,
    showPerioLabels = false,
    showNumberAtBottom = false,
    showWaves = true
}) => {
    // Determine if tooth is in upper or lower jaw
    const isUpperJaw = toothNumber >= 11 && toothNumber <= 28;
    const { selectedPatient } = useAppStore();
    const historicalDate = useAppStore(state => state.historicalDate);

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
    ) || toothData?.toBeExtracted;

    const [models] = useState({
        buccal: new WaveInteractionModel(),
        lingual: new WaveInteractionModel()
    });

    // Update models when data changes
    useEffect(() => {
        if (!toothData) return;

        const OFFSETS = [1, 2, 1];

        const getSiteData = (data, key) => {
            let actualKey = key;
            if (isUpperJaw) {
                if (key === 'distoLingual') actualKey = 'distoPalatal';
                if (key === 'lingual') actualKey = 'palatal';
                if (key === 'mesioLingual') actualKey = 'mesioPalatal';
            }
            if (data && data.periodontal && data.periodontal.sites && data.periodontal.sites[actualKey]) {
                return data.periodontal.sites[actualKey];
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

        models.buccal.setValues(getDataValues(buccalKeys));
        models.lingual.setValues(getDataValues(lingualKeys));

    }, [toothData, models, JSON.stringify(toothData?.periodontal?.sites)]);

    // Extract site data for PerioGrid
    const getSite = (key) => {
        let actualKey = key;
        if (isUpperJaw) {
            if (key === 'distoLingual') actualKey = 'distoPalatal';
            if (key === 'lingual') actualKey = 'palatal';
            if (key === 'mesioLingual') actualKey = 'mesioPalatal';
        }
        return toothData?.periodontal?.sites?.[actualKey] || {};
    };

    const buccalSites = [
        getSite('mesioBuccal'),
        getSite('buccal'),
        getSite('distoBuccal')
    ];

    const lingualSites = [
        getSite('mesioLingual'),
        getSite('lingual'),
        getSite('distoLingual')
    ];

    const renderPerioGrid = (sites) => {
        if (!showPerioGrid) return null;

        return (
            <div style={{ position: 'relative', width: '100%' }}>
                {showPerioLabels && (
                    <div style={{
                        position: 'absolute',
                        left: '-45px', // Padding from edge
                        top: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px', // Matches PerioGrid.css gap
                        zIndex: 10,
                        pointerEvents: 'none',
                        justifyContent: 'flex-start',
                        textAlign: 'left'
                    }}>
                        <span style={{ fontSize: '7px', lineHeight: '8px', height: '8px', color: '#3B82F6', fontWeight: 700, fontFamily: 'sans-serif' }}>PLAQUE</span>
                        <span style={{ fontSize: '7px', lineHeight: '8px', height: '8px', color: '#EF4444', fontWeight: 700, fontFamily: 'sans-serif' }}>BLEEDING</span>
                        <span style={{ fontSize: '7px', lineHeight: '8px', height: '8px', color: '#F59E0B', fontWeight: 700, fontFamily: 'sans-serif' }}>PUS</span>
                    </div>
                )}
                <PerioGrid sites={sites} />
            </div>
        );
    };

    const OverlapIcon = () => (
        <div className="extraction-overlap-icon" style={{
            position: 'absolute',
            bottom: '-10px', // Half of the 20px gap
            left: 0,
            width: '100%',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            height: 0,
            overflow: 'visible'
        }}>
            <div className="extraction-icon-container" style={{
                margin: 0,
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
                const isFirst = index === 0;
                const isLast = index === visualViews.length - 1;

                // const shouldShowWave = index === 0 || index === 2; // Original logic based on full index?

                let modelToUse = null;
                let waveDirection = 'down';
                let waveTopOffset = 0;
                let waveBottomOffset = 0;

                // Recover wave logic based on view type + jaw
                if (isUpperJaw) {
                    if (view === 'frontal') { // Top (Outside view of chart) -> Palatal
                        modelToUse = models.lingual;
                        waveDirection = 'down';
                        waveTopOffset = 25;
                    } else if (view === 'lingual') { // Bottom (Inside view of chart) -> Buccal
                        modelToUse = models.buccal;
                        waveDirection = 'up';
                        waveBottomOffset = -25;
                    }
                } else {
                    if (view === 'lingual') { // Top
                        modelToUse = models.lingual;
                        waveDirection = 'down';
                        waveTopOffset = 25;
                    } else if (view === 'frontal') { // Bottom
                        modelToUse = models.buccal;
                        waveDirection = 'up';
                        waveBottomOffset = -25;
                    }
                }

                // Check if this view should have a wave
                const hasWave = showWaves && modelToUse;

                // Rotation logic removed for lingual view
                // Actually existing logic was: `isLingual && index === 2`.
                // For Upper Jaw: Lingual is index 2. So yes.
                // For Lower Jaw: Lingual is index 0. No rotation.
                // So `isLingual && isUpperJaw` covers it.

                const transformConfig = TOOTH_TRANSFORMS[toothNumber]?.[view];
                const transformStyle = transformConfig ? {
                    transform: `translateY(${transformConfig.y || 0}px) rotate(${transformConfig.rotate || 0}deg)`
                } : {};

                const content = (
                    <div
                        className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                        style={transformStyle}
                        onClick={() => onToothClick(toothNumber)}
                    >
                        <ToothRenderer
                            toothNumber={toothNumber}
                            view={view}
                            conditions={mapToothDataToConditions(toothData, historicalDate, treatments)}
                            toothData={toothData}
                            historicalDate={historicalDate}
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

                const frameStyle = {};
                if (!isLast) {
                    frameStyle.bottom = '-10px';
                }
                if (!isFirst) {
                    frameStyle.top = '-10px';
                }

                return (
                    <React.Fragment key={view}>
                        <div className="view-stack">
                            {wrappedContent}
                            {isExtractionPlanned && <div className="extraction-frame-overlay" style={frameStyle} />}
                            {/* Render overlapping icon inside view-stack, absolutely positioned */}
                            {isExtractionPlanned && index < visualViews.length - 1 && (
                                <OverlapIcon />
                            )}
                        </div>
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
            {/* Perio Status Grid (Top) */}
            {/* Upper Jaw: Lingual(Palatal), Lower Jaw: Lingual */}
            {renderPerioGrid(isUpperJaw ? lingualSites : lingualSites)}

            {!numberIsLast && numberView && renderNumber()}

            {renderVisuals()}

            {numberIsLast && numberView && renderNumber()}

            {/* Perio Status Grid (Bottom) */}
            {/* Upper Jaw: Buccal, Lower Jaw: Buccal */}
            {renderPerioGrid(isUpperJaw ? buccalSites : buccalSites)}

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
