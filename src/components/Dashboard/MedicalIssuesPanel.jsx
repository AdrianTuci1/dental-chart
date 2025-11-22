import React from 'react';
import { AlertCircle } from 'lucide-react';
import './MedicalIssuesPanel.css';


const MedicalIssuesPanel = ({ data }) => {
    // Convert data object to list of issues
    const issues = [];
    if (data?.highBloodPressure) issues.push({ label: 'Condition', value: 'High Blood Pressure' });
    if (data?.asthma) issues.push({ label: 'Condition', value: 'Asthma' });
    if (data?.acidReflux) issues.push({ label: 'Condition', value: 'Acid Reflux' });
    if (data?.tobaccoUse) issues.push({ label: 'Habit', value: 'Tobacco Use' });
    if (data?.alcoholUse) issues.push({ label: 'Habit', value: 'Alcohol Use' });

    if (data?.other && Array.isArray(data.other)) {
        data.other.forEach(issue => {
            issues.push({ label: 'Other', value: issue });
        });
    }

    if (issues.length === 0) {
        return (
            <div className="medical-issues-panel">
                <div className="medical-header">
                    <div className="medical-icon-wrapper" style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                        <AlertCircle size={20} />
                    </div>
                    <h3 className="medical-title">Medical Alerts</h3>
                </div>
                <p className="text-sm text-gray-500">No known medical issues.</p>
            </div>
        );
    }

    return (
        <div className="medical-issues-panel">
            <div className="medical-header">
                <div className="medical-icon-wrapper">
                    <AlertCircle size={20} />
                </div>
                <h3 className="medical-title">Medical Alerts</h3>
            </div>
            <ul className="medical-list">
                {issues.map((issue, index) => (
                    <li key={index} className="medical-item">
                        <span className="medical-label">{issue.label}:</span> {issue.value}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MedicalIssuesPanel;
