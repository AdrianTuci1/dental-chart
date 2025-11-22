import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const EditMedicalIssuesDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        highBloodPressure: data?.highBloodPressure || false,
        asthma: data?.asthma || false,
        acidReflux: data?.acidReflux || false,
        tobaccoUse: data?.tobaccoUse || false,
        alcoholUse: data?.alcoholUse || false,
        other: data?.other ? data.other.join(', ') : ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const processedData = {
            ...formData,
            other: formData.other.split(',').map(item => item.trim()).filter(item => item !== '')
        };
        onSave(processedData);
        onClose();
    };

    const renderCheckbox = (name, label) => (
        <div className="flex items-center mb-3">
            <input
                type="checkbox"
                id={name}
                name={name}
                checked={formData[name]}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
                {label}
            </label>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Medical Issues</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        {renderCheckbox('highBloodPressure', 'High Blood Pressure')}
                        {renderCheckbox('asthma', 'Asthma')}
                        {renderCheckbox('acidReflux', 'Acid Reflux')}
                        {renderCheckbox('tobaccoUse', 'Tobacco Use')}
                        {renderCheckbox('alcoholUse', 'Alcohol Use')}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Other Issues (comma separated)
                        </label>
                        <textarea
                            name="other"
                            value={formData.other}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Diabetes, Allergies..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditMedicalIssuesDialog;
