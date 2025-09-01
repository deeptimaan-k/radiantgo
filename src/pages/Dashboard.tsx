import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Clock, CheckCircle, Plus, Search, AlertTriangle, Plane, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getLastBookingRefId, getLastBookingTimestamp } from '../hooks/useBooking';
import { formatDateTime } from '../utils/formatting';
import QuickStats from '../components/QuickStats';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  deliveredBookings: number;
  recentActivity: number;
}

interface RecentActivity {
  id: string;
  type: 'booking_created' | 'status_updated' | 'payment_received';
  description: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    deliveredBookings: 0,
    recentActivity: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch user-specific stats from the API
    // For now, we'll use mock data
    setStats({
      totalBookings: 12,
      activeBookings: 3,
      deliveredBookings: 8,
      recentActivity: 2
    });
    
    setRecentActivities([
      {
        id: '1',
        type: 'booking_created',
        description: 'New booking RG12345678 created for DEL → BOM',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'status_updated',
        description: 'Booking RG87654321 marked as delivered',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'payment_received',
        description: 'Payment received for booking RG11223344',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]);
  }, []);

  const lastBookingRefId = getLastBookingRefId();
  const lastBookingTimestamp = getLastBookingTimestamp();

  const getLastBookingAge = (): string => {
    if (!lastBookingTimestamp) return '';
    
    const now = new Date();
    const created = new Date(lastBookingTimestamp);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)} days ago`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return <Plus className="h-4 w-4 text-blue-500" />;
      case 'status_updated': return <Package className="h-4 w-4 text-green-500" />;
      case 'payment_received': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const QuickAction = ({ title, description, icon: Icon, to, color }: any) => (
    <Link to={to}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here's an overview of your air cargo operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickStats
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Package}
          color="bg-blue-500"
          change={8.2}
          changeLabel="vs last month"
        />
        <QuickStats
          title="Active Shipments"
          value={stats.activeBookings}
          icon={Clock}
          color="bg-amber-500"
          delay={0.1}
        />
        <QuickStats
          title="Delivered"
          value={stats.deliveredBookings}
          icon={CheckCircle}
          color="bg-green-500"
          change={15.3}
          changeLabel="vs last month"
          delay={0.2}
        />
        <QuickStats
          title="Recent Activity"
          value={stats.recentActivity}
          icon={TrendingUp}
          color="bg-purple-500"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Create New Booking"
              description="Book a new air cargo shipment"
              icon={Plus}
              to="/create"
              color="bg-blue-500"
            />
            <QuickAction
              title="Track Shipment"
              description="Track existing bookings and shipments"
              icon={Search}
              to="/track"
              color="bg-purple-500"
            />
            {user?.role === 'admin' && (
              <>
                <QuickAction
                  title="View Analytics"
                  description="Detailed performance analytics"
                  icon={TrendingUp}
                  to="/analytics"
                  color="bg-green-500"
                />
                <QuickAction
                  title="Manage Fleet"
                  description="Aircraft and fleet management"
                  icon={Plane}
                  to="/fleet"
                  color="bg-amber-500"
                />
              </>
            )}
          </div>
        </div>
        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Booking */}
      {lastBookingRefId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Recent Booking
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Reference ID: <span className="font-mono font-medium">{lastBookingRefId}</span>
              </p>
              <p className="text-xs text-gray-500">
                Created {getLastBookingAge()}
              </p>
            </div>
            <Link
              to={`/track?ref=${lastBookingRefId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Track Now
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;