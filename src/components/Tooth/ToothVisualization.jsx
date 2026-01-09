import React, { useEffect, useRef, useMemo } from 'react';
import ToothRenderer from '../Chart/ToothRenderer';
import '../Chart/ChartOverview.css';
import './ToothVisualization.css';
import WaveInteractiveView from './WaveInteractiveView';
import useChartStore from '../../store/chartStore';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';

const ToothVisualization = ({ toothNumber, conditions, onSelectTooth }) => {
    const currentTooth = parseInt(toothNumber);
    const scrollRef = useRef(null);
    const toothData = useChartStore(state => state.teeth[currentTooth]);

    // Generate full list of teeth for the selector
    // Standard FDI order: Q1 (18-11), Q2 (21-28), Q3 (38-31), Q4 (41-48)
    const allTeeth = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        38, 37, 36, 35, 34, 33, 32, 31,
        41, 42, 43, 44, 45, 46, 47, 48
    ].sort((a, b) => a - b);

    // Auto-scroll to selected tooth
    useEffect(() => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.querySelector('.tooth-number-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [toothNumber]);

    // Determine if tooth is in upper or lower jaw
    const isUpperJaw = currentTooth >= 11 && currentTooth <= 28;

    // Define views based on jaw position (same as UpperJawView/LowerJawView)
    const views = isUpperJaw
        ? ['frontal', 'topview', 'lingual']  // Upper jaw order
        : ['lingual', 'topview', 'frontal']; // Lower jaw order

    const dataView = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    // Helper to get site data safely
    const getSiteData = (data, key) => {
        if (data && data.periodontal && data.periodontal.sites && data.periodontal.sites[key]) {
            return data.periodontal.sites[key];
        }
        return { probingDepth: 0, gingivalMargin: 0 };
    };

    // Prepare models for Buccal and Lingual views
    // We use useMemo but depend on the data values themselves so the model updates when data updates
    // Actually, WaveInteractionModel is stateful.
    // Ideally, we want the MODEL to be stable, but updated with values.
    // However, here we are largely READ-ONLY or at least reflecting the store.
    // If the store updates (from another component), we want the wave to update.
    // The WaveInteractiveView subscribes to the model. We need to update the model when store changes.

    const buccalKeys = ['mesioBuccal', 'buccal', 'distoBuccal'];
    const lingualKeys = ['mesioLingual', 'lingual', 'distoLingual'];

    // We can maintain two models ref/state that we update whenever toothData changes
    // Or we can recreate them. Recreating is cheaper given they are lightweight classes.
    // BUT WaveInteractiveView expects a stable model object to subscribe to.

    // Let's use a ref to hold stable models and update them.
    const buccalModel = useRef(new WaveInteractionModel()).current;
    const lingualModel = useRef(new WaveInteractionModel()).current;

    useEffect(() => {
        if (!toothData) return;

        const OFFSETS = [1, 2, 1];

        const getDataValues = (keys) => {
            const pd = [];
            const gm = [];
            keys.forEach((key, index) => {
                const d = getSiteData(toothData, key);
                const offset = OFFSETS[index];
                pd.push((d.probingDepth || 0) + offset);
                gm.push(Math.abs(d.gingivalMargin || 0) + offset);
            });
            return { pd, gm };
        };

        buccalModel.setValues(getDataValues(buccalKeys));
        lingualModel.setValues(getDataValues(lingualKeys));

    }, [toothData]); // Update models when toothData changes


    return (
        <div className="tooth-visualization-container">

            <div className="tooth-selector-column" ref={scrollRef}>
                {allTeeth.map((num) => (
                    <div
                        key={num}
                        className={`tooth-number-item ${num === currentTooth ? 'active' : ''}`}
                        onClick={() => onSelectTooth(num)}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Visualization Column - uses exact jaw view structure */}
            <div className="visualization-column" data-view={dataView}>
                <div className="jaw-box">
                    <ol className="jaw" data-type={isUpperJaw ? 'upper' : 'lower'}>
                        <li className="tooth" data-number={currentTooth}>
                            {views.map((view, index) => {
                                const isBuccal = view === 'frontal';
                                const isLingual = view === 'lingual';
                                const isOcclusal = !isBuccal && !isLingual;

                                // We want to wrap the top and bottom views (index 0 and 2) with the Wave Interactive View
                                const shouldShowWave = index === 0 || index === 2;

                                // Determine image orientation:
                                // "Tip fixed towards center"
                                // Index 0 (Top): Should have Crown Down.
                                // Index 2 (Bottom): Should have Crown Up.
                                //
                                // Upper Jaw: [Frontal, TopView, Lingual]
                                // - Frontal (0): Root Up / Crown Down. Matches.
                                // - Lingual (2): Root Up / Crown Down. NEEDS FLIP -> Crown Up.
                                //
                                // Lower Jaw: [Lingual, TopView, Frontal]
                                // - Lingual (0): Root Down / Crown Up. NEEDS FLIP -> Crown Down.
                                // - Frontal (2): Root Down / Crown Up. Matches.

                                const needsRotation = isLingual && index === 2;

                                // Wave Direction:
                                // Index 0 (Top): Wave Peak towards Center (Down).
                                // Index 2 (Bottom): Wave Peak towards Center (Up).
                                const waveDirection = index === 0 ? 'down' : 'up';

                                // Determine which model to use
                                // Upper Jaw: [Frontal (Buccal), Top, Lingual]
                                // Lower Jaw: [Lingual, Top, Frontal (Buccal)]
                                let modelToUse = null;
                                if (isUpperJaw) {
                                    if (index === 0) modelToUse = buccalModel; // Frontal
                                    if (index === 2) modelToUse = lingualModel; // Lingual
                                } else {
                                    if (index === 0) modelToUse = lingualModel; // Lingual
                                    if (index === 2) modelToUse = buccalModel; // Frontal
                                }

                                const content = (
                                    <div
                                        key={view}
                                        className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                                        style={needsRotation ? { transform: 'rotate(180deg)' } : {}}
                                    >
                                        <ToothRenderer
                                            toothNumber={toothNumber}
                                            view={view}
                                            conditions={conditions}
                                            interactive={false}
                                        />
                                    </div>
                                );

                                if (shouldShowWave) {
                                    return (
                                        <WaveInteractiveView
                                            key={view}
                                            viewType={view}
                                            direction={waveDirection}
                                            model={modelToUse}
                                        >
                                            {content}
                                        </WaveInteractiveView>
                                    );
                                }

                                return content;
                            })}
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default ToothVisualization;
