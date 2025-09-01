import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, RefreshCw } from 'lucide-react';
import { useBooking } from '../hooks/useBooking';
import { validateRefId } from '../utils/validation';
import { Booking } from '../types';
import FormField from '../components/FormField';
import BookingCard from '../components/BookingCard';
import BookingActions from '../components/BookingActions';
import Timeline from '../components/Timeline';
import WeatherWidget from '../components/WeatherWidget';
import Spinner from '../components/Spinner';

const TrackBooking: React.FC = () => {
  const { booking, isTracking, trackBooking, resetBooking } = useBooking();
  const [searchParams] = useSearchParams();
  const [refId, setRefId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-populate ref_id from URL params
  const [hasAutoTracked, setHasAutoTracked] = useState(false);

  React.useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl && !hasAutoTracked) {
      setRefId(refFromUrl);
      trackBooking(refFromUrl);
      setHasAutoTracked(true);
    }
  }, [searchParams, trackBooking, hasAutoTracked]);

  const handleSearch = async () => {
    const validationErrors = validateRefId(refId);
    
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(errorMap);
      return;
    }

    setErrors({});
    setHasAutoTracked(true);
    await trackBooking(refId);
  };

  const handleRefresh = async () => {
    if (booking) {
      await trackBooking(booking.ref_id);
    }
  };

  const handleBookingUpdate = (updatedBooking: Booking) => {
    // The booking state will be updated through the useBooking hook
    // This callback can be used for additional UI updates if needed
  };

  const handleReset = () => {
    setRefId('');
    setErrors({});
    setHasAutoTracked(false);
    resetBooking();
    // Clear URL params
    window.history.replaceState({}, '', '/track');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Booking</h1>
        <p className="text-gray-600">Enter your booking reference ID to track your air cargo shipment</p>
      </div>

      {!booking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <div className="max-w-md mx-auto">
            <FormField label="Booking Reference ID" error={errors.refId} required>
              <input
                type="text"
                value={refId}
                onChange={(e) => {
                  setRefId(e.target.value.toUpperCase());
                  if (errors.refId) {
                    setErrors(prev => ({ ...prev, refId: '' }));
                  }
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-center"
                placeholder="e.g., RG12345678"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">Format: RG followed by 8 characters</p>
            </FormField>

            <button
              onClick={handleSearch}
              disabled={isTracking || !refId.trim()}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isTracking ? (
                <>
                  <Spinner size="small" color="text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Track Booking</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Package className="h-6 w-6 text-blue-600" />
                <span>Booking Details</span>
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isTracking}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isTracking ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Track Another Booking
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BookingCard booking={booking} />
              </div>
              <div>
                <div className="space-y-6">
                  <BookingActions booking={booking} onUpdate={handleBookingUpdate} />
                  
                  {/* Weather Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Current Weather</h3>
                    <div className="space-y-3">
                      <WeatherWidget airportCode={booking.origin} />
                      {booking.origin !== booking.destination && (
                        <WeatherWidget airportCode={booking.destination} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {booking.events && booking.events.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
              >
                <Timeline events={booking.events} currentStatus={booking.status} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackBooking;