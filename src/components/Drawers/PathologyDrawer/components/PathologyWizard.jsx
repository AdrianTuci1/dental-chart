import React from 'react';
import styles from './PathologyWizard.module.css';

// Import Flow Components
import DecayFlow from './flows/DecayFlow';
import FractureFlow from './flows/FractureFlow';
import ToothWearFlow from './flows/ToothWearFlow';
import DiscolorationFlow from './flows/DiscolorationFlow';
import ApicalFlow from './flows/ApicalFlow';
import DevelopmentDisorderFlow from './flows/DevelopmentDisorderFlow';

const FlowComponents = {
    'decay': DecayFlow,
    'fracture': FractureFlow,
    'tooth-wear': ToothWearFlow,
    'discoloration': DiscolorationFlow,
    'apical': ApicalFlow,
    'development-disorder': DevelopmentDisorderFlow
};

const PathologyWizard = ({
    selectedPathologyType,
    pathologyTypes,
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
        selectedZones, decayMaterial, cavitation, cavitationLevel,
        fractureLocation, fractureDirection,
        toothWearType, toothWearSurface,
        discolorationColor,
        apicalPresent,
        developmentDisorderPresent
    } = formState;

    const renderSummary = () => {
        if (!selectedPathologyType && currentStep === 0) return null;

        const summaryItems = [
            {
                label: 'PATHOLOGY',
                value: pathologyTypes.find(t => t.id === selectedPathologyType)?.label || 'Select Type',
                step: 0,
                isMain: true
            },
        ];

        if (selectedPathologyType === 'decay') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (decayMaterial) summaryItems.push({ label: 'MATERIAL', value: decayMaterial, step: 2 });
            if (cavitation) summaryItems.push({ label: 'CAVITATION', value: cavitation, step: 3 });
            if (cavitationLevel) summaryItems.push({ label: 'LEVEL', value: cavitationLevel, step: 4 });
        } else if (selectedPathologyType === 'fracture') {
            if (fractureLocation) summaryItems.push({ label: 'LOCATION', value: fractureLocation, step: 1 });
            if (fractureDirection) summaryItems.push({ label: 'DIRECTION', value: fractureDirection, step: 2 });
        } else if (selectedPathologyType === 'tooth-wear') {
            if (toothWearType) summaryItems.push({ label: 'TYPE', value: toothWearType, step: 1 });
            if (toothWearSurface) summaryItems.push({ label: 'SURFACE', value: toothWearSurface, step: 2 });
        } else if (selectedPathologyType === 'discoloration') {
            if (discolorationColor) summaryItems.push({ label: 'COLOR', value: discolorationColor, step: 1 });
        } else if (selectedPathologyType === 'apical') {
            if (apicalPresent !== null) summaryItems.push({ label: 'PRESENT', value: apicalPresent ? 'Yes' : 'No', step: 1 });
        } else if (selectedPathologyType === 'development-disorder') {
            if (developmentDisorderPresent !== null) summaryItems.push({ label: 'PRESENT', value: developmentDisorderPresent ? 'Yes' : 'No', step: 1 });
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

    const FlowComponent = FlowComponents[selectedPathologyType];

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

export default PathologyWizard;
