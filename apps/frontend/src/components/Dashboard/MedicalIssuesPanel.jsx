import React from 'react';
import { Heart, Wind, Flame, Cigarette, Wine, AlertCircle } from 'lucide-react';
import './MedicalIssuesPanel.css';

const MedicalIssuesPanel = ({ data }) => {
    // Helper to get icon and label
    const getIssueDetails = (key, value) => {
        switch (key) {
            case 'highBloodPressure':
                return { icon: Heart, label: 'High blood pressure' };
            case 'asthma':
                return { icon: Wind, label: 'Asthma' };
            case 'acidReflux':
                return { icon: Flame, label: 'Acid reflux' };
            case 'tobaccoUse':
                return { icon: Cigarette, label: 'Tobacco use' };
            case 'alcoholUse':
                return { icon: Wine, label: 'Alcohol use' };
            default:
                return { icon: AlertCircle, label: value };
        }
    };

    const activeIssues = [];
    if (data?.highBloodPressure) activeIssues.push('highBloodPressure');
    if (data?.asthma) activeIssues.push('asthma');
    if (data?.acidReflux) activeIssues.push('acidReflux');
    if (data?.tobaccoUse) activeIssues.push('tobaccoUse');
    if (data?.alcoholUse) activeIssues.push('alcoholUse');

    // Handle 'other' array
    if (data?.other && Array.isArray(data.other)) {
        data.other.forEach(issue => {
            activeIssues.push({ key: 'other', value: issue });
        });
    }

    if (activeIssues.length === 0) {
        return (
            <div className="medical-issues-panel">
                <p className="no-issues">No known medical issues.</p>
            </div>
        );
    }

    return (
        <div className="medical-issues-panel">
            <ul className="medical-list">
                {activeIssues.map((item, index) => {
                    let details;
                    if (typeof item === 'string') {
                        details = getIssueDetails(item);
                    } else {
                        // Custom/Other issue
                        details = { icon: AlertCircle, label: item.value };
                    }

                    const Icon = details.icon;

                    return (
                        <li key={index} className="medical-item">
                            <div className="medical-icon">
                                <Icon size={18} strokeWidth={2} />
                            </div>
                            <span className="medical-label">{details.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default MedicalIssuesPanel;
