import React from 'react';
import ToothRenderer from './ToothRenderer';
import { mapToothDataToConditions } from '../../utils/toothUtils';

const JawRow = ({ teeth, view, onToothClick }) => {
    return (
        <div className="flex justify-center items-end gap-1 py-2 overflow-x-auto">
            {teeth.map((tooth) => (
                <div key={tooth.toothNumber} onClick={() => onToothClick(tooth.toothNumber)}>
                    <ToothRenderer
                        toothNumber={tooth.toothNumber}
                        view={view}
                        conditions={mapToothDataToConditions(tooth)}
                        interactive={true}
                        onSurfaceClick={(surface) => console.log(`Clicked surface ${surface} on tooth ${tooth.toothNumber}`)}
                    />
                </div>
            ))}
        </div>
    );
};

export default JawRow;
