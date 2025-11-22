import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const EditBPEDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        upperRight: data?.upperRight || 0,
        upperAnterior: data?.upperAnterior || 0,
        upperLeft: data?.upperLeft || 0,
        lowerRight: data?.lowerRight || 0,
        lowerAnterior: data?.lowerAnterior || 0,
        lowerLeft: data?.lowerLeft || 0
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const renderSelect = (name, label) => (
        <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1 uppercase">{label}</label>
            <select
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                {[0, 1, 2, 3, 4, '*'].map(val => (
                    <option key={val} value={val}>{val}</option>
                ))}
            </select>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Edit BPE Scores</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {renderSelect('upperRight', 'Upper Right')}
                        {renderSelect('upperAnterior', 'Upper Anterior')}
                        {renderSelect('upperLeft', 'Upper Left')}

                        {renderSelect('lowerRight', 'Lower Right')}
                        {renderSelect('lowerAnterior', 'Lower Anterior')}
                        {renderSelect('lowerLeft', 'Lower Left')}
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

export default EditBPEDialog;
