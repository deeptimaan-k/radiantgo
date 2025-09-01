import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  error?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  error,
  required = false,
  minDate,
  maxDate,
  className = ''
}) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultMinDate = minDate || today;
  
  // Calculate max date (30 days from today if not specified)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const defaultMaxDate = maxDate || thirtyDaysFromNow.toISOString().split('T')[0];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={defaultMinDate}
          max={defaultMaxDate}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Select a date between today and {new Date(defaultMaxDate).toLocaleDateString()}
      </p>
    </div>
  );
};

export default DatePicker;