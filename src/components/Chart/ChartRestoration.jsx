import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../core/store/appStore';
import { useOutletContext } from 'react-router-dom';

import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';
import RestorationDrawer from '../Drawers/RestorationDrawer/RestorationDrawer';

const ChartRestoration = () => {
    const { teeth, resolvedTeeth, selectTooth, selectedTooth } = useAppStore();
    const { chartView } = useOutletContext();
    const [previewTeeth, setPreviewTeeth] = useState({});

    const renderedResolvedTeeth = useMemo(() => {
        if (!resolvedTeeth) return {};
        const next = { ...resolvedTeeth };
        for (const [previewKey, previewData] of Object.entries(previewTeeth)) {
            const baseKey = Object.keys(next).find(k => String(next[k].displayNumber) === String(previewKey));
            if (baseKey) {
                next[baseKey] = {
                    ...next[baseKey],
                    toothData: { ...next[baseKey].toothData, ...previewData }
                };
            }
        }
        return next;
    }, [resolvedTeeth, previewTeeth]);

    const handlePreviewChange = (toothNumber, previewTooth) => {
        setPreviewTeeth((current) => {
            const next = { ...current };

            if (previewTooth) {
                next[toothNumber] = previewTooth;
            } else {
                delete next[toothNumber];
            }

            return next;
        });
    };

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
    };

    const handleCloseDrawer = () => {
        if (selectedTooth) {
            handlePreviewChange(selectedTooth, null);
        }
        selectTooth(null);
    };

    const handleNextTooth = () => {
        if (!selectedTooth) return;
        const current = parseInt(selectedTooth);
        const toothNumbers = Object.keys(teeth).map(Number).sort((a, b) => a - b);
        const currentIndex = toothNumbers.indexOf(current);
        if (currentIndex !== -1 && currentIndex < toothNumbers.length - 1) {
            handlePreviewChange(selectedTooth, null);
            selectTooth(toothNumbers[currentIndex + 1]);
        }
    };

    const handlePreviousTooth = () => {
        if (!selectedTooth) return;
        const current = parseInt(selectedTooth);
        const toothNumbers = Object.keys(teeth).map(Number).sort((a, b) => a - b);
        const currentIndex = toothNumbers.indexOf(current);
        if (currentIndex > 0) {
            handlePreviewChange(selectedTooth, null);
            selectTooth(toothNumbers[currentIndex - 1]);
        }
    };

    const getDrawerPosition = (toothNumber) => {
        if (!toothNumber) return 'right';
        const n = parseInt(toothNumber);
        if ((n >= 11 && n <= 18) || (n >= 41 && n <= 48)) {
            return 'right';
        }
        return 'left';
    };

    const renderView = () => {
        const props = {
            resolvedTeeth: renderedResolvedTeeth,
            onToothClick: handleToothClick,
            activeTooth: selectedTooth
        };

        switch (chartView) {
            case 'upper':
                return <UpperJawView {...props} />;
            case 'lower':
                return <LowerJawView {...props} />;
            default:
                return <NormalView {...props} />;
        }
    };

    return (
        <div className="chart-overview-container">
            {renderView()}
            {selectedTooth && (
                <RestorationDrawer
                    toothNumber={selectedTooth}
                    position={getDrawerPosition(selectedTooth)}
                    onClose={handleCloseDrawer}
                    onNext={handleNextTooth}
                    onPrevious={handlePreviousTooth}
                    onPreviewChange={handlePreviewChange}
                />
            )}
        </div>
    );
};

export default ChartRestoration;
