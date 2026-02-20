import useChartStore from '../../../store/chartStore';
import usePatientStore from '../../../store/patientStore';
import styles from './PathologyDrawer.module.css';

// Subcomponents
import DrawerHeader from './components/DrawerHeader';
import TypeSelector from './components/TypeSelector';
import PathologyWizard from './components/PathologyWizard';
import { usePathologyForm } from './hooks/usePathologyForm';

const PathologyDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const { teeth, updateTooth } = useChartStore();
    const { addTreatmentPlanItem, selectedPatient } = usePatientStore();
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

        const newItemId = editingIndex !== null ? null : Date.now().toString();
        let procedureString = '';

        switch (selectedPathologyType) {
            case 'decay':
                if (selectedZones.length > 0) {
                    const newDecay = {
                        id: newItemId,
                        status: 'planned',
                        type: `${decayMaterial || '?'}-${cavitation || '?'}-${cavitationLevel || '?'}`,
                        zones: selectedZones
                    };
                    if (editingIndex !== null && updatedPathology.decay && updatedPathology.decay[editingIndex]) {
                        updatedPathology.decay[editingIndex] = { ...updatedPathology.decay[editingIndex], ...newDecay };
                    } else {
                        updatedPathology.decay = [...(updatedPathology.decay || []), newDecay];
                        procedureString = `Decay, ${decayMaterial || 'Unspecified Material'}, ${cavitation || 'Unspecified Cavitation'}, ${cavitationLevel || 'Unspecified Level'}, ${selectedZones.join(', ')}`;
                    }
                }
                break;
            case 'fracture':
                const fractureId = updatedPathology.fracture?.id || newItemId;
                updatedPathology.fracture = updatedPathology.fracture || {};
                if (!updatedPathology.fracture.id && newItemId) updatedPathology.fracture.id = fractureId;
                updatedPathology.fracture.status = updatedPathology.fracture.status || 'planned';

                if (fractureLocation === 'crown') {
                    updatedPathology.fracture.crown = true;
                    if (newItemId) procedureString = `Fracture, Crown`;
                } else if (fractureLocation === 'root' && fractureDirection) {
                    updatedPathology.fracture.root = fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal';
                    if (newItemId) procedureString = `Fracture, Root, ${updatedPathology.fracture.root}`;
                }
                break;
            case 'tooth-wear':
                if (toothWearType || toothWearSurface) {
                    updatedPathology.toothWear = {
                        id: updatedPathology.toothWear?.id || newItemId,
                        status: updatedPathology.toothWear?.status || 'planned',
                        type: toothWearType === 'abrasion' ? 'Abrasion' : (toothWearType === 'erosion' ? 'Erosion' : '?'),
                        surface: toothWearSurface === 'buccal' ? 'Buccal' : (toothWearSurface === 'lingual' ? 'Lingual' : '?')
                    };
                    if (newItemId) procedureString = `Tooth Wear, ${updatedPathology.toothWear.type}, ${updatedPathology.toothWear.surface}`;
                }
                break;
            case 'discoloration':
                if (discolorationColor) {
                    updatedPathology.discoloration = {
                        id: updatedPathology.discoloration?.id || newItemId,
                        status: updatedPathology.discoloration?.status || 'planned',
                        color: discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1)
                    };
                    if (newItemId) procedureString = `Discoloration, ${updatedPathology.discoloration.color}`;
                }
                break;
            case 'apical':
                if (apicalPresent !== null) {
                    updatedPathology.apicalPathology = {
                        id: updatedPathology.apicalPathology?.id || newItemId,
                        status: updatedPathology.apicalPathology?.status || 'planned',
                        present: apicalPresent
                    };
                    if (newItemId) procedureString = `Apical Pathology`;
                }
                break;
            case 'development-disorder':
                if (developmentDisorderPresent !== null) {
                    updatedPathology.developmentDisorder = {
                        id: updatedPathology.developmentDisorder?.id || newItemId,
                        status: updatedPathology.developmentDisorder?.status || 'planned',
                        present: developmentDisorderPresent
                    };
                    if (newItemId) procedureString = `Development Disorder`;
                }
                break;
        }

        updateTooth(toothNumber, { pathology: updatedPathology });

        if (newItemId && procedureString && selectedPatient) {
            addTreatmentPlanItem(selectedPatient.id, {
                id: newItemId,
                tooth: toothNumber,
                procedure: procedureString,
                status: 'planned'
            });
        }

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
