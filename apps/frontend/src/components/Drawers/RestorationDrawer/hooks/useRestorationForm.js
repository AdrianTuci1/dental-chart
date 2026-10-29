import { useState, useCallback } from 'react';

const initialFormState = {
    // Shared
    selectedZones: [],

    // Filling
    fillingMaterial: null,
    fillingQuality: null,

    // Veneer
    veneerMaterial: null,
    veneerQuality: null,
    veneerDetail: null,

    // Crown
    crownMaterial: null,
    crownType: null,
    crownBase: null,
    implantType: null,

    // Meta
    editingIndex: null
};

export const useRestorationForm = () => {
    const [formState, setFormState] = useState(initialFormState);

    const updateForm = useCallback((updates) => {
        setFormState(prev => ({ ...prev, ...updates }));
    }, []);

    const resetForm = useCallback(() => {
        setFormState(initialFormState);
    }, []);

    const loadFormFromItem = useCallback((type, item, index) => {
        const newState = { ...initialFormState, editingIndex: index };

        if (type === 'filling') {
            newState.selectedZones = item.zones || [];
            newState.fillingMaterial = item.material;
            newState.fillingQuality = item.quality;
        } else if (type === 'veneer') {
            newState.selectedZones = item.zones || [];
            newState.veneerMaterial = item.material;
            newState.veneerQuality = item.quality;
            newState.veneerDetail = item.detail;
        } else if (type === 'crown') {
            newState.crownMaterial = item.material;
            newState.crownType = item.type;
            newState.crownBase = item.base;
            if (item.implantType) newState.implantType = item.implantType;
        }

        setFormState(newState);
    }, []);

    return {
        formState,
        updateForm,
        resetForm,
        loadFormFromItem
    };
};
