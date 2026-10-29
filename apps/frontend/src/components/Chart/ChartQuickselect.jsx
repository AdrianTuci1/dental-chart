import React, { useState } from 'react';
import { useAppStore } from '../../core/store/appStore';
import { AppFacade } from '../../core/AppFacade';
import { useOutletContext } from 'react-router-dom';

import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

import EndodonticDrawer from '../Drawers/EndodonticDrawer';
import DevelopmentDrawer from '../Drawers/DevelopmentDrawer';
import RestorationDrawer from '../Drawers/RestorationDrawer/RestorationDrawer';

const ChartQuickselect = () => {
    const { teeth, resolvedTeeth, selectTooth } = useAppStore();
    // No longer using updateTeeth from store directly
    const { chartView } = useOutletContext();
    const [selectedTeeth, setSelectedTeeth] = useState(new Set());

    const [isEndoDrawerOpen, setIsEndoDrawerOpen] = useState(false);
    const [isDevDrawerOpen, setIsDevDrawerOpen] = useState(false);
    const [isRestDrawerOpen, setIsRestDrawerOpen] = useState(false);

    const handleToothClick = (toothNumber) => {
        const newSelection = new Set(selectedTeeth);
        if (newSelection.has(toothNumber)) {
            newSelection.delete(toothNumber);
        } else {
            newSelection.add(toothNumber);
        }
        setSelectedTeeth(newSelection);
        selectTooth(toothNumber);
    };

    const handleAction = (action) => {
        if (selectedTeeth.size === 0) return;

        const updates = {};
        selectedTeeth.forEach(toothNumber => {
            const tooth = teeth[toothNumber];
            if (!tooth) return;

            let toothUpdate = {};

            switch (action) {
                case 'extract':
                    toothUpdate = { toBeExtracted: !tooth.toBeExtracted };
                    break;
                case 'missing':
                    toothUpdate = { isMissing: !tooth.isMissing };
                    break;
                case 'veneer':
                    toothUpdate = {
                        restoration: {
                            ...tooth.restoration,
                            veneers: [
                                ...(tooth.restoration?.veneers || []),
                                {
                                    id: `veneer-${toothNumber}-${Date.now()}`,
                                    material: 'Ceramic',
                                    quality: 'Sufficient',
                                    detail: 'Flush',
                                    status: 'completed',
                                },
                            ],
                        },
                    };
                    break;
                case 'pontic':
                    toothUpdate = {
                        restoration: {
                            ...tooth.restoration,
                            crowns: [
                                ...(tooth.restoration?.crowns || []),
                                {
                                    id: `pontic-${toothNumber}-${Date.now()}`,
                                    material: 'Ceramic',
                                    quality: 'Sufficient',
                                    type: 'Pontic',
                                    base: 'Natural',
                                    status: 'completed',
                                },
                            ],
                        },
                    };
                    break;
            }
            updates[toothNumber] = toothUpdate;
        });

        AppFacade.chart.updateTeethBatch(updates);
        setSelectedTeeth(new Set());
    };

    const handleOpenDrawer = (drawerType) => {
        if (selectedTeeth.size === 0) return;
        setIsEndoDrawerOpen(false);
        setIsDevDrawerOpen(false);
        setIsRestDrawerOpen(false);

        if (drawerType === 'endo') {
            setIsEndoDrawerOpen(true);
        } else if (drawerType === 'dev') {
            setIsDevDrawerOpen(true);
        } else if (drawerType === 'restoration') {
            setIsRestDrawerOpen(true);
        }
    };

    const closeDrawers = () => {
        setIsEndoDrawerOpen(false);
        setIsDevDrawerOpen(false);
        setIsRestDrawerOpen(false);
        setSelectedTeeth(new Set()); // clear selection when closing via save/etc
    };

    const renderView = () => {
        const props = {
            resolvedTeeth: resolvedTeeth || {},
            onToothClick: handleToothClick,
            selectedTeeth
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

    // Determine position based on first selected tooth if any
    const getDrawerPosition = () => {
        if (selectedTeeth.size === 0) return 'right';
        const firstTooth = parseInt(Array.from(selectedTeeth)[0]);
        if ((firstTooth >= 11 && firstTooth <= 18) || (firstTooth >= 41 && firstTooth <= 48)) {
            return 'right';
        }
        return 'left';
    };

    return (
        <div className="chart-quickselect-page relative">
            <div className="chart-overview-container">
                {renderView()}
            </div>
            <div className="quickselect-footer">
                <button className="qs-btn" onClick={() => handleAction('extract')}>To be extracted</button>
                <button className="qs-btn" onClick={() => handleAction('missing')}>Missing</button>
                <button className="qs-btn" onClick={() => handleAction('veneer')}>Veneer</button>
                <button className="qs-btn" onClick={() => handleAction('pontic')}>Pontics</button>
                <button className="qs-btn" onClick={() => handleOpenDrawer('restoration')}>Crown &gt;</button>
                <button className="qs-btn" onClick={() => handleOpenDrawer('endo')}>Endo tests &gt;</button>
                <button className="qs-btn" onClick={() => handleOpenDrawer('dev')}>Baby / adult teeth &gt;</button>
            </div>

            {isEndoDrawerOpen && (
                <EndodonticDrawer
                    key={Array.from(selectedTeeth).join('-')}
                    selectedTeeth={Array.from(selectedTeeth)}
                    position={getDrawerPosition()}
                    onClose={closeDrawers}
                />
            )}

            {isDevDrawerOpen && (
                <DevelopmentDrawer
                    selectedTeeth={Array.from(selectedTeeth)}
                    position={getDrawerPosition()}
                    onClose={closeDrawers}
                />
            )}

            {isRestDrawerOpen && (
                <RestorationDrawer
                    selectedTeeth={Array.from(selectedTeeth)}
                    position={getDrawerPosition()}
                    onClose={closeDrawers}
                    initialType="crown"
                />
            )}
        </div>
    );
};

export default ChartQuickselect;
