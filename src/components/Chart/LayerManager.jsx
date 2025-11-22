import React from 'react';
import useChartStore from '../../store/chartStore';
import { Layers, Eye, EyeOff } from 'lucide-react';

const LayerManager = () => {
    const { showEndo, showPerio, showDental, toggleLayer } = useChartStore();

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
                <Layers size={18} />
                <span>View Layers</span>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => toggleLayer('dental')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${showDental ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {showDental ? <Eye size={14} /> : <EyeOff size={14} />}
                    Dental
                </button>

                <button
                    onClick={() => toggleLayer('perio')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${showPerio ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {showPerio ? <Eye size={14} /> : <EyeOff size={14} />}
                    Perio
                </button>

                <button
                    onClick={() => toggleLayer('endo')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${showEndo ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {showEndo ? <Eye size={14} /> : <EyeOff size={14} />}
                    Endo
                </button>
            </div>
        </div>
    );
};

export default LayerManager;
