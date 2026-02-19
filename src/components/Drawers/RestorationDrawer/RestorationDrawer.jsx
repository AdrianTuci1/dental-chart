import React, { useState, useEffect } from 'react';
import useChartStore from '../../../store/chartStore';
import styles from './RestorationDrawer.module.css';

// Subcomponents
import DrawerHeader from './components/DrawerHeader';
import TypeSelector from './components/TypeSelector';
import RestorationWizard from './components/RestorationWizard';
import { useRestorationForm } from './hooks/useRestorationForm';

const RestorationDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const { teeth, updateTooth } = useChartStore();
    const tooth = teeth[toothNumber];

    const [view, setView] = useState('list'); // 'list' or 'configure'
    const [selectedRestorationType, setSelectedRestorationType] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    const { formState, updateForm, resetForm, loadFormFromItem } = useRestorationForm();

    // Reset form when tooth changes or drawer closes/opens
    useEffect(() => {
        resetForm();
        setView('list');
        setSelectedRestorationType(null);
        setCurrentStep(0);
    }, [toothNumber, resetForm]);

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

        switch (selectedRestorationType) {
            case 'filling':
                if (fillingMaterial && fillingQuality) {
                    const newFilling = {
                        zones: selectedZones,
                        material: fillingMaterial,
                        quality: fillingQuality
                    };
                    if (editingIndex !== null && updatedRestoration.fillings && updatedRestoration.fillings[editingIndex]) {
                        updatedRestoration.fillings[editingIndex] = newFilling;
                    } else {
                        updatedRestoration.fillings = [...(updatedRestoration.fillings || []), newFilling];
                    }
                }
                break;
            case 'veneer':
                if (selectedZones.length > 0 && veneerMaterial && veneerQuality && veneerDetail) {
                    const newVeneer = {
                        zones: selectedZones,
                        material: veneerMaterial,
                        quality: veneerQuality,
                        detail: veneerDetail
                    };
                    if (editingIndex !== null && updatedRestoration.veneers && updatedRestoration.veneers[editingIndex]) {
                        updatedRestoration.veneers[editingIndex] = newVeneer;
                    } else {
                        updatedRestoration.veneers = [...(updatedRestoration.veneers || []), newVeneer];
                    }
                }
                break;
            case 'crown':
                if (crownMaterial && crownType && crownBase) {
                    const newCrown = {
                        material: crownMaterial,
                        quality: 'Sufficient',
                        type: crownType,
                        base: crownBase
                    };
                    if (crownBase === 'Implant' && implantType) {
                        newCrown.implantType = implantType;
                    }
                    if (editingIndex !== null && updatedRestoration.crowns && updatedRestoration.crowns[editingIndex]) {
                        updatedRestoration.crowns[editingIndex] = newCrown;
                    } else {
                        updatedRestoration.crowns = [...(updatedRestoration.crowns || []), newCrown];
                    }
                }
                break;
            default:
                break;
        }

        updateTooth(toothNumber, { restoration: updatedRestoration });
        handleBack();
    };

    const handleEditItem = (type, item, index) => {
        setSelectedRestorationType(type);
        setView('configure');

        loadFormFromItem(type, item, index);

        // Determine step based on type to restore UI state
        if (type === 'filling') {
            setCurrentStep(3);
        } else if (type === 'veneer') {
            setCurrentStep(4);
        } else if (type === 'crown') {
            setCurrentStep(item.base === 'Implant' ? 5 : 4); // Logic from original file. 
            // Wait, original file had: setCurrentStep(item.base === 'Implant' ? 5 : 4);
            // My steps are: Material(1) -> Type(2) -> Base(3) -> Implant(4)
            // So if editing, we probably want to show the last step or summary?
            // Original: 
            // Filling: Step 3 (Quality)
            // Veneer: Step 4 (Detail)
            // Crown: Step 4 or 5 (Implant or Base)

            // My Steps:
            // Filling: 1(Zone) -> 2(Mat) -> 3(Qual)
            // Veneer: 1(Zone) -> 2(Mat) -> 3(Qual) -> 4(Detail)
            // Crown: 1(Mat) -> 2(Type) -> 3(Base) -> 4(Implant)

            if (type === 'crown') {
                // If implant, go to step 4, else step 3? 
                // Actually, if we are editing, we usually want to see the filled form. 
                // The Wizard component renders summary + current step options.
                // If we want to just show summary, we might want a "Review" step or just set it to the last step.
                setCurrentStep(item.base === 'Implant' ? 4 : 3);
            }
        } else {
            setCurrentStep(1);
        }
    };

    // Helper to render added items list (Only shown in 'list' view)
    const renderAddedItems = () => {
        if (!tooth || !tooth.restoration) return null;
        const r = tooth.restoration;
        const items = [];

        if (r.fillings && r.fillings.length > 0) {
            r.fillings.forEach((f, i) => {
                items.push(
                    <div key={`filling-${i}`} className={styles.addedItem} onClick={() => handleEditItem('filling', f, i)}>
                        <div className={styles.addedItemText}>Filling</div>
                        <div className={styles.addedItemDetails}>{f.material} - {f.quality} - Zones: {f.zones?.join(', ')}</div>
                    </div>
                );
            });
        }
        if (r.veneers && r.veneers.length > 0) {
            r.veneers.forEach((v, i) => {
                items.push(
                    <div key={`veneer-${i}`} className={styles.addedItem} onClick={() => handleEditItem('veneer', v, i)}>
                        <div className={styles.addedItemText}>Veneer</div>
                        <div className={styles.addedItemDetails}>{v.material} - {v.quality} - {v.detail}</div>
                    </div>
                );
            });
        }
        if (r.crowns && r.crowns.length > 0) {
            r.crowns.forEach((c, i) => {
                items.push(
                    <div key={`crown-${i}`} className={styles.addedItem} onClick={() => handleEditItem('crown', c, i)}>
                        <div className={styles.addedItemText}>Crown</div>
                        <div className={styles.addedItemDetails}>{c.material} - {c.type} - {c.base} {c.implantType ? `(${c.implantType})` : ''}</div>
                    </div>
                );
            });
        }

        return items;
    };

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
