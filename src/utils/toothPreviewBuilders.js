const cloneData = (value, fallback = {}) => {
    try {
        return JSON.parse(JSON.stringify(value ?? fallback));
    } catch {
        return fallback;
    }
};

export const buildPathologyPreview = (tooth, selectedPathologyType, formState) => {
    if (!tooth || !selectedPathologyType) {
        return null;
    }

    const previewPathology = cloneData(tooth.pathology, {});
    let isValidPreview = false;

    const {
        selectedZones,
        decayMaterial,
        cavitation,
        cavitationLevel,
        fractureLocation,
        fractureDirection,
        toothWearType,
        toothWearSurface,
        discolorationColor,
        apicalPresent,
        developmentDisorderPresent,
    } = formState;

    switch (selectedPathologyType) {
        case 'decay':
            if (selectedZones.length > 0) {
                const newDecay = {
                    type: `${decayMaterial || '?'}-${cavitation || '?'}-${cavitationLevel || '?'}`,
                    zones: selectedZones,
                };
                previewPathology.decay = [...(previewPathology.decay || []), newDecay];
                isValidPreview = true;
            }
            break;
        case 'fracture':
            previewPathology.fracture = previewPathology.fracture || {};
            if (fractureLocation === 'crown') {
                previewPathology.fracture.crown = true;
                isValidPreview = true;
            } else if (fractureLocation === 'root' && fractureDirection) {
                previewPathology.fracture.root = fractureDirection === 'vertical' ? 'Vertical' : 'Horizontal';
                isValidPreview = true;
            }
            break;
        case 'tooth-wear':
            if (toothWearType && toothWearSurface) {
                previewPathology.toothWear = {
                    type: toothWearType === 'abrasion' ? 'Abrasion' : 'Erosion',
                    surface: toothWearSurface === 'buccal' ? 'Buccal' : 'Lingual',
                };
                isValidPreview = true;
            }
            break;
        case 'discoloration':
            if (discolorationColor) {
                previewPathology.discoloration = {
                    color: discolorationColor.charAt(0).toUpperCase() + discolorationColor.slice(1),
                };
                isValidPreview = true;
            }
            break;
        case 'apical':
            if (apicalPresent !== null) {
                previewPathology.apicalPathology = {
                    present: apicalPresent,
                };
                isValidPreview = true;
            }
            break;
        case 'development-disorder':
            if (developmentDisorderPresent !== null) {
                previewPathology.developmentDisorder = {
                    present: developmentDisorderPresent,
                };
                isValidPreview = true;
            }
            break;
        default:
            break;
    }

    if (!isValidPreview) {
        return null;
    }

    return {
        ...tooth,
        pathology: previewPathology,
    };
};

export const buildRestorationPreview = (tooth, selectedRestorationType, formState) => {
    if (!tooth || !selectedRestorationType) {
        return null;
    }

    const previewRestoration = cloneData(tooth.restoration, {});
    let isValidPreview = false;

    const {
        selectedZones,
        fillingMaterial,
        fillingQuality,
        veneerMaterial,
        veneerQuality,
        veneerDetail,
        crownMaterial,
        crownType,
        crownBase,
        implantType,
        advancedMaterial,
        advancedQuality,
        advancedDetail,
    } = formState;

    switch (selectedRestorationType) {
        case 'filling':
            if (fillingMaterial || selectedZones.length > 0) {
                previewRestoration.fillings = [
                    ...(previewRestoration.fillings || []),
                    {
                        zones: selectedZones,
                        material: fillingMaterial || 'Composite',
                        quality: fillingQuality || 'Sufficient',
                    },
                ];
                isValidPreview = true;
            }
            break;
        case 'veneer':
            if (veneerMaterial || selectedZones.length > 0) {
                previewRestoration.veneers = [
                    ...(previewRestoration.veneers || []),
                    {
                        zones: selectedZones,
                        material: veneerMaterial || 'Ceramic',
                        quality: veneerQuality || 'Sufficient',
                        detail: veneerDetail || 'Flush',
                    },
                ];
                isValidPreview = true;
            }
            break;
        case 'crown':
            if (crownMaterial) {
                const previewCrown = {
                    material: crownMaterial,
                    quality: 'Sufficient',
                    type: crownType || 'Single Crown',
                    base: crownBase || 'Natural',
                };

                if (crownBase === 'Implant' && implantType) {
                    previewCrown.implantType = implantType;
                }

                previewRestoration.crowns = [
                    ...(previewRestoration.crowns || []),
                    previewCrown,
                ];
                isValidPreview = true;
            }
            break;
        case 'inlay':
        case 'onlay':
        case 'partial_crown':
            if (advancedMaterial || selectedZones.length > 0) {
                previewRestoration.advancedRestorations = [
                    ...(previewRestoration.advancedRestorations || []),
                    {
                        type: selectedRestorationType,
                        zones: selectedZones,
                        material: advancedMaterial || 'Ceramic',
                        quality: advancedQuality || 'Sufficient',
                        detail: advancedDetail || 'Flush',
                    },
                ];
                isValidPreview = true;
            }
            break;
        default:
            break;
    }

    if (!isValidPreview) {
        return null;
    }

    return {
        ...tooth,
        restoration: previewRestoration,
    };
};
