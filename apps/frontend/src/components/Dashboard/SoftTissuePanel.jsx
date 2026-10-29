import React, { useState, useEffect } from 'react';
import './SoftTissuePanel.css';

const SOFT_TISSUE_FIELDS = [
    { id: 'upperLip', label: 'Upper lip' },
    { id: 'lowerLip', label: 'Lower lip' },
    { id: 'rCommissure', label: 'R commissure' },
    { id: 'lCommissure', label: 'L commissure' },
    { id: 'upperLabialMucosa', label: 'Upper labial mucosa' },
    { id: 'upperSulci', label: 'Upper sulci' },
    { id: 'upperGingivae', label: 'Upper gingivae' },
    { id: 'hardPalate', label: 'Hard palate' },
    { id: 'softPalate', label: 'Soft palate' },
    { id: 'pharynxTonsillarArea', label: 'Pharynx and tonsillar area' },
    { id: 'tongueDorsum', label: 'Tongue - dorsum' },
    { id: 'tongueRLateralBorder', label: 'Tongue - R lateral border' },
    { id: 'tongueLLateralBorder', label: 'Tongue - L lateral border' },
    { id: 'tongueVentral', label: 'Tongue - ventral' },
    { id: 'floorOfMouth', label: 'Floor of mouth' },
    { id: 'rBuccalMucosa', label: 'R buccal mucosa' },
    { id: 'lBuccalMucosa', label: 'L buccal mucosa' },
    { id: 'lowerGingivae', label: 'Lower gingivae' },
    { id: 'lowerSulci', label: 'Lower sulci' },
    { id: 'lowerLabialMucosa', label: 'Lower labial mucosa' }
];

const SoftTissuePanel = ({ data, onSave }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    const handleChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const handleCancel = () => {
        setFormData(data || {});
    };

    return (
        <div className="soft-tissue-panel">
            <div className="soft-tissue-scroll-area">
                <div className="soft-tissue-grid">
                    {SOFT_TISSUE_FIELDS.map(field => (
                        <div key={field.id} className="soft-tissue-field">
                            <label htmlFor={field.id}>{field.label}</label>
                            <input
                                type="text"
                                id={field.id}
                                value={formData[field.id] || ''}
                                placeholder="enter description"
                                onChange={(e) => handleChange(field.id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="soft-tissue-footer">
                <button className="btn-cancel" onClick={handleCancel}>CANCEL</button>
                <button className="btn-save" onClick={handleSave}>SAVE CHANGES</button>
            </div>
        </div>
    );
};

export default SoftTissuePanel;
