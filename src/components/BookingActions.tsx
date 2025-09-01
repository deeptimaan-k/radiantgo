import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { useBooking } from '../hooks/useBooking';
import Spinner from './Spinner';

interface BookingActionsProps {
  booking: Booking;
  onUpdate?: (updatedBooking: Booking) => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({ booking, onUpdate }) => {
  const { updateBookingStatus } = useBooking();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [location, setLocation] = useState('');

  const handleStatusUpdate = async (status: string, data: any = {}) => {
    setIsUpdating(true);
    try {
      const updatedBooking = await updateBookingStatus(booking.ref_id, status, data);
      if (onUpdate) {
        onUpdate(updatedBooking);
      }
      setShowLocationInput(false);
      setLocation('');
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (booking.status) {
      case 'BOOKED':
        actions.push({
          label: 'Mark as Departed',
          action: () => handleStatusUpdate('depart', { 
            location: booking.origin,
            flight_info: { flight_number: 'AI101', airline: 'Air India' }
          }),
          icon: Plane,
          color: 'bg-amber-600 hover:bg-amber-700'
        });
        actions.push({
          label: 'Cancel Booking',
          action: () => handleStatusUpdate('cancel', { reason: 'Customer request' }),
          icon: XCircle,
          color: 'bg-red-600 hover:bg-red-700'
        });
        break;

      case 'DEPARTED':
        actions.push({
          label: 'Mark as Arrived',
          action: () => handleStatusUpdate('arrive', { 
            location: booking.destination,
            flight_info: { flight_number: 'AI101', airline: 'Air India' }
          }),
          icon: MapPin,
          color: 'bg-violet-600 hover:bg-violet-700'
        });
        actions.push({
          label: 'Cancel Booking',
          action: () => handleStatusUpdate('cancel', { reason: 'Flight cancelled' }),
          icon: XCircle,
          color: 'bg-red-600 hover:bg-red-700'
        });
        break;

      case 'ARRIVED':
        actions.push({
          label: 'Mark as Delivered',
          action: () => handleStatusUpdate('deliver', { location: booking.destination }),
          icon: CheckCircle,
          color: 'bg-green-600 hover:bg-green-700'
        });
        break;

      default:
        return [];
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
      
      <div className="space-y-3">
        {availableActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            disabled={isUpdating}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
          >
            {isUpdating ? (
              <>
                <Spinner size="small" color="text-white" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {booking.status === 'DELIVERED' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Shipment completed successfully!
            </span>
          </div>
        </div>
      )}

      {booking.status === 'CANCELLED' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              This booking has been cancelled
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookingActions;