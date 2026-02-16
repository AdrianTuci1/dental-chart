import React from 'react';
import ToothZones from '../../../../Tooth/ToothZones';
import styles from '../RestorationWizard.module.css';

const FillingFlow = ({ formState, updateForm, currentStep, onNextStep, toothNumber }) => {
    const { selectedZones, fillingMaterial, fillingQuality } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>SURFACES:</div>
                <div className={styles.drawerZones}>
                    <ToothZones
                        toothNumber={toothNumber}
                        selectedZones={selectedZones}
                        onChange={(zones) => updateForm({ selectedZones: zones })}
                        className={styles.fullWidthZones}
                    />
                </div>
                <button
                    className={styles.continueBtn}
                    onClick={() => onNextStep(2)}
                    disabled={selectedZones.length === 0}
                >
                    ADD DETAILS
                </button>
            </div>
        );
    }
    if (currentStep === 2) {
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
                                    onNextStep(3);
                                }
                            }}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 3) {
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
