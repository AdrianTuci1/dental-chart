import React from 'react';
import styles from '../PathologyWizard.module.css';

const DiscolorationFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { discolorationColor } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>COLOR:</div>
                <div className={styles.optionsStack}>
                    {['gray', 'red', 'yellow'].map(c => (
                        <button key={c} className={`${styles.stackBtn} ${discolorationColor === c ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ discolorationColor: discolorationColor === c ? null : c });
                            }}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default DiscolorationFlow;
