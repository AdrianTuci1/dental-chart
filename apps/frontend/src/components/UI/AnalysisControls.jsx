import React from 'react';
import { RefreshCcw, Pencil, Eraser } from 'lucide-react';
import './AnalysisControls.css';

const AnalysisControls = () => {
    return (
        <div className="analysis-controls">
            <button className="control-btn" title="Brush Tool">
                <Pencil size={24} />
            </button>
            <button className="control-btn" title="Eraser Tool">
                <Eraser size={24} />
            </button>
            <button className="control-btn" title="Re-analyze Image">
                <RefreshCcw size={24} />
            </button>
        </div>
    );
};

export default AnalysisControls;
