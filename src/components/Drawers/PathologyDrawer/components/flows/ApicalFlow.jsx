import React from 'react';
import styles from '../PathologyWizard.module.css';

const ApicalFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { apicalPresent } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>APICAL PATHOLOGY:</div>
                <div className={styles.optionsStack}>
                    <button className={`${styles.stackBtn} ${apicalPresent === true ? styles.active : ''}`} onClick={() => updateForm({ apicalPresent: true })}>Yes</button>
                    <button className={`${styles.stackBtn} ${apicalPresent === false ? styles.active : ''}`} onClick={() => updateForm({ apicalPresent: false })}>No</button>
                </div>
            </div>
        );
    }
    return null;
};

export default ApicalFlow;
