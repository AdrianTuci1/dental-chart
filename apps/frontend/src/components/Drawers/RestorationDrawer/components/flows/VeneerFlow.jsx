import React from 'react';

import styles from '../RestorationWizard.module.css';

const VeneerFlow = ({ formState, updateForm, currentStep, onNextStep, toothNumber }) => {
    const { selectedZones, veneerMaterial, veneerQuality, veneerDetail } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>MATERIAL:</div>
                <div className={styles.optionsStack}>
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                        <button key={m} className={`${styles.stackBtn} ${veneerMaterial === m ? styles.active : ''}`}
                            onClick={() => {
                                if (veneerMaterial === m) {
                                    updateForm({ veneerMaterial: null, veneerQuality: null, veneerDetail: null });
                                } else {
                                    updateForm({ veneerMaterial: m });
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
                        <button key={q} className={`${styles.stackBtn} ${veneerQuality === q ? styles.active : ''}`}
                            onClick={() => {
                                if (veneerQuality === q) {
                                    updateForm({ veneerQuality: null, veneerDetail: null });
                                } else {
                                    updateForm({ veneerQuality: q });
                                    onNextStep(3);
                                }
                            }}>
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 3) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>DETAIL:</div>
                <div className={styles.optionsStack}>
                    {['Overhang', 'Flush', 'Shortfall'].map(d => (
                        <button key={d} className={`${styles.stackBtn} ${veneerDetail === d ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ veneerDetail: veneerDetail === d ? null : d });
                            }}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default VeneerFlow;
