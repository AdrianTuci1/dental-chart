import React, { useEffect, useRef } from 'react';
import ToothRenderer from '../Chart/ToothRenderer';
import '../Chart/ChartOverview.css';
import './ToothVisualization.css';
import WaveInteractiveView from './WaveInteractiveView';
import useChartStore from '../../store/chartStore';
import usePatientStore from '../../store/patientStore';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';
import { mapToothDataToConditions, isUpperJaw } from '../../utils/toothUtils';

const ToothItem = ({ toothNumber, toothData, isSelected, onSelectTooth }) => {
    const isUpper = isUpperJaw(toothNumber);
    const { selectedPatient } = usePatientStore();

    const views = isUpper
        ? ['frontal', 'topview', 'lingual']
        : ['lingual', 'topview', 'frontal'];

    // Check for extraction
    const isExtractionPlanned = (selectedPatient?.treatmentPlan?.items?.some(
        item => parseInt(item.tooth) === parseInt(toothNumber) &&
            item.procedure === 'Extraction' &&
            item.status === 'planned'
    )) || toothData?.toBeExtracted;

    const extractionText = isExtractionPlanned ? (
        <div className="extraction-text">TO BE EXTRACTED</div>
    ) : null;

    const buccalModel = useRef(new WaveInteractionModel()).current;
    const lingualModel = useRef(new WaveInteractionModel()).current;

    useEffect(() => {
        if (!toothData) return;
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

        buccalModel.setValues(getDataValues(['mesioBuccal', 'buccal', 'distoBuccal']));
        lingualModel.setValues(getDataValues(['mesioLingual', 'lingual', 'distoLingual']));
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

                        let modelToUse = isUpper
                            ? (index === 0 ? buccalModel : (index === 2 ? lingualModel : null))
                            : (index === 0 ? lingualModel : (index === 2 ? buccalModel : null));

                        const transformStyle = needsRotation
                            ? { transform: 'rotate(180deg) scale(0.8)' }
                            : { transform: 'scale(0.8)' };

                        const content = (
                            <div
                                className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                                style={transformStyle}
                                onClick={() => onSelectTooth(toothNumber)}
                            >
                                <ToothRenderer
                                    toothNumber={toothNumber}
                                    view={view}
                                    conditions={mapToothDataToConditions(toothData)}
                                    interactive={false}
                                    className="no-scale"
                                />
                            </div>
                        );

                        const viewContent = shouldShowWave ? (
                            <WaveInteractiveView
                                viewType={view}
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
                                {isExtractionPlanned && index < views.length - 1 && (
                                    <div className="extraction-text">TO BE EXTRACTED</div>
                                )}
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
    const vizScrollRef = useRef(null);
    const teeth = useChartStore(state => state.teeth);

    const allTeeth = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        48, 47, 46, 45, 44, 43, 42, 41,
        31, 32, 33, 34, 35, 36, 37, 38
    ];

    // Scroll both sidebars to active tooth
    useEffect(() => {
        if (sidebarScrollRef.current) {
            const activeItem = sidebarScrollRef.current.querySelector('.tooth-number-item.active');
            if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (vizScrollRef.current) {
            const activeViz = vizScrollRef.current.querySelector(`.tooth-item-container[data-number="${currentTooth}"]`);
            if (activeViz) activeViz.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentTooth]);

    return (
        <div className="tooth-visualization-container">
            <div className="tooth-selector-column" ref={sidebarScrollRef}>
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

            <div className="visualization-column" ref={vizScrollRef}>
                {allTeeth.map((num) => (
                    <ToothItem
                        key={num}
                        toothNumber={num}
                        toothData={num === currentTooth && overrideToothData ? overrideToothData : teeth[num]}
                        isSelected={num === currentTooth}
                        onSelectTooth={onSelectTooth}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToothVisualization;
