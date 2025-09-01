import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Package, Weight } from 'lucide-react';
import { Booking } from '../types';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatWeight } from '../utils/formatting';

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Booking #{booking.ref_id}
          </h3>
          <p className="text-sm text-gray-500">
            Created {formatDateTime(booking.created_at)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{booking.origin}</p>
            <p className="text-xs text-gray-500">Origin</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{booking.destination}</p>
            <p className="text-xs text-gray-500">Destination</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{booking.pieces}</p>
            <p className="text-xs text-gray-500">Pieces</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Weight className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{formatWeight(booking.weight)}</p>
            <p className="text-xs text-gray-500">Total Weight</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCard;