import { useState } from 'react';

const initialFormState = {
    selectedZones: [],
    decayMaterial: null,
    cavitation: null,
    cavitationLevel: null,
    fractureLocation: null,
    fractureDirection: null,
    toothWearType: null,
    toothWearSurface: null,
    discolorationColor: null,
    apicalPresent: null,
    developmentDisorderPresent: null,
    editingIndex: null,
};

export const usePathologyForm = () => {
    const [formState, setFormState] = useState(initialFormState);

    const updateForm = (updates) => {
        setFormState(prev => ({ ...prev, ...updates }));
    };

    const resetForm = () => {
        setFormState(initialFormState);
    };

    const loadFormFromItem = (type, item, index) => {
        resetForm();
        // Use timeout to allow state reset to process before setting new values
        // or manually merge with initial state to ensure clean slate
        const cleanState = { ...initialFormState, editingIndex: index };

        if (type === 'decay') {
            const parts = item.type.split('-');
            cleanState.decayMaterial = parts[0];
            if (parts[1] === 'no') {
                cleanState.cavitation = 'no-cavitation';
                cleanState.cavitationLevel = parts[3];
            } else {
                cleanState.cavitation = 'cavitation';
                cleanState.cavitationLevel = parts[2];
            }
            cleanState.selectedZones = item.zones;
        } else if (type === 'fracture') {
            if (item.crown) cleanState.fractureLocation = 'crown';
            if (item.root) {
                cleanState.fractureLocation = 'root';
                cleanState.fractureDirection = item.root === 'Vertical' ? 'vertical' : 'horizontal';
            }
        } else if (type === 'tooth-wear') {
            cleanState.toothWearType = item.type.toLowerCase();
            cleanState.toothWearSurface = item.surface.toLowerCase();
        } else if (type === 'discoloration') {
            cleanState.discolorationColor = item.toLowerCase();
        } else if (type === 'apical') {
            cleanState.apicalPresent = item;
        } else if (type === 'development-disorder') {
            cleanState.developmentDisorderPresent = item;
        }

        setFormState(cleanState);
    };

    return {
        formState,
        updateForm,
        resetForm,
        loadFormFromItem
    };
};
