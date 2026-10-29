import React from 'react';
import { Snowflake, Gavel, Hand, Flame, Zap, ChevronRight } from 'lucide-react';
import { getEndoTests } from '../../utils/endoUtils';

const EndodonticSection = ({ onTestSelect, tooth }) => {
    const tests = getEndoTests(tooth?.endodontic);

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

    const getBadgeDetails = (result) => {
        if (result === null || result === undefined || result === '') {
            return null;
        }

        if (typeof result === 'object') {
            if (!result.result) return null;

            return {
                label: result.detail ? `${result.result} (${result.detail})` : result.result,
                className: result.result.toLowerCase(),
            };
        }

        return {
            label: `${result}`,
            className: 'recorded',
        };
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
                    const badge = getBadgeDetails(result);

                    return (
                        <div
                            key={test}
                            className={`endo-item cursor-pointer ${badge ? 'has-result' : ''}`}
                            onClick={() => onTestSelect && onTestSelect(test)}
                        >
                            <div className="endo-label">
                                {getIcon(test)}
                                <span className="test-name">{test}</span>
                                {badge && (
                                    <span className={`test-badge ${badge.className}`}>
                                        {badge.label}
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
