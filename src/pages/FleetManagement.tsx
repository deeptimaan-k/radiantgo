import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  Users, 
  Fuel,
  Settings,
  Calendar
} from 'lucide-react';

interface Aircraft {
  id: string;
  registration: string;
  model: string;
  airline: string;
  capacity: {
    weight: number;
    volume: number;
  };
  status: 'active' | 'maintenance' | 'grounded';
  location: string;
  nextFlight?: {
    flight_number: string;
    departure: string;
    destination: string;
  };
  maintenance: {
    lastCheck: string;
    nextCheck: string;
    hoursFlown: number;
  };
}

const FleetManagement: React.FC = () => {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Simulate loading fleet data
    setTimeout(() => {
      setAircraft([
        {
          id: '1',
          registration: 'VT-ANL',
          model: 'Boeing 777F',
          airline: 'Air India Cargo',
          capacity: { weight: 103000, volume: 858 },
          status: 'active',
          location: 'DEL',
          nextFlight: {
            flight_number: 'AI7001',
            departure: '2024-01-16T14:30:00Z',
            destination: 'BOM'
          },
          maintenance: {
            lastCheck: '2024-01-01',
            nextCheck: '2024-04-01',
            hoursFlown: 2450
          }
        },
        {
          id: '2',
          registration: 'VT-ALG',
          model: 'Airbus A330F',
          airline: 'Air India Cargo',
          capacity: { weight: 70000, volume: 475 },
          status: 'maintenance',
          location: 'BOM',
          maintenance: {
            lastCheck: '2024-01-10',
            nextCheck: '2024-02-10',
            hoursFlown: 1890
          }
        },
        {
          id: '3',
          registration: 'VT-IFG',
          model: 'Boeing 737F',
          airline: 'SpiceJet Cargo',
          capacity: { weight: 23000, volume: 140 },
          status: 'active',
          location: 'BLR',
          nextFlight: {
            flight_number: 'SG8001',
            departure: '2024-01-16T09:15:00Z',
            destination: 'MAA'
          },
          maintenance: {
            lastCheck: '2023-12-15',
            nextCheck: '2024-03-15',
            hoursFlown: 3200
          }
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'grounded': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const AircraftCard = ({ aircraft }: { aircraft: Aircraft }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plane className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{aircraft.registration}</h3>
            <p className="text-sm text-gray-600">{aircraft.model}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(aircraft.status)}`}>
            {aircraft.status.toUpperCase()}
          </span>
          <button
            onClick={() => setSelectedAircraft(aircraft)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Max Weight</p>
          <p className="font-medium text-gray-900">{aircraft.capacity.weight.toLocaleString()} kg</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Max Volume</p>
          <p className="font-medium text-gray-900">{aircraft.capacity.volume} m³</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Currently at {aircraft.location}</span>
        </div>
        {aircraft.nextFlight && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Clock className="h-4 w-4" />
            <span>Next: {aircraft.nextFlight.flight_number}</span>
          </div>
        )}
      </div>

      {aircraft.status === 'maintenance' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Scheduled maintenance until {new Date(aircraft.maintenance.nextCheck).toLocaleDateString()}
          </p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600">Manage your aircraft fleet and maintenance schedules</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Aircraft</span>
        </button>
      </div>

      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Aircraft</p>
              <p className="text-2xl font-bold text-gray-900">{aircraft.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {aircraft.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Settings className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">
                {aircraft.filter(a => a.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Fuel className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aircraft Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aircraft.map(plane => (
            <AircraftCard key={plane.id} aircraft={plane} />
          ))}
        </div>
      )}

      {/* Aircraft Details Modal */}
      {selectedAircraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedAircraft.registration} Details
              </h3>
              <button
                onClick={() => setSelectedAircraft(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Aircraft Model</p>
                  <p className="font-medium text-gray-900">{selectedAircraft.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Airline</p>
                  <p className="font-medium text-gray-900">{selectedAircraft.airline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Location</p>
                  <p className="font-medium text-gray-900">{selectedAircraft.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedAircraft.status)}`}>
                    {selectedAircraft.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Capacity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Maximum Weight</p>
                    <p className="text-xl font-bold text-blue-900">{selectedAircraft.capacity.weight.toLocaleString()} kg</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">Maximum Volume</p>
                    <p className="text-xl font-bold text-purple-900">{selectedAircraft.capacity.volume} m³</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Check:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedAircraft.maintenance.lastCheck).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Next Check:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedAircraft.maintenance.nextCheck).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hours Flown:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedAircraft.maintenance.hoursFlown.toLocaleString()} hrs
                    </span>
                  </div>
                </div>
              </div>

              {selectedAircraft.nextFlight && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Next Flight</h4>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-900">{selectedAircraft.nextFlight.flight_number}</p>
                        <p className="text-sm text-green-700">
                          To {selectedAircraft.nextFlight.destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-700">Departure</p>
                        <p className="font-medium text-green-900">
                          {new Date(selectedAircraft.nextFlight.departure).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setSelectedAircraft(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Aircraft
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;