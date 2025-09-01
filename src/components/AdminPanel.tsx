import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plane, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  BarChart3, 
  Settings, 
  FileText, 
  Shield,
  Bell,
  Download,
  Filter,
  Search,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../lib/api';
import { Booking, BookingStatus } from '../types';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '../utils/formatting';
import toast from 'react-hot-toast';

interface AdminStats {
  totalBookings: number;
  activeBookings: number;
  deliveredBookings: number;
  cancelledBookings: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const AdminPanel: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    activeBookings: 0,
    deliveredBookings: 0,
    cancelledBookings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
    loadSystemAlerts();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const allBookings = await apiService.getAllBookings();
      setBookings(allBookings);
      
      // Calculate stats
      const newStats = {
        totalBookings: allBookings.length,
        activeBookings: allBookings.filter(b => ['BOOKED', 'DEPARTED', 'ARRIVED'].includes(b.status)).length,
        deliveredBookings: allBookings.filter(b => b.status === 'DELIVERED').length,
        cancelledBookings: allBookings.filter(b => b.status === 'CANCELLED').length
      };
      setStats(newStats);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    // Simulate loading system alerts
    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'High Volume Route',
        message: 'DEL → BOM route is experiencing high booking volume. Consider adding more flights.',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Maintenance Scheduled',
        message: 'Aircraft VT-ANL scheduled for maintenance on Jan 20, 2024.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false
      },
      {
        id: '3',
        type: 'error',
        title: 'Payment Failed',
        message: 'Payment processing failed for booking RG12345678. Customer notified.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        resolved: true
      }
    ]);
  };

  const updateBookingStatus = async (refId: string, status: string, data: any = {}) => {
    setIsUpdating(true);
    try {
      await apiService.updateBookingStatus(refId, status, data);
      toast.success(`Booking ${refId} updated to ${status.toUpperCase()}`);
      await loadBookings();
      setSelectedBooking(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.ref_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <Shield className="h-4 w-4 text-red-500" />;
      case 'warning': return <Bell className="h-4 w-4 text-amber-500" />;
      case 'info': return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage bookings and monitor system performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadBookings}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/analytics">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View detailed reports</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/fleet">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plane className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Fleet Management</h3>
                <p className="text-sm text-gray-600">Manage aircraft fleet</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/customers">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Customer Management</h3>
                <p className="text-sm text-gray-600">Manage customer data</p>
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/reports">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">Generate detailed reports</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon={Plane}
          color="bg-amber-500"
        />
        <StatCard
          title="Delivered"
          value={stats.deliveredBookings}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledBookings}
          icon={Users}
          color="bg-red-500"
        />
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <span>System Alerts</span>
            </h2>
            <span className="text-sm text-gray-500">
              {alerts.filter(a => !a.resolved).length} unresolved
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No system alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {!alert.resolved && (
                        <button className="text-xs text-blue-600 hover:text-blue-700 mt-2">
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
                  View All Alerts ({alerts.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Search bookings..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="BOOKED">Booked</option>
              <option value="DEPARTED">Departed</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Bookings ({filteredBookings.length})
            </h2>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight & Pieces
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.ref_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">{booking.ref_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Customer Name</div>
                      <div className="text-sm text-gray-500">customer@example.com</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.weight}kg</div>
                      <div className="text-sm text-gray-500">{booking.pieces} pieces</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{booking.origin}</span>
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{booking.destination}</span>
                      </div>
                      <div className="text-sm text-gray-500">{booking.route.route_type === 'direct' ? 'Direct' : 'Transit'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} size="small" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(booking.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.events.length > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(booking.events[booking.events.length - 1].timestamp)}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Management Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Manage Booking {selectedBooking.ref_id}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Route:</span>
                <p className="text-sm font-medium">{selectedBooking.origin} → {selectedBooking.destination}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Weight:</span>
                <p className="text-sm font-medium">{selectedBooking.weight}kg ({selectedBooking.pieces} pieces)</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <p className="text-sm font-medium">{formatDateTime(selectedBooking.created_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Update:</span>
                <p className="text-sm font-medium">
                  {selectedBooking.events.length > 0 
                    ? formatDateTime(selectedBooking.events[selectedBooking.events.length - 1].timestamp)
                    : 'No updates'
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Current Status:</span>
                <div className="mt-1">
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {selectedBooking.status === 'BOOKED' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.ref_id, 'depart', { location: selectedBooking.origin })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  Mark as Departed
                </button>
              )}
              
              {selectedBooking.status === 'DEPARTED' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.ref_id, 'arrive', { location: selectedBooking.destination })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  Mark as Arrived
                </button>
              )}
              
              {selectedBooking.status === 'ARRIVED' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.ref_id, 'deliver', { location: selectedBooking.destination })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}
              
              {!['DELIVERED', 'CANCELLED', 'ARRIVED'].includes(selectedBooking.status) && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.ref_id, 'cancel', { reason: 'Admin cancellation' })}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;