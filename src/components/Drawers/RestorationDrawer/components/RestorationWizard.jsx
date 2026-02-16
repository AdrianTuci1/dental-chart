import React from 'react';
import styles from './RestorationWizard.module.css';

// Import Flow Components
import FillingFlow from './flows/FillingFlow';
import VeneerFlow from './flows/VeneerFlow';
import CrownFlow from './flows/CrownFlow';

const FlowComponents = {
    'filling': FillingFlow,
    'veneer': VeneerFlow,
    'crown': CrownFlow,
};

const RestorationWizard = ({
    selectedRestorationType,
    restorationTypes,
    currentStep,
    setCurrentStep,
    onSave,
    onBack,
    formState,
    updateForm,
    toothNumber
}) => {
    // Destructure needed values for summary rendering
    const {
        selectedZones,
        fillingMaterial, fillingQuality,
        veneerMaterial, veneerQuality, veneerDetail,
        crownMaterial, crownType, crownBase, implantType
    } = formState;

    const renderSummary = () => {
        if (!selectedRestorationType && currentStep === 0) return null;

        const summaryItems = [
            {
                label: 'RESTORATION',
                value: restorationTypes.find(t => t.id === selectedRestorationType)?.label || 'Select Type',
                step: 0,
                isMain: true
            },
        ];

        if (selectedRestorationType === 'filling') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (fillingMaterial) summaryItems.push({ label: 'MATERIAL', value: fillingMaterial, step: 2 });
            if (fillingQuality) summaryItems.push({ label: 'QUALITY', value: fillingQuality, step: 3 });
        } else if (selectedRestorationType === 'veneer') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (veneerMaterial) summaryItems.push({ label: 'MATERIAL', value: veneerMaterial, step: 2 });
            if (veneerQuality) summaryItems.push({ label: 'QUALITY', value: veneerQuality, step: 3 });
            if (veneerDetail) summaryItems.push({ label: 'DETAIL', value: veneerDetail, step: 4 });
        } else if (selectedRestorationType === 'crown') {
            if (crownMaterial) summaryItems.push({ label: 'MATERIAL', value: crownMaterial, step: 1 });
            if (crownType) summaryItems.push({ label: 'TYPE', value: crownType, step: 2 });
            if (crownBase) summaryItems.push({ label: 'BASE', value: crownBase, step: 3 });
            if (implantType) summaryItems.push({ label: 'IMPLANT', value: implantType, step: 4 });
        }

        return (
            <div className={styles.summaryList}>
                {summaryItems.map((item, index) => (
                    <div key={index} className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>{item.label}:</span>
                        <span
                            className={styles.summaryValue}
                            onClick={() => {
                                if (item.isMain && onBack) {
                                    onBack();
                                } else {
                                    setCurrentStep(item.step);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const FlowComponent = FlowComponents[selectedRestorationType];

    return (
        <>
            <div className={`${styles.scrollableContent} ${styles.configurationView}`}>
                {renderSummary()}
                {FlowComponent && (
                    <FlowComponent
                        formState={formState}
                        updateForm={updateForm}
                        currentStep={currentStep}
                        onNextStep={setCurrentStep}
                        toothNumber={toothNumber}
                    />
                )}
            </div>
            <div className={styles.fixedFooter}>
                <button className={styles.saveFull} onClick={onSave}>SAVE</button>
            </div>
        </>
    );
};

export default RestorationWizard;
