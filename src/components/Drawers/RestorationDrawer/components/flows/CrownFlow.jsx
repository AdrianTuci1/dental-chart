import React from 'react';
import styles from '../RestorationWizard.module.css';

const CrownFlow = ({ formState, updateForm, currentStep, onNextStep }) => {
    const { crownMaterial, crownType, crownBase, implantType } = formState;

    if (currentStep === 1) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>MATERIAL:</div>
                <div className={styles.optionsStack}>
                    {['Composite', 'Ceramic', 'Gold', 'Non-Precious Metal'].map(m => (
                        <button key={m} className={`${styles.stackBtn} ${crownMaterial === m ? styles.active : ''}`}
                            onClick={() => {
                                if (crownMaterial === m) {
                                    updateForm({ crownMaterial: null, crownType: null, crownBase: null, implantType: null });
                                } else {
                                    updateForm({ crownMaterial: m });
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
                <div className={styles.stepLabel}>CROWN TYPE:</div>
                <div className={styles.optionsStack}>
                    {['Single Crown', 'Abutment', 'Pontic'].map(t => (
                        <button key={t} className={`${styles.stackBtn} ${crownType === t ? styles.active : ''}`}
                            onClick={() => {
                                if (crownType === t) {
                                    updateForm({ crownType: null, crownBase: null, implantType: null });
                                } else {
                                    updateForm({ crownType: t });
                                    onNextStep(3);
                                }
                            }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 3) {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>CROWN BASE:</div>
                <div className={styles.optionsStack}>
                    {['Natural', 'Implant'].map(b => (
                        <button key={b} className={`${styles.stackBtn} ${crownBase === b ? styles.active : ''}`}
                            onClick={() => {
                                if (crownBase === b) {
                                    updateForm({ crownBase: null, implantType: null });
                                } else {
                                    updateForm({ crownBase: b });
                                    onNextStep(b === 'Implant' ? 4 : 5);
                                }
                            }}>
                            {b}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (currentStep === 4 && crownBase === 'Implant') {
        return (
            <div className={styles.stepContainer}>
                <div className={styles.stepLabel}>IMPLANT TYPE:</div>
                <div className={styles.optionsStack}>
                    {['Bone Level', 'Tissue Level'].map(t => (
                        <button key={t} className={`${styles.stackBtn} ${implantType === t ? styles.active : ''}`}
                            onClick={() => {
                                updateForm({ implantType: implantType === t ? null : t });
                            }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

export default CrownFlow;
