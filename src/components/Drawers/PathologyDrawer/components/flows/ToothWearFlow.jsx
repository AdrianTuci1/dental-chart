import React from 'react';
import styles from '../PathologyWizard.module.css';

const ToothWearFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { toothWearType, toothWearSurface } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>TYPE:</div>
                <div className={styles.optionsStack}>
                    {['abrasion', 'erosion'].map(t => (
                        <button key={t} className={`${styles.stackBtn} ${toothWearType === t ? styles.active : ''}`}
                            onClick={() => {
                                if (toothWearType === t) {
                                    updateForm({ toothWearType: null, toothWearSurface: null });
                                } else {
                                    updateForm({ toothWearType: t });
                                    onNextStep(2);
                                }
                            }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 2) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>SURFACE:</div>
                <div className={styles.optionsStack}>
                    {['buccal', 'lingual'].map(s => (
                        <button key={s} className={`${styles.stackBtn} ${toothWearSurface === s ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ toothWearSurface: toothWearSurface === s ? null : s });
                            }}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default ToothWearFlow;
