import React from 'react';
import styles from '../PathologyWizard.module.css';

const DevelopmentDisorderFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { developmentDisorderPresent } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>DEVELOPMENT DISORDER:</div>
                <div className={styles.optionsStack}>
                    <button className={`${styles.stackBtn} ${developmentDisorderPresent === true ? styles.active : ''}`} onClick={() => updateForm({ developmentDisorderPresent: true })}>Yes</button>
                    <button className={`${styles.stackBtn} ${developmentDisorderPresent === false ? styles.active : ''}`} onClick={() => updateForm({ developmentDisorderPresent: false })}>No</button>
                </div>
            </div>
        );
    }
    return null;
};

export default DevelopmentDisorderFlow;
