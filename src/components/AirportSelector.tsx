import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Plane } from 'lucide-react';
import { searchAirports, getAirportByCode, Airport } from '../data/airports';

interface AirportSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

const AirportSelector: React.FC<AirportSelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Search airports...',
  error,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAirport = getAirportByCode(value);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = searchAirports(searchQuery);
      setSuggestions(results);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsOpen(true);
    
    // If user types a 3-letter code directly
    if (query.length === 3) {
      const airport = getAirportByCode(query);
      if (airport) {
        onChange(airport.code);
        setIsOpen(false);
        setSearchQuery('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectAirport(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        break;
    }
  };

  const selectAirport = (airport: Airport) => {
    onChange(airport.code);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!searchQuery && suggestions.length === 0) {
      // Show popular airports when focused without search
      setSuggestions(searchAirports('').slice(0, 8));
    }
  };

  const clearSelection = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {selectedAirport ? (
            <Plane className="h-5 w-5 text-blue-600" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={selectedAirport ? `${selectedAirport.code} - ${selectedAirport.city}` : searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-colors ${
            error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent' 
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
          placeholder={selectedAirport ? `${selectedAirport.code} - ${selectedAirport.city}` : placeholder}
          autoComplete="off"
        />
        
        {selectedAirport && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((airport, index) => (
              <motion.div
                key={airport.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectAirport(airport)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{airport.code}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{airport.code}</span>
                      <span className="text-sm text-gray-600">{airport.city}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{airport.name}</p>
                    <p className="text-xs text-gray-400">{airport.country}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
            
            {searchQuery && suggestions.length === 0 && (
              <div className="px-4 py-3 text-center text-gray-500">
                <Search className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No airports found for "{searchQuery}"</p>
                <p className="text-xs text-gray-400 mt-1">Try searching by airport code, city, or country</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {selectedAirport && (
        <p className="mt-1 text-xs text-gray-500">
          {selectedAirport.name} • {selectedAirport.country}
        </p>
      )}
    </div>
  );
};

export default AirportSelector;