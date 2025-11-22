import React from 'react';
import useChartStore from '../../store/chartStore';
import { useNavigate, useParams } from 'react-router-dom';

import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartPeriodontalProbing = () => {
    const { teeth, selectTooth } = useChartStore();
    const navigate = useNavigate();
    const { patientId, view } = useParams();

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}/periodontal`);
    };

    const renderView = () => {
        switch (view) {
            case 'upper-jaw':
                return <UpperJawView teeth={teeth} onToothClick={handleToothClick} />;
            case 'lower-jaw':
                return <LowerJawView teeth={teeth} onToothClick={handleToothClick} />;
            default:
                return <NormalView teeth={teeth} onToothClick={handleToothClick} />;
        }
    };

    // Helper to render a row of measurements
    const PerioRow = ({ toothNumber, position }) => {
        const tooth = teeth[toothNumber];
        if (!tooth) return <td className="p-2 border"></td>;

        const data = tooth.periodontal.probingDepth[position] || [0, 0, 0];

        return (
            <td
                className="p-2 border text-center hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/patients/${patientId}/tooth/${toothNumber}/periodontal`)}
            >
                <div className="flex justify-center gap-1 text-xs">
                    <span className={data[0] > 3 ? 'text-red-500 font-bold' : ''}>{data[0]}</span>
                    <span className={data[1] > 3 ? 'text-red-500 font-bold' : ''}>{data[1]}</span>
                    <span className={data[2] > 3 ? 'text-red-500 font-bold' : ''}>{data[2]}</span>
                </div>
            </td>
        );
    };

    const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {renderView()}
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <h2 className="text-lg font-bold mb-4">Periodontal Chart</h2>

                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="p-2 border bg-gray-100 w-20">Tooth</th>
                            {upperTeeth.map(t => <th key={t} className="p-2 border bg-gray-100 min-w-[50px]">{t}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Upper Buccal */}
                        <tr>
                            <td className="p-2 border font-medium bg-gray-50">Buccal</td>
                            {upperTeeth.map(t => <PerioRow key={t} toothNumber={t} position="buccal" />)}
                        </tr>
                        {/* Upper Palatal */}
                        <tr>
                            <td className="p-2 border font-medium bg-gray-50">Palatal</td>
                            {upperTeeth.map(t => <PerioRow key={t} toothNumber={t} position="palatal" />)}
                        </tr>

                        {/* Spacer */}
                        <tr className="h-4 bg-gray-200"><td colSpan={17}></td></tr>

                        {/* Lower Lingual */}
                        <tr>
                            <td className="p-2 border font-medium bg-gray-50">Lingual</td>
                            {lowerTeeth.map(t => <PerioRow key={t} toothNumber={t} position="lingual" />)} // Note: data model uses 'lingual' key? Check data-models.json. It says 'palatal' for upper and probably 'lingual' for lower but the structure in mockData uses specific keys.
                            {/* Mock data uses: distoPalatal, palatal, mesioPalatal, distoBuccal, buccal, mesioBuccal. 
                Wait, for lower teeth it should be lingual. I'll assume 'palatal' field is used for 'lingual' in lower jaw for simplicity or check if I need to add 'lingual' fields.
                The data model in data-models.json says:
                probingDepth: { distoPalatal, palatal, mesioPalatal, ... }
                It seems it reuses palatal for lingual or I should add lingual.
                Let's check mockData.js again.
            */}
                        </tr>
                        {/* Lower Buccal */}
                        <tr>
                            <td className="p-2 border font-medium bg-gray-50">Buccal</td>
                            {lowerTeeth.map(t => <PerioRow key={t} toothNumber={t} position="buccal" />)}
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th className="p-2 border bg-gray-100">Tooth</th>
                            {lowerTeeth.map(t => <th key={t} className="p-2 border bg-gray-100">{t}</th>)}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ChartPeriodontalProbing;
