import React from 'react';
import { Snowflake, Gavel, Hand, Flame, Zap, ChevronRight } from 'lucide-react';


const EndodonticSection = ({ onTestSelect, tooth }) => {
    const tests = tooth?.endodontic?.tests || {};

    const getIcon = (test) => {
        switch (test) {
            case 'Cold': return <Snowflake size={16} className="endo-icon" style={{ color: '#60a5fa' }} />;
            case 'Percussion': return <Gavel size={16} className="endo-icon" style={{ color: '#9ca3af' }} />;
            case 'Palpation': return <Hand size={16} className="endo-icon" style={{ color: '#fb923c' }} />;
            case 'Heat': return <Flame size={16} className="endo-icon" style={{ color: '#ef4444' }} />;
            case 'Electricity': return <Zap size={16} className="endo-icon" style={{ color: '#eab308' }} />;
            default: return <Zap size={16} className="endo-icon" />;
        }
    };

    return (
        <div className="section-card">
            <div className="section-header">
                <h2>Endodontic Tests</h2>
            </div>
            <div className="endo-list">
                {['Cold', 'Percussion', 'Palpation', 'Heat', 'Electricity'].map(test => {
                    const testKey = test.toLowerCase();
                    const result = tests[testKey];

                    return (
                        <div
                            key={test}
                            className={`endo-item cursor-pointer ${result ? 'has-result' : ''}`}
                            onClick={() => onTestSelect && onTestSelect(test)}
                        >
                            <div className="endo-label">
                                {getIcon(test)}
                                <span className="test-name">{test}</span>
                                {result && (
                                    <span className={`test-badge ${result.result?.toLowerCase()}`}>
                                        {result.result}
                                        {result.detail && <span className="test-detail"> ({result.detail})</span>}
                                    </span>
                                )}
                            </div>
                            <div className="endo-action">
                                {result ? 'Update' : 'Test'} <ChevronRight size={16} className="ml-1" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EndodonticSection;
