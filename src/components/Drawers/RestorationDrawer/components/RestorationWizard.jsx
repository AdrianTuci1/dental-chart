import React from 'react';
import styles from './RestorationWizard.module.css';
import ToothZones from '../../../Tooth/ToothZones';

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
            if (fillingMaterial) summaryItems.push({ label: 'MATERIAL', value: fillingMaterial, step: 1 });
            if (fillingQuality) summaryItems.push({ label: 'QUALITY', value: fillingQuality, step: 2 });
        } else if (selectedRestorationType === 'veneer') {
            if (selectedZones.length > 0) summaryItems.push({ label: 'SURFACES', value: selectedZones.join(', '), step: 1 });
            if (veneerMaterial) summaryItems.push({ label: 'MATERIAL', value: veneerMaterial, step: 1 });
            if (veneerQuality) summaryItems.push({ label: 'QUALITY', value: veneerQuality, step: 2 });
            if (veneerDetail) summaryItems.push({ label: 'DETAIL', value: veneerDetail, step: 3 });
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
                {selectedRestorationType && selectedRestorationType !== 'crown' && (
                    <div className={styles.drawerZones}>
                        <ToothZones
                            toothNumber={toothNumber}
                            selectedZones={selectedZones}
                            onChange={(zones) => updateForm({ selectedZones: zones })}
                            className={styles.fullWidthZones}
                            restorationType={selectedRestorationType}
                            zoneColor={(() => {
                                const material = fillingMaterial || veneerMaterial || crownMaterial;
                                switch (material) {
                                    case 'Gold': return '#FFD700'; // Gold
                                    case 'Amalgam': return '#9CA3AF'; // Gray-400
                                    case 'Non-Precious Metal': return '#9CA3AF'; // Gray-400
                                    case 'Ceramic': return '#A5F3FC'; // Cyan-200
                                    case 'Composite': return '#3B82F6'; // Blue-500
                                    default: return '#3B82F6'; // Default Blue
                                }
                            })()}
                        />
                    </div>
                )}
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
