import React, { useState, useEffect } from 'react';
import useChartStore from '../../store/chartStore';
import { Snowflake, Gavel, Hand, Flame, Zap, ChevronRight, ChevronLeft, X } from 'lucide-react';
import './EndodonticDrawer.css';

const EndodonticDrawer = ({ selectedTeeth, position = 'right', onClose }) => {
    const { teeth, updateTeeth } = useChartStore();

    const [activeTest, setActiveTest] = useState(null); // 'Cold', 'Heat', 'Percussion', 'Palpation', 'Electricity'

    // We store the full state for all tests here
    const [formState, setFormState] = useState({
        hasRootCanal: false,
        tests: {
            Cold: null,
            Heat: null,
            Percussion: null,
            Palpation: null,
            Electricity: ''
        }
    });

    useEffect(() => {
        if (selectedTeeth && selectedTeeth.length > 0) {
            const firstTooth = teeth[selectedTeeth[0]];
            if (firstTooth && firstTooth.endodontic) {
                setFormState({
                    hasRootCanal: firstTooth.endodontic.hasRootCanal || false,
                    tests: {
                        Cold: firstTooth.endodontic.tests?.Cold || null,
                        Heat: firstTooth.endodontic.tests?.Heat || null,
                        Percussion: firstTooth.endodontic.tests?.Percussion || null,
                        Palpation: firstTooth.endodontic.tests?.Palpation || null,
                        Electricity: firstTooth.endodontic.tests?.Electricity || ''
                    }
                });
            }
        }
    }, [selectedTeeth, teeth]);

    const persistChanges = (newFormState) => {
        const updates = {};
        selectedTeeth.forEach(toothNumber => {
            const tooth = teeth[toothNumber];
            if (tooth) {
                updates[toothNumber] = {
                    endodontic: {
                        ...tooth.endodontic,
                        hasRootCanal: newFormState.hasRootCanal,
                        tests: {
                            ...(tooth.endodontic.tests || {}),
                            ...newFormState.tests
                        }
                    }
                };
            }
        });
        updateTeeth(updates);
    };

    const handleTestValueChange = (testName, valueObject) => {
        setFormState(prev => {
            const newState = {
                ...prev,
                tests: {
                    ...prev.tests,
                    [testName]: valueObject
                }
            };
            persistChanges(newState);
            return newState;
        });
    };

    const handleElectricityChange = (val) => {
        setFormState(prev => {
            const newState = {
                ...prev,
                tests: {
                    ...prev.tests,
                    Electricity: val
                }
            };
            persistChanges(newState);
            return newState;
        });
    };

    const handleRootCanalChange = (checked) => {
        setFormState(prev => {
            const newState = { ...prev, hasRootCanal: checked };
            persistChanges(newState);
            return newState;
        });
    };

    const getIcon = (test) => {
        switch (test) {
            case 'Cold': return <Snowflake size={18} className="text-cyan-400" style={{ color: 'var(--color-cyan)' }} />;
            case 'Percussion': return <Gavel size={18} className="text-gray-400" style={{ color: 'var(--color-gray-400)' }} />;
            case 'Palpation': return <Hand size={18} className="text-warning" style={{ color: 'var(--color-warning)' }} />;
            case 'Heat': return <Flame size={18} className="text-error" style={{ color: 'var(--color-error)' }} />;
            case 'Electricity': return <Zap size={18} className="text-yellow-500" style={{ color: 'var(--color-warning)' }} />;
            default: return <Zap size={18} />;
        }
    };

    if (!selectedTeeth || selectedTeeth.length === 0) return null;

    return (
        <div className={`endo-drawer ${position}`}>
            <div className="endo-drawer-header">
                <div className="endo-drawer-header-left">
                    {activeTest && (
                        <button className="endo-drawer-back" onClick={() => setActiveTest(null)}>
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h2 className="endo-drawer-title">{activeTest ? activeTest : 'Endodontic Tests'}</h2>
                </div>
                <button onClick={onClose} className="endo-drawer-close">
                    <X size={20} />
                </button>
            </div>

            <div className="endo-drawer-content">
                {!activeTest ? (
                    <div className="endo-list-view">

                        {['Cold', 'Percussion', 'Palpation', 'Heat', 'Electricity'].map(test => (
                            <div
                                key={test}
                                className="endo-item-card"
                                onClick={() => setActiveTest(test)}
                            >
                                <div className="endo-item-label">
                                    {getIcon(test)}
                                    <span>{test}</span>
                                </div>
                                <div className="endo-item-action">
                                    {(formState.tests[test] !== null && formState.tests[test] !== '') ? 'Edit' : 'Test'}
                                    <ChevronRight size={16} className="ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <TestDetailView
                        testName={activeTest}
                        currentValue={formState.tests[activeTest]}
                        onSave={(testName, value) => handleTestValueChange(testName, value)}
                        onElectricityChange={(val) => handleElectricityChange(val)}
                        onBack={() => setActiveTest(null)}
                    />
                )}
            </div>
        </div>
    );
};

const TestDetailView = ({ testName, currentValue, onSave, onElectricityChange, onBack }) => {
    // For electricity it's just a number input
    if (testName === 'Electricity') {
        return (
            <div className="endo-detail-view">
                <div className="endo-drawer-input-container">
                    <label className="endo-drawer-input-label">Electric Pulp Test (EPT) Value</label>
                    <input
                        type="number"
                        min="0"
                        max="80"
                        value={currentValue || ''}
                        onChange={(e) => onElectricityChange(e.target.value)}
                        className="endo-drawer-input"
                        placeholder="e.g. 40"
                    />
                </div>
            </div>
        );
    }

    const level1Options = ['Positive', 'Uncertain', 'Negative', 'Not applicable'];
    const level2Options = ['Within limits', 'Unpleasant', 'Pain stimulus', 'Pain lingering'];

    // Convert object {result: '', detail: ''} to selected states
    const selectedLevel1 = currentValue?.result || null;
    const selectedLevel2 = currentValue?.detail || null;

    const handleLevel1Click = (option) => {
        if (option === 'Clear') {
            onSave(testName, null);
            onBack();
        } else {
            if (option !== 'Positive') {
                onSave(testName, { result: option });
                onBack();
            } else {
                onSave(testName, { result: option, detail: null }); // Wait for level 2 if Positive
            }
        }
    };

    const handleLevel2Click = (option) => {
        onSave(testName, { result: selectedLevel1, detail: option });
        onBack();
    };

    return (
        <div className="endo-detail-view">
            <div className="endo-options-grid">
                {selectedLevel1 === 'Positive' ? (
                    <>
                        <button
                            className="endo-option-btn selected"
                            onClick={() => handleLevel1Click('Clear')}
                        >
                            Positive (Click to reset)
                        </button>
                        <div className="endo-level2-container">
                            {level2Options.map(option => (
                                <button
                                    key={option}
                                    onClick={() => handleLevel2Click(option)}
                                    className={`endo-option-btn ${selectedLevel2 === option ? 'selected' : ''}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {level1Options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleLevel1Click(option)}
                                className={`endo-option-btn ${selectedLevel1 === option ? 'selected' : ''}`}
                            >
                                {option}
                            </button>
                        ))}
                    </>
                )}

                <button
                    onClick={() => onSave(testName, null)}
                    className="endo-option-btn clear-btn"
                >
                    Clear Test
                </button>
            </div>
        </div>
    );
};

export default EndodonticDrawer;
