import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Thermometer, Shield } from 'lucide-react';
import { CargoDetails, cargoTypes, Dimensions, Insurance, CustomsInfo } from '../types/cargo';
import FormField from './FormField';

interface CargoDetailsFormProps {
  value: Partial<CargoDetails>;
  onChange: (details: Partial<CargoDetails>) => void;
  className?: string;
}

const CargoDetailsForm: React.FC<CargoDetailsFormProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = (typeId: string) => {
    const selectedType = cargoTypes.find(t => t.id === typeId);
    if (selectedType) {
      onChange({ ...value, type: selectedType });
    }
  };

  const handleDimensionsChange = (field: keyof Dimensions, val: string | number) => {
    const dimensions = value.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' as const };
    onChange({
      ...value,
      dimensions: { ...dimensions, [field]: val }
    });
  };

  const handleSpecialRequirementChange = (field: string, checked: boolean) => {
    onChange({ ...value, [field]: checked });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span>Cargo Details</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced Options'}
        </button>
      </div>

      {/* Cargo Type Selection */}
      <FormField label="Cargo Type" required>
        <select
          value={value.type?.id || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">Select cargo type</option>
          {cargoTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name} - {type.description}
            </option>
          ))}
        </select>
      </FormField>

      {/* Special Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={value.dangerous_goods || false}
            onChange={(e) => handleSpecialRequirementChange('dangerous_goods', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Dangerous Goods</span>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={value.temperature_controlled || false}
            onChange={(e) => handleSpecialRequirementChange('temperature_controlled', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Temperature Controlled</span>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={value.fragile || false}
            onChange={(e) => handleSpecialRequirementChange('fragile', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Fragile</span>
          </div>
        </label>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6 border-t border-gray-200 pt-6"
        >
          {/* Dimensions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dimensions (Optional)</h4>
            <div className="grid grid-cols-4 gap-4">
              <FormField label="Length">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={value.dimensions?.length || ''}
                  onChange={(e) => handleDimensionsChange('length', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0"
                />
              </FormField>
              <FormField label="Width">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={value.dimensions?.width || ''}
                  onChange={(e) => handleDimensionsChange('width', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0"
                />
              </FormField>
              <FormField label="Height">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={value.dimensions?.height || ''}
                  onChange={(e) => handleDimensionsChange('height', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0"
                />
              </FormField>
              <FormField label="Unit">
                <select
                  value={value.dimensions?.unit || 'cm'}
                  onChange={(e) => handleDimensionsChange('unit', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="cm">cm</option>
                  <option value="in">inches</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Cargo Value */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo Value (Optional)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.value || ''}
                onChange={(e) => onChange({ ...value, value: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Currency">
              <select
                value={value.currency || 'USD'}
                onChange={(e) => onChange({ ...value, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Cargo Description (Optional)">
            <textarea
              value={value.description || ''}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              rows={3}
              placeholder="Describe your cargo contents..."
            />
          </FormField>
        </motion.div>
      )}

      {/* Handling Requirements Display */}
      {value.type && (value.type.restrictions || value.type.handling_requirements) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Special Requirements</h4>
          {value.type.restrictions && (
            <div className="mb-2">
              <p className="text-xs font-medium text-amber-700">Restrictions:</p>
              <ul className="text-xs text-amber-600 list-disc list-inside">
                {value.type.restrictions.map((restriction, index) => (
                  <li key={index}>{restriction}</li>
                ))}
              </ul>
            </div>
          )}
          {value.type.handling_requirements && (
            <div>
              <p className="text-xs font-medium text-amber-700">Handling Requirements:</p>
              <ul className="text-xs text-amber-600 list-disc list-inside">
                {value.type.handling_requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CargoDetailsForm;