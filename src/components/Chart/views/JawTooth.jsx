import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import ToothRenderer from '../ToothRenderer';
import WaveInteractiveView from '../../Tooth/WaveInteractiveView';
import { WaveInteractionModel } from '../../../models/WaveInteractionModel';
import { mapToothDataToConditions } from '../../../utils/toothUtils';
import PerioGrid from './PerioGrid';
import { TOOTH_TRANSFORMS } from './JawToothConfig';
import { useAppStore } from '../../../core/store/appStore';
import { isUpperJaw as checkIsUpperJaw } from '../../../utils/toothUtils';
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
    const isUpperJaw = checkIsUpperJaw(toothNumber);
    const { teeth, selectedPatient, showEndo, showPerio, showDental } = useAppStore();
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
            if (data && data.periodontal && data.periodontal.sites && data.periodontal.sites[key]) {
                return data.periodontal.sites[key];
            }
            return { probingDepth: 0, gingivalMargin: 0 };
        };

        const computeSite = (d, index) => {
            const offset = OFFSETS[index];
            return {
                pd: (d.probingDepth || 0) + offset,
                gm: Math.abs(d.gingivalMargin || 0) + offset
            };
        };

        const visualOrder = isUpperJaw 
            ? [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] 
            : [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
        const tNum = parseInt(toothNumber);
        const idx = visualOrder.indexOf(tNum);
        const leftT = idx > 0 ? visualOrder[idx - 1] : null;
        const rightT = idx < visualOrder.length - 1 ? visualOrder[idx + 1] : null;

        const leftToothData = leftT ? teeth[leftT] : null;
        const rightToothData = rightT ? teeth[rightT] : null;

        const getDataValues = (keys) => {
            const pd = [];
            const gm = [];
            keys.forEach((key, index) => {
                const d = getSiteData(toothData, key);
                const res = computeSite(d, index);
                pd.push(res.pd);
                gm.push(res.gm);
            });

            // left edge = average of left tooth's disto (index 2) and current tooth's mesio (index 0)
            const leftAdjacentSite = getSiteData(leftToothData, keys[2]);
            const leftAdjacentValues = computeSite(leftAdjacentSite, 2);
            const currentLeftSite = getSiteData(toothData, keys[0]);
            const currentLeftValues = computeSite(currentLeftSite, 0);

            // right edge = average of current tooth's disto (index 2) and right tooth's mesio (index 0)
            const rightAdjacentSite = getSiteData(rightToothData, keys[0]);
            const rightAdjacentValues = computeSite(rightAdjacentSite, 0);
            const currentRightSite = getSiteData(toothData, keys[2]);
            const currentRightValues = computeSite(currentRightSite, 2);

            return { 
                pd, gm, 
                leftPd: leftToothData ? (leftAdjacentValues.pd + currentLeftValues.pd) / 2 : currentLeftValues.pd, 
                leftGm: leftToothData ? (leftAdjacentValues.gm + currentLeftValues.gm) / 2 : currentLeftValues.gm,
                rightPd: rightToothData ? (rightAdjacentValues.pd + currentRightValues.pd) / 2 : currentRightValues.pd, 
                rightGm: rightToothData ? (rightAdjacentValues.gm + currentRightValues.gm) / 2 : currentRightValues.gm 
            };
        };

        const buccalKeys = ['mesioBuccal', 'buccal', 'distoBuccal'];
        const lingualKeys = ['mesioLingual', 'lingual', 'distoLingual'];

        models.buccal.setValues(getDataValues(buccalKeys));
        models.lingual.setValues(getDataValues(lingualKeys));

    }, [toothData, teeth, toothNumber, isUpperJaw, models, JSON.stringify(toothData?.periodontal?.sites)]);

    // Extract site data for PerioGrid
    const getSite = (key) => {
        return toothData?.periodontal?.sites?.[key] || {};
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
        if (!showPerioGrid || !showPerio) return null;

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

    const renderVisuals = () => {
        let activeConditions = mapToothDataToConditions(toothData, historicalDate, treatments);

        if (!showEndo) {
            activeConditions = activeConditions.filter(c => c.type !== 'endodontic');
        }

        if (!showDental) {
            activeConditions = activeConditions.filter(c => c.type === 'endodontic' || c.type === 'apical' || c.type === 'fracture');
        }

        return (
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
                        if (view === 'frontal') { // Top (Outside view of chart) -> Buccal
                            modelToUse = models.buccal;
                            waveDirection = 'down';
                            waveTopOffset = 25;
                        } else if (view === 'lingual') { // Bottom (Inside view of chart) -> Palatal (Lingual)
                            modelToUse = models.lingual;
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
                    const hasWave = showWaves && showPerio && modelToUse;

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
                                conditions={activeConditions}
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
    };

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
