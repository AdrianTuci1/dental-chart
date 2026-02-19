import React from 'react';
import { Snowflake, Gavel, Hand, Flame, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EndodonticSection = ({ onTestSelect }) => {
    // navigate is available if we need to add onclick handlers later
    const navigate = useNavigate();

    const getIcon = (test) => {
        switch (test) {
            case 'Cold': return <Snowflake size={16} className="endo-icon text-blue-400" />;
            case 'Percussion': return <Gavel size={16} className="endo-icon text-gray-500" />;
            case 'Palpation': return <Hand size={16} className="endo-icon text-orange-400" />;
            case 'Heat': return <Flame size={16} className="endo-icon text-red-500" />;
            case 'Electricity': return <Zap size={16} className="endo-icon text-yellow-500" />;
            default: return <Zap size={16} className="endo-icon" />;
        }
    };

    return (
        <div className="section-card">
            <div className="section-header">
                <h2>Endodontic</h2>
            </div>
            <div className="endo-list">
                {['Cold', 'Percussion', 'Palpation', 'Heat', 'Electricity'].map(test => (
                    <div
                        key={test}
                        className="endo-item cursor-pointer"
                        onClick={() => onTestSelect && onTestSelect(test)}
                    >
                        <div className="endo-label">
                            {getIcon(test)} {test}
                        </div>
                        <div className="endo-action">
                            Test <ChevronRight size={16} className="rotate-180 ml-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EndodonticSection;
