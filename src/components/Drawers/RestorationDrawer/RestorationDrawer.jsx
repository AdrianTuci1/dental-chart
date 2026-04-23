import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../core/store/appStore';
import { AppFacade } from '../../../core/AppFacade';
import styles from './RestorationDrawer.module.css';
import { getRestorationPresetZones } from '../../../utils/restorationZonePresets';
import { getFullCoverageZones } from '../../../utils/toothUtils';

// Subcomponents
import DrawerHeader from './components/DrawerHeader';
import TypeSelector from './components/TypeSelector';
import RestorationWizard from './components/RestorationWizard';
import { useRestorationForm } from './hooks/useRestorationForm';

const RestorationDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious, initialType = null, onPreviewChange }) => {
    const { teeth, selectedPatient } = useAppStore(); // Removed updateTooth and addTreatmentPlanItem
    const updateTooth = useAppStore(state => state.updateTooth); // Added specific updateTooth selector
    const tooth = teeth[toothNumber];

    const [view, setView] = useState(initialType ? 'configure' : 'list'); // 'list' or 'configure'
    const [selectedRestorationType, setSelectedRestorationType] = useState(initialType);
    const [currentStep, setCurrentStep] = useState(initialType ? 1 : 0);

    const { formState, updateForm, resetForm } = useRestorationForm();

    // Reset form when tooth changes or drawer closes/opens
    useEffect(() => {
        // Reset local variables only once on mount or tooth change
        resetForm();
    }, [toothNumber, resetForm]);

    useEffect(() => {
        const presetZones = getRestorationPresetZones(selectedRestorationType, toothNumber);

        if (presetZones.length > 0) {
            updateForm({ selectedZones: presetZones });
        }
    }, [selectedRestorationType, toothNumber, updateForm]);

    // Automatically select all zones for Implants or Pontics
    useEffect(() => {
        if (selectedRestorationType === 'crown') {
            const isFullCoverage = formState.crownBase === 'Implant' || formState.crownType === 'Pontic';
            if (isFullCoverage) {
                const zones = getFullCoverageZones(toothNumber);
                updateForm({ selectedZones: zones });
            }
        }
    }, [selectedRestorationType, formState.crownBase, formState.crownType, toothNumber, updateForm]);

    useEffect(() => {
        if (!onPreviewChange) return undefined;

        const previewTooth = buildRestorationPreview(tooth, selectedRestorationType, formState);
        onPreviewChange(toothNumber, previewTooth);

        return () => {
            onPreviewChange(toothNumber, null);
        };
    }, [tooth, toothNumber, selectedRestorationType, formState, onPreviewChange]);

    const restorationTypes = [
        { id: 'filling', label: 'Filling', route: 'filling' },
        { id: 'veneer', label: 'Veneer', route: 'veneer' },
        { id: 'crown', label: 'Crown', route: 'crown' },
    ];

    const handleTypeSelect = (typeId) => {
        if (selectedRestorationType === typeId) {
            setCurrentStep(1);
        } else {
            setSelectedRestorationType(typeId);
            setView('configure');
            resetForm();
            // We need to set the type again because resetForm clears it?
            // No, restoration type is local state, form state contains details.
            // But if we want to support switching types mid-flow, we should be careful.

            setCurrentStep(1);
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedRestorationType(null);
        resetForm();
    };

    const handleSave = () => {
        if (!tooth) return;

        const updatedRestoration = { ...tooth.restoration };
        const {
            selectedZones,
            fillingMaterial, fillingQuality,
            veneerMaterial, veneerQuality, veneerDetail,
            crownMaterial, crownType, crownBase, implantType,
            editingIndex
        } = formState;

        const newItemId = editingIndex !== null ? null : Date.now().toString();
        let procedureString = '';
        let baseItem = {}; // Define baseItem for AppFacade call

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial || selectedZones.length > 0) {
                    const newFilling = {
                        id: newItemId, // Only applied if new
                        status: 'planned',
                        zones: selectedZones,
                        material: fillingMaterial || 'Composite',
                        quality: fillingQuality || 'Sufficient'
                    };
                    if (editingIndex !== null && updatedRestoration.fillings && updatedRestoration.fillings[editingIndex]) {
                        updatedRestoration.fillings[editingIndex] = { ...updatedRestoration.fillings[editingIndex], ...newFilling };
                    } else {
                        updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
                        procedureString = `Filling, ${fillingMaterial || 'Composite'}, ${fillingQuality || 'Sufficient'}, ${selectedZones.join(', ')}`;
                        baseItem = {
                            id: newItemId,
                            tooth: toothNumber,
                            procedure: procedureString,
                        };
                    }
                }
                break;
            case 'veneer':
                if (selectedZones.length > 0) {
                    const newVeneer = {
                        id: newItemId,
                        status: 'planned',
                        zones: selectedZones,
                        material: veneerMaterial || 'Ceramic',
                        quality: veneerQuality || 'Sufficient',
                        detail: veneerDetail || 'Flush'
                    };
                    if (editingIndex !== null && updatedRestoration.veneers && updatedRestoration.veneers[editingIndex]) {
                        updatedRestoration.veneers[editingIndex] = { ...updatedRestoration.veneers[editingIndex], ...newVeneer };
                    } else {
                        updatedRestoration.veneers = [...(updatedRestoration.veneers || []), newVeneer];
                        procedureString = `Veneer, ${veneerMaterial || 'Ceramic'}, ${veneerQuality || 'Sufficient'}, ${veneerDetail || 'Flush'}`;
                        baseItem = {
                            id: newItemId,
                            tooth: toothNumber,
                            procedure: procedureString,
                        };
                    }
                }
                break;
            case 'crown':
                if (crownMaterial || crownType || crownBase) {
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
                    if (editingIndex !== null && updatedRestoration.crowns && updatedRestoration.crowns[editingIndex]) {
                        updatedRestoration.crowns[editingIndex] = { ...updatedRestoration.crowns[editingIndex], ...newCrown };
                    } else {
                        updatedRestoration.crowns = [...(updatedRestoration.crowns || []), newCrown];
                        procedureString = `Crown, ${crownMaterial || 'Ceramic'}, ${crownType || 'Single Crown'}, ${crownBase || 'Natural'}${extraInfo}`;
                        baseItem = {
                            id: newItemId,
                            tooth: toothNumber,
                            type: 'restoration',
                            subtype: 'crown',
                            material: newCrown.material,
                            crownType: newCrown.type,
                            base: newCrown.base,
                            zones: selectedZones,
                            procedure: procedureString,
                        };
                    }
                }
                break;
            default:
                break;
        }

        // 1. Update the tooth state in the store locally (no API call)
        updateTooth(toothNumber, { restoration: updatedRestoration });

        // 2. Add to treatment plan if it's a new item (triggers AppFacade sync)
        if (newItemId && procedureString && selectedPatient) {
            AppFacade.patient.addTreatmentPlanItem(selectedPatient.id, {
                ...baseItem,
                status: 'planned'
            });
        } else if (selectedPatient) {
            // Force sync even if no new plan item (e.g. just updating existing tooth status)
            AppFacade.patient.update(selectedPatient.id, useAppStore.getState().selectedPatient);
        }

        handleBack();
    };

    // handleEditItem removed because it was unused

    return (
        <div className={`${styles.restorationDrawer} ${position === 'left' ? styles.left : styles.right}`}>
            <DrawerHeader
                toothNumber={toothNumber}
                onNext={onNext}
                onPrevious={onPrevious}
                onClose={onClose}
            />

            <div className={styles.drawerContent}>
                {view === 'list' ? (
                    <div className={styles.scrollableContent}>
                        <div className={styles.summaryList}>
                            <span className={styles.summaryLabel}>Restoration:</span>
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
                        toothNumber={toothNumber}
                    />
                )}
            </div>
        </div>
    );
};

export default RestorationDrawer;
