import React from 'react';

import styles from '../PathologyWizard.module.css';

const DecayFlow = ({ formState, updateForm, currentStep, onNextStep, toothNumber }) => {
    const { selectedZones, decayMaterial, cavitation, cavitationLevel } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>MATERIAL:</div>
                <div className={styles.optionsStack}>
                    {['dentin', 'enamel'].map(m => (
                        <button key={m} className={`${styles.stackBtn} ${decayMaterial === m ? styles.active : ''}`}
                            onClick={() => {
                                if (decayMaterial === m) {
                                    updateForm({ decayMaterial: null, cavitation: null, cavitationLevel: null });
                                } else {
                                    updateForm({ decayMaterial: m });
                                    onNextStep(2);
                                }
                            }}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 2) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>CAVITATION:</div>
                <div className={styles.optionsStack}>
                    {['cavitation', 'no-cavitation'].map(c => (
                        <button key={c} className={`${styles.stackBtn} ${cavitation === c ? styles.active : ''}`}
                            onClick={() => {
                                if (cavitation === c) {
                                    updateForm({ cavitation: null, cavitationLevel: null });
                                } else {
                                    updateForm({ cavitation: c });
                                    onNextStep(3);
                                }
                            }}>
                            {c === 'no-cavitation' ? 'No Cavitation' : 'Cavitation'}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 3) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>LEVEL:</div>
                <div className={styles.optionsStack}>
                    {['C1', 'C2', 'C3', 'C4'].map(l => (
                        <button key={l} className={`${styles.stackBtn} ${cavitationLevel === l ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ cavitationLevel: cavitationLevel === l ? null : l });
                            }}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default DecayFlow;
