import React from 'react';
import { useOutletContext } from 'react-router-dom';
import useChartStore from '../../store/chartStore';

const ToothEndodontic = () => {
    const { tooth } = useOutletContext();
    const { updateTooth } = useChartStore();

    const handleTestChange = (test, value) => {
        updateTooth(tooth.toothNumber, {
            endodontic: {
                ...tooth.endodontic,
                tests: {
                    ...tooth.endodontic.tests,
                    [test]: value
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Endodontic Tests</h3>
                <div className="flex items-center">
                    <input
                        id="hasRootCanal"
                        type="checkbox"
                        checked={tooth.endodontic.hasRootCanal}
                        onChange={(e) => updateTooth(tooth.toothNumber, {
                            endodontic: { ...tooth.endodontic, hasRootCanal: e.target.checked }
                        })}
                        className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                    />
                    <label htmlFor="hasRootCanal" className="ml-2 block text-sm text-gray-900">
                        Root Canal Present
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Cold Test */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cold Test</label>
                    <div className="flex gap-4">
                        {['normal', 'sensitive', 'no-response'].map((val) => (
                            <label key={val} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="cold"
                                    value={val}
                                    checked={tooth.endodontic.tests.cold === val}
                                    onChange={(e) => handleTestChange('cold', e.target.value)}
                                    className="form-radio text-[var(--color-primary)]"
                                />
                                <span className="ml-2 capitalize">{val.replace('-', ' ')}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Heat Test */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heat Test</label>
                    <div className="flex gap-4">
                        {['normal', 'sensitive', 'no-response'].map((val) => (
                            <label key={val} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="heat"
                                    value={val}
                                    checked={tooth.endodontic.tests.heat === val}
                                    onChange={(e) => handleTestChange('heat', e.target.value)}
                                    className="form-radio text-[var(--color-primary)]"
                                />
                                <span className="ml-2 capitalize">{val.replace('-', ' ')}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Percussion */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Percussion</label>
                    <div className="flex gap-4">
                        {['normal', 'sensitive', 'painful'].map((val) => (
                            <label key={val} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="percussion"
                                    value={val}
                                    checked={tooth.endodontic.tests.percussion === val}
                                    onChange={(e) => handleTestChange('percussion', e.target.value)}
                                    className="form-radio text-[var(--color-primary)]"
                                />
                                <span className="ml-2 capitalize">{val}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* EPT */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Electric Pulp Test (EPT)</label>
                    <input
                        type="number"
                        min="0"
                        max="80"
                        value={tooth.endodontic.tests.electricity}
                        onChange={(e) => handleTestChange('electricity', parseInt(e.target.value))}
                        className="block w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm p-2 border"
                    />
                </div>
            </div>
        </div>
    );
};

export default ToothEndodontic;
