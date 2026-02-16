import React, { useState } from 'react';
import useChartStore from '../../../store/chartStore';
import styles from './PathologyDrawer.module.css';

// Subcomponents
import DrawerHeader from './components/DrawerHeader';
import TypeSelector from './components/TypeSelector';
import PathologyWizard from './components/PathologyWizard';
import { usePathologyForm } from './hooks/usePathologyForm';

const PathologyDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const { teeth, updateTooth } = useChartStore();
    const tooth = teeth[toothNumber];

    const [view, setView] = useState('list'); // 'list' or 'configure'
    const [selectedPathologyType, setSelectedPathologyType] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    const { formState, updateForm, resetForm, loadFormFromItem } = usePathologyForm();

    // Reset form when tooth changes or drawer closes/opens
    React.useEffect(() => {
        resetForm();
        setView('list');
        setSelectedPathologyType(null);
        setCurrentStep(0);
    }, [toothNumber]);

    const pathologyTypes = [
        { id: 'decay', label: 'Decay', route: 'decay' },
        { id: 'fracture', label: 'Fracture', route: 'fracture' },
        { id: 'tooth-wear', label: 'Tooth Wear', route: 'tooth-wear' },
        { id: 'discoloration', label: 'Discoloration', route: 'discoloration' },
        { id: 'apical', label: 'Apical', route: 'apical' },
        { id: 'development-disorder', label: 'Development Disorder', route: 'development-disorder' },
    ];

    const handleTypeSelect = (typeId) => {
        if (selectedPathologyType === typeId) {
            setCurrentStep(1);
        } else {
            setSelectedPathologyType(typeId);
            setView('configure');
            resetForm();
            setSelectedPathologyType(typeId); // State update batching handles this safely
            setCurrentStep(1);
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedPathologyType(null);
        resetForm();
    };

    const handleSave = () => {
        if (!tooth) return;

        const updatedPathology = { ...tooth.pathology };
        const {
            selectedZones, decayMaterial, cavitation, cavitationLevel,
            fractureLocation, fractureDirection,
            toothWearType, toothWearSurface,
            discolorationColor,
            apicalPresent,
            developmentDisorderPresent,
            editingIndex
        } = formState;

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0 && decayMaterial && cavitation && cavitationLevel) {
                    const newDecay = {
                        type: `${decayMaterial}-${cavitation}-${cavitationLevel}`,
                        zones: selectedZones
                    };
                    if (editingIndex !== null && updatedPathology.decay && updatedPathology.decay[editingIndex]) {
                        updatedPathology.decay[editingIndex] = newDecay;
                    } else {
                        updatedPathology.decay = [...(updatedPathology.decay || []), newDecay];
                    }
                }
                break;
            case 'fracture':
                if (fractureLocation === 'crown') {
                    updatedPathology.fracture = { ...updatedPathology.fracture, crown: true };
                } else if (fractureLocation === 'root' && fractureDirection) {
                    updatedPathology.fracture = { ...updatedPathology.fracture, root: fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal' };
                }
                break;
            case 'tooth-wear':
                if (toothWearType && toothWearSurface) {
                    updatedPathology.toothWear = {
                        type: toothWearType === 'abrasion' ? 'Abrasion' : 'Erosion',
                        surface: toothWearSurface === 'buccal' ? 'Buccal' : 'Palatal'
                    };
                }
                break;
            case 'discoloration':
                if (discolorationColor) {
                    updatedPathology.discoloration = discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1);
                }
                break;
            case 'apical':
                if (apicalPresent !== null) {
                    updatedPathology.apicalPathology = apicalPresent;
                }
                break;
            case 'development-disorder':
                if (developmentDisorderPresent !== null) {
                    updatedPathology.developmentDisorder = developmentDisorderPresent;
                }
                break;
        }

        updateTooth(toothNumber, { pathology: updatedPathology });
        handleBack();
    };

    const handleEditItem = (type, item, index) => {
        setSelectedPathologyType(type);
        setView('configure');

        loadFormFromItem(type, item, index);

        // Determine step based on type to restore UI state
        if (type === 'decay') {
            setCurrentStep(4);
        } else if (type === 'fracture') {
            // Simple fallback logic
            if (item.crown && !item.root) setCurrentStep(1);
            else if (!item.crown && item.root) setCurrentStep(2);
            else setCurrentStep(1);
        } else if (type === 'tooth-wear') {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    };

    return (
        <div className={`${styles.pathologyDrawer} ${position === 'left' ? styles.left : styles.right}`}>
            <DrawerHeader
                toothNumber={toothNumber}
                onNext={onNext}
                onPrevious={onPrevious}
                onClose={onClose}
            />

            <div className={styles.drawerContent}>
                {view === 'list' ? (
                    <div className={styles.scrollableContent}
                    >
                        <div className={styles.summaryList}>
                            <span className={styles.summaryLabel}>Pathology:</span>
                        </div>
                        <TypeSelector
                            pathologyTypes={pathologyTypes}
                            onTypeSelect={handleTypeSelect}
                        />
                    </div>
                ) : (
                    <PathologyWizard
                        selectedPathologyType={selectedPathologyType}
                        pathologyTypes={pathologyTypes}
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

export default PathologyDrawer;
