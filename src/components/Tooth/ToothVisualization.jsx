import React, { useEffect, useRef, useState } from 'react';
import ToothRenderer from '../Chart/ToothRenderer';
import '../Chart/ChartOverview.css';
import './ToothVisualization.css';
import WaveInteractiveView from './WaveInteractiveView';
import { useAppStore } from '../../core/store/appStore';
import { AppFacade } from '../../core/AppFacade';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';
import { mapToothDataToConditions, isUpperJaw } from '../../utils/toothUtils';

const ALL_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38
];

const ToothItem = ({ toothNumber, toothData, isSelected, onSelectTooth, treatments = [] }) => {
    const isUpper = isUpperJaw(toothNumber);
    const views = isUpper
        ? ['frontal', 'topview', 'lingual']
        : ['lingual', 'topview', 'frontal'];

    const OFFSETS = [1, 2, 1];
    const getSiteData = (data, key) => (data?.periodontal?.sites?.[key] || { probingDepth: 0, gingivalMargin: 0 });

    const getDataValues = (keys) => {
        const pd = [];
        const gm = [];
        keys.forEach((key, index) => {
            const d = getSiteData(toothData, key);
            pd.push((d.probingDepth || 0) + OFFSETS[index]);
            gm.push(Math.abs(d.gingivalMargin || 0) + OFFSETS[index]);
        });
        return { pd, gm };
    };

    const models = React.useMemo(() => {
        const buccalModel = new WaveInteractionModel();
        const lingualModel = new WaveInteractionModel();

        if (toothData) {
            buccalModel.setValues(getDataValues(['mesioBuccal', 'buccal', 'distoBuccal']));
            lingualModel.setValues(getDataValues(['mesioLingual', 'lingual', 'distoLingual']));
        }
        return { buccal: buccalModel, lingual: lingualModel };
    }, [toothData]);

    return (
        <div className={`tooth-item-container ${isSelected ? 'active-tooth' : ''}`} data-number={toothNumber}>
            <ol className="jaw" data-type={isUpper ? 'upper' : 'lower'}>
                <li className="tooth" data-number={toothNumber}>
                    {views.map((view, index) => {
                        const isBuccal = view === 'frontal';
                        const isLingual = view === 'lingual';
                        const shouldShowWave = index === 0 || index === 2;
                        const needsRotation = isLingual && index === 2;
                        const waveDirection = index === 0 ? 'down' : 'up';

                        const useBuccal = index === 0;
                        const useLingual = index === 2;

                        let modelToUse = null;
                        if (isUpper) {
                            if (useBuccal) modelToUse = models.buccal;
                            else if (useLingual) modelToUse = models.lingual;
                        } else {
                            if (useBuccal) modelToUse = models.lingual;
                            else if (useLingual) modelToUse = models.buccal;
                        }

                        const transformStyle = needsRotation
                            ? { transform: 'rotate(180deg) scale(0.6)' }
                            : { transform: 'scale(0.6)' };

                        const content = (
                            <div
                                className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                                style={transformStyle}
                                onClick={() => onSelectTooth(toothNumber)}
                            >
                                <ToothRenderer
                                    toothNumber={toothNumber}
                                    toothData={toothData}
                                    view={view}
                                    conditions={mapToothDataToConditions(toothData, null, treatments)}
                                    interactive={false}
                                    className="no-scale"
                                />
                            </div>
                        );

                        const viewContent = shouldShowWave ? (
                            <WaveInteractiveView
                                direction={waveDirection}
                                model={modelToUse}
                                topOffset={index === 0 ? 10 : 0}
                                bottomOffset={index === 2 ? -10 : 0}
                            >
                                {content}
                            </WaveInteractiveView>
                        ) : content;

                        return (
                            <React.Fragment key={view}>
                                {viewContent}
                            </React.Fragment>
                        );
                    })}
                </li>
            </ol>
        </div>
    );
};

const ToothVisualization = ({ toothNumber, onSelectTooth, overrideToothData }) => {
    const currentTooth = parseInt(toothNumber);
    const sidebarScrollRef = useRef(null);
    const teeth = useAppStore(state => state.teeth);
    const { selectedPatient } = useAppStore();

    console.log(`[ToothVisualization] Render! Current tooth data:`, teeth[currentTooth]?.periodontal?.sites);

    const [displayState, setDisplayState] = useState({
        teeth: [currentTooth],
        transform: 'translateY(0)',
        transition: 'none'
    });
    const prevToothRef = useRef(currentTooth);

    // Sidebar scroll sync
    useEffect(() => {
        if (sidebarScrollRef.current) {
            const activeItem = sidebarScrollRef.current.querySelector('.tooth-number-item.active');
            if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTooth]);

    // Sliding Transition Effect
    useEffect(() => {
        const current = currentTooth;
        const prev = prevToothRef.current;

        if (current === prev) return;

        const prevIndex = ALL_TEETH.indexOf(prev);
        const currentIndex = ALL_TEETH.indexOf(current);

        const isGoingDown = currentIndex > prevIndex;
        const pair = isGoingDown ? [prev, current] : [current, prev];
        const endTransform = isGoingDown ? 'translateY(-100%)' : 'translateY(0)';
        // 1. Trigger animation in next frame
        let cleanupTimeout;
        const animationFrame = requestAnimationFrame(() => {
            setDisplayState({
                teeth: pair,
                transform: endTransform,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            });

            // 2. Finalize and clean up after animation completes
            cleanupTimeout = setTimeout(() => {
                setDisplayState({
                    teeth: [current],
                    transform: 'translateY(0)',
                    transition: 'none'
                });
                prevToothRef.current = current;
            }, 450);
        });

        return () => {
            cancelAnimationFrame(animationFrame);
            if (cleanupTimeout) clearTimeout(cleanupTimeout);
        };
    }, [currentTooth, setDisplayState]);

    return (
        <div className="tooth-visualization-container">
            <div className="tooth-selector-column" ref={sidebarScrollRef}>
                {ALL_TEETH.map((num) => (
                    <div
                        key={num}
                        className={`tooth-number-item ${num === currentTooth ? 'active' : ''}`}
                        onClick={() => onSelectTooth(num)}
                    >
                        {num}
                    </div>
                ))}
            </div>

            <div className="visualization-column">
                <div
                    className="sliding-wrapper"
                    style={{
                        transform: displayState.transform,
                        transition: displayState.transition
                    }}
                >
                    {displayState.teeth.map((num) => {
                        const treatments = selectedPatient?.treatmentPlan?.items?.filter(item => parseInt(item.tooth) === parseInt(num)) || [];
                        return (
                            <ToothItem
                                key={num}
                                toothNumber={num}
                                toothData={num === currentTooth && overrideToothData ? overrideToothData : teeth[num]}
                                isSelected={num === currentTooth}
                                onSelectTooth={onSelectTooth}
                                treatments={treatments}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ToothVisualization;
