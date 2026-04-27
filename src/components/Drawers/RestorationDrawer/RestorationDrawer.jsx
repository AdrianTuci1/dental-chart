import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../../core/store/appStore';
import { AppFacade } from '../../../core/AppFacade';
import styles from './RestorationDrawer.module.css';
import { getRestorationPresetZones } from '../../../utils/restorationZonePresets';
import { getFullCoverageZones } from '../../../utils/toothUtils';
import { buildRestorationPreview } from '../../../utils/toothPreviewBuilders';

// Subcomponents
import DrawerHeader from './components/DrawerHeader';
import TypeSelector from './components/TypeSelector';
import RestorationWizard from './components/RestorationWizard';
import { useRestorationForm } from './hooks/useRestorationForm';

const RestorationDrawer = React.memo(({ toothNumber, selectedTeeth = [], position = 'right', onClose, onNext, onPrevious, initialType = null }) => {
    const teeth = useAppStore((state) => state.teeth);
    const selectedPatient = useAppStore((state) => state.selectedPatient);

    // Normalize teeth list: either from selectedTeeth array or the single toothNumber
    const teethToUpdate = useMemo(() => {
        if (selectedTeeth && selectedTeeth.length > 0) return selectedTeeth;
        return toothNumber ? [toothNumber] : [];
    }, [selectedTeeth, toothNumber]);

    // Create a stable string key for the teethToUpdate list to avoid effect loops
    const teethKey = teethToUpdate.join(',');

    const firstToothNumber = teethToUpdate[0];
    const tooth = teeth[firstToothNumber];

    const [view, setView] = useState(initialType ? 'configure' : 'list');
    const [selectedRestorationType, setSelectedRestorationType] = useState(initialType);
    const [currentStep, setCurrentStep] = useState(initialType ? 1 : 0);

    const { formState, updateForm, resetForm } = useRestorationForm();

    useEffect(() => {
        resetForm();
    }, [firstToothNumber, resetForm]);

    useEffect(() => {
        if (!selectedRestorationType || !firstToothNumber) return;
        const presetZones = getRestorationPresetZones(selectedRestorationType, firstToothNumber);
        if (presetZones.length > 0) {
            updateForm({ selectedZones: presetZones });
        }
    }, [selectedRestorationType, firstToothNumber, updateForm]);

    useEffect(() => {
        if (selectedRestorationType === 'crown' && firstToothNumber) {
            const isFullCoverage = formState.crownBase === 'Implant' || formState.crownType === 'Pontic';
            if (isFullCoverage) {
                const zones = getFullCoverageZones(firstToothNumber);
                updateForm({ selectedZones: zones });
            }
        }
    }, [selectedRestorationType, formState.crownBase, formState.crownType, firstToothNumber, updateForm]);

    const setPreviewTooth = useAppStore((state) => state.setPreviewTooth);

    useEffect(() => {
        if (!tooth || !firstToothNumber) return;
        const previewTooth = buildRestorationPreview(tooth, selectedRestorationType, formState);

        // Show preview for all selected teeth
        teethToUpdate.forEach(tNum => {
            setPreviewTooth(tNum, previewTooth);
        });

        return () => {
            teethToUpdate.forEach(tNum => {
                setPreviewTooth(tNum, null);
            });
        };
    }, [tooth, firstToothNumber, teethKey, selectedRestorationType, formState, setPreviewTooth]);

    const restorationTypes = [
        { id: 'filling', label: 'Filling', route: 'filling' },
        { id: 'veneer', label: 'Veneer', route: 'veneer' },
        { id: 'crown', label: 'Crown', route: 'crown' },
    ];

    const handleTypeSelect = (typeId) => {
        setSelectedRestorationType(typeId);
        setView('configure');
        resetForm();
        setCurrentStep(1);
    };

    const handleBack = () => {
        setView('list');
        setSelectedRestorationType(null);
        resetForm();
    };

    const handleSave = () => {
        if (teethToUpdate.length === 0) return;

        const batchUpdates = {};
        const treatmentPlanItems = [];
        const timestamp = Date.now();

        const {
            selectedZones,
            fillingMaterial, fillingQuality,
            veneerMaterial, veneerQuality, veneerDetail,
            crownMaterial, crownType, crownBase, implantType,
            editingIndex
        } = formState;

        teethToUpdate.forEach((tNum, index) => {
            const currentTooth = teeth[tNum];
            if (!currentTooth) return;

            const updatedRestoration = { ...currentTooth.restoration };
            const newItemId = editingIndex !== null ? null : `${tNum}-${timestamp}-${index}`;
            let procedureString = '';
            let baseItem = null;

            switch (selectedRestorationType) {
                case 'filling':
                    const newFilling = {
                        id: newItemId,
                        status: 'planned',
                        zones: selectedZones,
                        material: fillingMaterial || 'Composite',
                        quality: fillingQuality || 'Sufficient'
                    };
                    updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
                    procedureString = `Filling, ${newFilling.material}, ${newFilling.quality}, ${selectedZones.join(', ')}`;
                    break;
                case 'veneer':
                    const newVeneer = {
                        id: newItemId,
                        status: 'planned',
                        zones: selectedZones,
                        material: veneerMaterial || 'Ceramic',
                        quality: veneerQuality || 'Sufficient',
                        detail: veneerDetail || 'Flush'
                    };
                    updatedRestoration.veneers = [...(updatedRestoration.veneers || []), newVeneer];
                    procedureString = `Veneer, ${newVeneer.material}, ${newVeneer.quality}, ${newVeneer.detail}`;
                    break;
                case 'crown':
                    const newCrown = {
                        id: newItemId,
                        status: 'planned',
                        zones: selectedZones,
                        material: crownMaterial || 'Ceramic',
                        quality: 'Sufficient',
                        type: crownType || 'Single Crown',
                        base: crownBase || 'Natural'
                    };
                    let extraInfo = '';
                    if (crownBase === 'Implant' && implantType) {
                        newCrown.implantType = implantType;
                        extraInfo = `, ${implantType}`;
                    }
                    updatedRestoration.crowns = [...(updatedRestoration.crowns || []), newCrown];
                    procedureString = `Crown, ${newCrown.material}, ${newCrown.type}, ${newCrown.base}${extraInfo}`;
                    break;
            }

            batchUpdates[tNum] = { restoration: updatedRestoration };

            if (newItemId && procedureString) {
                treatmentPlanItems.push({
                    id: newItemId,
                    tooth: tNum,
                    procedure: procedureString,
                    status: 'planned'
                });
            }
        });

        // 1. Bulk update state
        AppFacade.chart.updateTeethBatch(batchUpdates);

        // 2. Add to treatment plan if new items
        if (treatmentPlanItems.length > 0 && selectedPatient) {
            treatmentPlanItems.forEach(item => {
                AppFacade.patient.addTreatmentPlanItem(selectedPatient.id, item);
            });
        }

        onClose(); // Use onClose instead of handleBack to finish multi-step flow
    };

    return (
        <div className={`${styles.restorationDrawer} ${position === 'left' ? styles.left : styles.right}`}>
            <DrawerHeader
                toothNumber={teethToUpdate.length > 1 ? `${teethToUpdate.length} teeth` : firstToothNumber}
                onNext={onNext}
                onPrevious={onPrevious}
                onClose={onClose}
            />

            <div className={styles.drawerContent}>
                {view === 'list' ? (
                    <div className={styles.scrollableContent}>
                        <div className={styles.summaryList}>
                            <span className={styles.summaryLabel}>Apply to {teethToUpdate.length} selected teeth:</span>
                            <div className={styles.selectedTeethBadge}>
                                {teethToUpdate.join(', ')}
                            </div>
                        </div>
                        <TypeSelector
                            restorationTypes={restorationTypes}
                            onTypeSelect={handleTypeSelect}
                        />
                    </div>
                ) : (
                    <RestorationWizard
                        selectedRestorationType={selectedRestorationType}
                        restorationTypes={restorationTypes}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        onSave={handleSave}
                        onBack={handleBack}
                        formState={formState}
                        updateForm={updateForm}
                        toothNumber={firstToothNumber}
                    />
                )}
            </div>
        </div>
    );
});

export default RestorationDrawer;
