import React from 'react';
import useChartStore from '../../store/chartStore';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';

import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartQuickselect = () => {
    const { teeth, selectTooth, updateTeeth } = useChartStore();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { chartView } = useOutletContext();
    const [selectedTeeth, setSelectedTeeth] = React.useState(new Set());

    const handleToothClick = (toothNumber) => {
        // Toggle selection
        const newSelection = new Set(selectedTeeth);
        if (newSelection.has(toothNumber)) {
            newSelection.delete(toothNumber);
        } else {
            newSelection.add(toothNumber);
        }
        setSelectedTeeth(newSelection);

        // Also update global selection for single view navigation if needed, 
        // but for quickselect we primarily want multiselect.
        // We can keep the last selected as the "active" one if we want to navigate.
        // But the requirement says "multiselect on all views", implying we stay on the page.
        // If we want to navigate to detail, maybe double click? 
        // For now, let's just handle selection.
        selectTooth(toothNumber);
    };

    const handleAction = (action, payload = {}) => {
        if (selectedTeeth.size === 0) return;

        const updates = {};
        selectedTeeth.forEach(toothNumber => {
            const tooth = teeth[toothNumber];
            if (!tooth) return;

            // Create a clone to modify
            // Note: updateTeeth expects an object of updates per tooth
            // We need to construct the update object for the tooth

            // Since our models are classes, we need to be careful.
            // The store's updateTooth/updateTeeth merges properties.
            // For complex nested objects like restoration, we might need to clone the specific sub-object.

            let toothUpdate = {};

            switch (action) {
                case 'extract':
                    toothUpdate = { toBeExtracted: !tooth.toBeExtracted };
                    break;
                case 'missing':
                    toothUpdate = { isMissing: !tooth.isMissing };
                    break;
                case 'veneer':
                    // Add a default veneer
                    const newRestorationVeneer = Object.assign(
                        Object.create(Object.getPrototypeOf(tooth.restoration)),
                        tooth.restoration
                    );
                    // Check if already has veneer to toggle? Or just add?
                    // Requirement implies adding. Let's add a default one.
                    newRestorationVeneer.addVeneer('Ceramic', 'Sufficient', 'Flush');
                    toothUpdate = { restoration: newRestorationVeneer };
                    break;
                case 'pontic':
                    const newRestorationPontic = Object.assign(
                        Object.create(Object.getPrototypeOf(tooth.restoration)),
                        tooth.restoration
                    );
                    newRestorationPontic.addCrown('Ceramic', 'Sufficient', 'Pontic', 'Natural');
                    toothUpdate = { restoration: newRestorationPontic };
                    break;
                // Add other cases here
            }
            updates[toothNumber] = toothUpdate;
        });

        updateTeeth(updates);
        setSelectedTeeth(new Set()); // Clear selection after action? Or keep it? keeping it might be better for multiple actions.
        // Let's clear for now to give feedback that action is done.
    };

    const renderView = () => {
        const props = {
            teeth,
            onToothClick: handleToothClick,
            selectedTeeth // Pass the Set
        };

        switch (chartView) {
            case 'upper':
                return <UpperJawView {...props} />;
            case 'lower':
                return <LowerJawView {...props} />;
            default:
                return <NormalView {...props} />;
        }
    };

    return (
        <div className="chart-quickselect-page">
            <div className="chart-overview-container">
                {renderView()}
            </div>
            <div className="quickselect-footer">
                <button className="qs-btn" onClick={() => handleAction('extract')}>To be extracted</button>
                <button className="qs-btn" onClick={() => handleAction('missing')}>Missing</button>
                <button className="qs-btn" onClick={() => handleAction('veneer')}>Veneer</button>
                <button className="qs-btn" onClick={() => handleAction('pontic')}>Pontics</button>
                <button className="qs-btn">Crown &gt;</button>
                <button className="qs-btn">Endo tests &gt;</button>
                <button className="qs-btn">Baby / adult teeth &gt;</button>
            </div>
        </div>
    );
};

export default ChartQuickselect;
