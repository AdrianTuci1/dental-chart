import React, { useRef, useEffect } from 'react';
import ToothRenderer from '../ToothRenderer';
import WaveInteractiveView from '../../Tooth/WaveInteractiveView';
import { WaveInteractionModel } from '../../../models/WaveInteractionModel';
import { mapToothDataToConditions } from '../../../utils/toothUtils';
import PerioGrid from './PerioGrid';

const JawTooth = ({
    toothNumber,
    toothData,
    views,
    onToothClick,
    isSelected,
    isDimmed,
    showPerioGrid = false,
    showNumberAtBottom = false
}) => {
    // Determine if tooth is in upper or lower jaw
    const isUpperJaw = toothNumber >= 11 && toothNumber <= 28;

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

    return (
        <li className={`tooth ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`} data-number={toothNumber}>
            {/* Perio Status Grid (Top) */}
            {perioGrid}

            {views.map((view, index) => {
                if (view === 'number') {
                    return (
                        <span key="number" className="number" onClick={() => onToothClick(toothNumber)}>
                            {toothNumber}
                        </span>
                    );
                }

                const isBuccal = view === 'frontal';
                const isLingual = view === 'lingual';
                const isOcclusal = view === 'topview';

                // Determine if we should show the wave view
                // We wrap the top (index 0) and bottom (index 2) views
                const shouldShowWave = index === 0 || index === 2;

                // Determine rotation:
                // Matches ToothVisualization logic:
                // Upper Lingual (Index 2) -> needs rotation (Crown Down to Crown Up)
                const needsRotation = isLingual && index === 2;

                // Wave Direction:
                // Index 0 (Top) -> 'down'
                // Index 2 (Bottom) -> 'up'
                const waveDirection = index === 0 ? 'down' : 'up';

                // Determine which model to use
                let modelToUse = null;

                // Allow wave if it's strictly buccal or lingual
                if (shouldShowWave) {
                    if (isBuccal) modelToUse = buccalModel;
                    if (isLingual) modelToUse = lingualModel;
                }

                // Render Content
                const content = (
                    <div
                        key={view}
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

                // Define independent offsets for top and bottom waves
                // Index 0: Top View -> pushing down by 50px (example based on user intent)
                // Index 2: Bottom View -> default 0px
                const waveTopOffset = index === 0 ? 25 : 0;
                const waveBottomOffset = index === 2 ? -25 : 0;

                if (shouldShowWave && modelToUse) {
                    return (
                        <WaveInteractiveView
                            key={view}
                            viewType={view}
                            direction={waveDirection}
                            model={modelToUse}
                            onClick={() => onToothClick(toothNumber)}
                            topOffset={waveTopOffset}
                            bottomOffset={waveBottomOffset}
                        >
                            {content}
                        </WaveInteractiveView>
                    );
                }

                return content;
            })}

            {/* Perio Status Grid (Bottom) */}
            {perioGrid}

            {/* Tooth Number (Bottom) - Conditional */}
            {showNumberAtBottom && (
                <span className="number" onClick={() => onToothClick(toothNumber)}>
                    {toothNumber}
                </span>
            )}
        </li>
    );
};

export default JawTooth;

