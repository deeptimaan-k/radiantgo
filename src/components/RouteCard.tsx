import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Plane, MapPin } from 'lucide-react';
import { Route } from '../types';
import { formatCurrency, formatDuration, formatTime } from '../utils/formatting';

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect }) => {
  const isDirect = route.route_type === 'direct';
  const isTransit = route.route_type === 'one_transit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border rounded-xl p-6 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isDirect ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {isDirect ? 'Direct Flight' : 'One Transit'}
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(route.total_cost)}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{formatDuration(route.total_duration)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {route.flights.map((flight, index) => (
          <div key={flight.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{flight.origin}</p>
                  <p className="text-xs text-gray-500">{formatTime(flight.departure_time)}</p>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-400">
                  <Plane className="h-4 w-4" />
                  <div className="text-center">
                    <p className="text-xs font-medium">{flight.flight_number}</p>
                    <p className="text-xs text-gray-500">{flight.airline}</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{flight.destination}</p>
                  <p className="text-xs text-gray-500">{formatTime(flight.arrival_time)}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(flight.cost)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDuration(flight.duration)}
                </p>
              </div>
            </div>
            
            {/* Transit connection indicator */}
            {isTransit && index < route.flights.length - 1 && (
              <div className="flex items-center justify-center mt-3 mb-1">
                <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  <MapPin className="h-3 w-3" />
                  <span>Transit at {flight.destination}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RouteCard;