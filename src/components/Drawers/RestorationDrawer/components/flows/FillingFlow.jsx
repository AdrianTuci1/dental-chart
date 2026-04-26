import React from 'react';

import styles from '../RestorationWizard.module.css';

const FillingFlow = ({ formState, updateForm, currentStep, onNextStep, toothNumber }) => {
    const { selectedZones, fillingMaterial, fillingQuality } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>MATERIAL:</div>
                <div className={styles.optionsStack}>
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                        <button key={m} className={`${styles.stackBtn} ${fillingMaterial === m ? styles.active : ''}`}
                            onClick={() => {
                                if (fillingMaterial === m) {
                                    updateForm({ fillingMaterial: null, fillingQuality: null });
                                } else {
                                    updateForm({ fillingMaterial: m });
                                    onNextStep(2);
                                }
                            }}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 2) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>QUALITY:</div>
                <div className={styles.optionsStack}>
                    {['Sufficient', 'Uncertain', 'Insufficient'].map(q => (
                        <button key={q} className={`${styles.stackBtn} ${fillingQuality === q ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ fillingQuality: fillingQuality === q ? null : q });
                            }}>
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default FillingFlow;
