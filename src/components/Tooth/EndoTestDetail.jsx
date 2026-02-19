import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import './EndoTestDetail.css';

const EndoTestDetail = ({ testName, onClose, onSave }) => {
    const [selectedLevel1, setSelectedLevel1] = useState(null);
    const [selectedLevel2, setSelectedLevel2] = useState(null);

    const level1Options = ['Positive', 'Uncertain', 'Negative', 'Not applicable', 'Clear'];
    const level2Options = ['Within limits', 'Unpleasant', 'Pain stimulus', 'Pain lingering', 'Clear'];

    const handleLevel1Click = (option) => {
        if (option === 'Clear') {
            setSelectedLevel1(null);
            setSelectedLevel2(null);
            onSave(testName, null); // Save as null/cleared
        } else {
            setSelectedLevel1(option);
            // If switching level 1, reset level 2 unless it was already positive and we stay positive (though here we just reset for simplicity or keep if logic dictates)
            if (option !== 'Positive') {
                setSelectedLevel2(null);
                onSave(testName, { result: option });
            }
        }
    };

    const handleLevel2Click = (option) => {
        if (option === 'Clear') {
            setSelectedLevel2(null);
            setSelectedLevel1(null); // Reset to Level 1
            onSave(testName, null);
        } else {
            setSelectedLevel2(option);
            onSave(testName, { result: selectedLevel1, detail: option });
        }
    };

    return (

        <div className="section-card endo-detail-container">
            <div className="endo-detail-controls">
                <button
                    onClick={onClose}
                    className="close-btn"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="section-header">
                <h2>{testName}</h2>
            </div>

            <div className="endo-options-container">
                {selectedLevel1 === 'Positive' ? (
                    <div className="level2-container">

                        {level2Options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleLevel2Click(option)}
                                className={`option-btn 
                                    ${selectedLevel2 === option ? 'level2-selected' : ''}
                                    ${option === 'Clear' ? 'clear-btn' : ''}
                                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="level1-group">
                        {level1Options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleLevel1Click(option)}
                                className={`option-btn 
                                    ${selectedLevel1 === option ? 'selected' : ''}
                                    ${option === 'Clear' ? 'clear-btn' : ''}
                                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

};

export default EndoTestDetail;
