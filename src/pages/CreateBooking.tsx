import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, ArrowRight, Calendar, Weight, Hash } from 'lucide-react';
import { useBooking } from '../hooks/useBooking';
import { validateBookingForm } from '../utils/validation';
import { Route, RouteSearchRequest, BookingRequest } from '../types';
import AirportSelector from '../components/AirportSelector';
import DatePicker from '../components/DatePicker';
import RouteCard from '../components/RouteCard';
import CargoDetailsForm from '../components/CargoDetailsForm';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
import { CargoDetails } from '../types/cargo';

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const { routes, selectedRoute, isSearching, isCreating, searchRoutes, createBooking, setSelectedRoute } = useBooking();
  
  const [searchData, setSearchData] = useState<RouteSearchRequest>({
    origin: '',
    destination: '',
    pieces: 1,
    weight: 1,
    departure_date: new Date().toISOString().split('T')[0]
  });
  
  const [cargoDetails, setCargoDetails] = useState<Partial<CargoDetails>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'search' | 'select' | 'details' | 'confirm'>('search');

  const handleInputChange = (field: keyof RouteSearchRequest, value: string | number) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSearch = async () => {
    console.log('Validating form with data:', searchData);
    
    const validationErrors = validateBookingForm({
      origin: searchData.origin,
      destination: searchData.destination,
      pieces: searchData.pieces,
      weight: searchData.weight,
      departure_date: searchData.departure_date
    });

    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(errorMap);
      return;
    }

    setErrors({});
    console.log('Starting route search...');
    await searchRoutes(searchData);
  };
  
  // Update step when routes are found
  React.useEffect(() => {
    if (routes.length > 0 && step === 'search') {
      setStep('select');
    }
  }, [routes, step]);

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setStep('details');
  };

  const handleCreateBooking = async () => {
    if (!selectedRoute) return;

    const bookingData: BookingRequest = {
      origin: searchData.origin,
      destination: searchData.destination,
      pieces: searchData.pieces,
      weight: searchData.weight,
      route_id: selectedRoute.id,
      departure_date: searchData.departure_date,
      cargo_details: cargoDetails,
    };

    const refId = await createBooking(bookingData);
    if (refId) {
      navigate(`/track?ref=${refId}`);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'select':
        setStep('search');
        break;
      case 'details':
        setStep('select');
        break;
      case 'confirm':
        setStep('details');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Booking</h1>
        <p className="text-gray-600">Book your air cargo shipment in a few simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { key: 'search', label: 'Search Routes', icon: Search },
            { key: 'select', label: 'Select Route', icon: ArrowRight },
            { key: 'details', label: 'Cargo Details', icon: Package },
            { key: 'confirm', label: 'Confirm', icon: Hash }
          ].map((stepItem, index) => (
            <div key={stepItem.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === stepItem.key 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : index < ['search', 'select', 'details', 'confirm'].indexOf(step)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
              }`}>
                <stepItem.icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === stepItem.key ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {stepItem.label}
              </span>
              {index < 3 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Search Routes */}
      {step === 'search' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Available Routes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AirportSelector
              label="Origin Airport"
              value={searchData.origin}
              onChange={(code) => handleInputChange('origin', code)}
              placeholder="Search origin airport..."
              error={errors.origin}
              required
            />
            
            <AirportSelector
              label="Destination Airport"
              value={searchData.destination}
              onChange={(code) => handleInputChange('destination', code)}
              placeholder="Search destination airport..."
              error={errors.destination}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DatePicker
              label="Departure Date"
              value={searchData.departure_date}
              onChange={(date) => handleInputChange('departure_date', date)}
              error={errors.departure_date}
              required
            />
            
            <FormField label="Number of Pieces" error={errors.pieces} required>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={searchData.pieces}
                  onChange={(e) => handleInputChange('pieces', parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="1"
                />
              </div>
            </FormField>
            
            <FormField label="Total Weight (kg)" error={errors.weight} required>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={searchData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0.1)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="1.0"
                />
              </div>
            </FormField>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching || !searchData.origin || !searchData.destination}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <Spinner size="small" color="text-white" />
                <span>Searching Routes...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Search Routes</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Step 2: Select Route */}
      {step === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Routes ({routes.length})
            </h2>
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Search
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No routes found for your search criteria</p>
              <button
                onClick={handleBack}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Try Different Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRoute?.id === route.id}
                  onSelect={() => handleRouteSelect(route)}
                />
              ))}
              
              {selectedRoute && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep('details')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Continue with Selected Route</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Cargo Details */}
      {step === 'details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Cargo Details</h2>
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Routes
            </button>
          </div>

          <CargoDetailsForm
            value={cargoDetails}
            onChange={setCargoDetails}
          />

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep('confirm')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>Review Booking</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Confirm Booking */}
      {step === 'confirm' && selectedRoute && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Confirm Your Booking</h2>
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Details
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Route Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Origin:</span>
                    <span className="text-sm font-medium text-gray-900">{searchData.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Destination:</span>
                    <span className="text-sm font-medium text-gray-900">{searchData.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Departure Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(searchData.departure_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Route Type:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedRoute.route_type === 'direct' ? 'Direct Flight' : 'One Transit'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cargo Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pieces:</span>
                    <span className="text-sm font-medium text-gray-900">{searchData.pieces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weight:</span>
                    <span className="text-sm font-medium text-gray-900">{searchData.weight} kg</span>
                  </div>
                  {cargoDetails.type && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium text-gray-900">{cargoDetails.type.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Cost:</span>
                    <span className="text-lg font-bold text-green-600">${selectedRoute.total_cost}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Route Details</h4>
              <RouteCard
                route={selectedRoute}
                isSelected={true}
                onSelect={() => {}}
              />
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={isCreating}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <Spinner size="small" color="text-white" />
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CreateBooking;