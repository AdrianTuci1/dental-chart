import React from 'react';
import styles from '../PathologyWizard.module.css';

const FractureFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { fractureLocation, fractureDirection } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>LOCATION:</div>
                <div className={styles.optionsStack}>
                    {['crown', 'root'].map(l => (
                        <button key={l} className={`${styles.stackBtn} ${fractureLocation === l ? styles.active : ''}`}
                            onClick={() => {
                                if (fractureLocation === l) {
                                    updateForm({ fractureLocation: null, fractureDirection: null });
                                } else {
                                    updateForm({ fractureLocation: l });
                                    onNextStep(l === 'root' ? 2 : 3);
                                }
                            }}>
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 2 && fractureLocation === 'root') {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>DIRECTION:</div>
                <div className={styles.optionsStack}>
                    {['vertical', 'horizontal'].map(d => (
                        <button key={d} className={`${styles.stackBtn} ${fractureDirection === d ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ fractureDirection: fractureDirection === d ? null : d });
                            }}>
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default FractureFlow;
