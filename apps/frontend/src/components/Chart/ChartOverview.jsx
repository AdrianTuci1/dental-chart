import React, { useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useAppStore } from '../../core/store/appStore';
import { toothImageCache } from '../../utils/toothImageCache';
import { getToothImage, mapViewToImageView, getToothCondition } from '../../utils/toothUtils';

import './ChartOverview.css';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

// All tooth numbers in a full mouth chart
const ALL_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38,
];

const ALL_VIEWS = ['frontal', 'lingual', 'topview'];
const ALL_CONDITIONS = ['withRoots', 'missing', 'implant', 'crown'];

const ChartOverview = () => {
    const { teeth, resolvedTeeth, selectTooth } = useAppStore();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { chartView } = useOutletContext();

    // Preload all tooth images in background when chart mounts
    useEffect(() => {
        const imagesToPreload = [];
        for (const toothNumber of ALL_TEETH) {
            for (const view of ALL_VIEWS) {
                const imageView = mapViewToImageView(view, toothNumber);
                // Preload base condition and common variants
                const condition = getToothCondition(resolvedTeeth?.[toothNumber]?.toothData);
                imagesToPreload.push(getToothImage(toothNumber, condition, imageView));
                // Also preload standard mask image for overlays
                imagesToPreload.push(getToothImage(toothNumber, 'withRoots', imageView));
            }
        }
        // Deduplicate and filter valid paths
        const uniquePaths = [...new Set(imagesToPreload)].filter(Boolean);
        // Preload in batches to avoid overwhelming the browser
        const BATCH_SIZE = 20;
        const preloadBatch = async () => {
            for (let i = 0; i < uniquePaths.length; i += BATCH_SIZE) {
                const batch = uniquePaths.slice(i, i + BATCH_SIZE);
                await toothImageCache.preloadBatch(batch);
            }
        };
        preloadBatch();
    }, [resolvedTeeth]);

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}`);
    };

    const renderView = () => {
        switch (chartView) {
            case 'upper':
                return <UpperJawView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
            case 'lower':
                return <LowerJawView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
            default:
                return <NormalView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
        }
    };

    return (
        <div className="chart-overview-container">
            {renderView()}
        </div>
    );
};

export default ChartOverview;
