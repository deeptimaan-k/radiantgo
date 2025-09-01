import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { BookingEvent, BookingStatus } from '../types';
import { formatDateTime } from '../utils/formatting';

interface TimelineProps {
  events: BookingEvent[];
  currentStatus: BookingStatus;
}

const Timeline: React.FC<TimelineProps> = ({ events, currentStatus }) => {
  const getEventIcon = (status: BookingStatus) => {
    switch (status) {
      case 'BOOKED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'DEPARTED':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'ARRIVED':
        return <MapPin className="h-5 w-5 text-violet-600" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventColor = (status: BookingStatus) => {
    switch (status) {
      case 'BOOKED':
        return 'border-blue-200 bg-blue-50';
      case 'DEPARTED':
        return 'border-amber-200 bg-amber-50';
      case 'ARRIVED':
        return 'border-violet-200 bg-violet-50';
      case 'DELIVERED':
        return 'border-green-200 bg-green-50';
      case 'CANCELLED':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Timeline</h3>
      
      <div className="relative">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative flex items-start space-x-4 pb-6"
          >
            {/* Timeline line */}
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-6 top-10 w-0.5 h-full bg-gray-200" />
            )}
            
            {/* Event icon */}
            <div className={`flex-shrink-0 p-2 rounded-full border-2 ${getEventColor(event.status)}`}>
              {getEventIcon(event.status)}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {event.status}
                </h4>
                <time className="text-xs text-gray-500">
                  {formatDateTime(event.timestamp)}
                </time>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                {event.description}
              </p>
              
              {event.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{event.location}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;