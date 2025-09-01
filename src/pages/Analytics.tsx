import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
  };
  routes: {
    popular: Array<{
      route: string;
      count: number;
      revenue: number;
    }>;
  };
  performance: {
    avgDeliveryTime: number;
    onTimeDelivery: number;
    customerSatisfaction: number;
  };
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setData({
        revenue: {
          total: 2450000,
          thisMonth: 185000,
          lastMonth: 165000,
          growth: 12.1
        },
        bookings: {
          total: 1247,
          thisMonth: 89,
          completed: 1156,
          cancelled: 91
        },
        routes: {
          popular: [
            { route: 'DEL → BOM', count: 156, revenue: 234000 },
            { route: 'BOM → BLR', count: 134, revenue: 201000 },
            { route: 'DEL → BLR', count: 98, revenue: 147000 },
            { route: 'MAA → BOM', count: 87, revenue: 130500 },
            { route: 'CCU → DEL', count: 76, revenue: 114000 }
          ]
        },
        performance: {
          avgDeliveryTime: 2.3,
          onTimeDelivery: 94.5,
          customerSatisfaction: 4.7
        }
      });
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-4 w-4" />
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your air cargo operations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${(data!.revenue.total / 1000).toFixed(0)}K`}
          subtitle={`$${(data!.revenue.thisMonth / 1000).toFixed(0)}K this month`}
          icon={DollarSign}
          color="bg-green-500"
          trend={data!.revenue.growth}
        />
        <MetricCard
          title="Total Bookings"
          value={data!.bookings.total.toLocaleString()}
          subtitle={`${data!.bookings.thisMonth} this month`}
          icon={Package}
          color="bg-blue-500"
        />
        <MetricCard
          title="Avg Delivery Time"
          value={`${data!.performance.avgDeliveryTime} days`}
          subtitle={`${data!.performance.onTimeDelivery}% on-time delivery`}
          icon={Clock}
          color="bg-purple-500"
        />
        <MetricCard
          title="Customer Rating"
          value={`${data!.performance.customerSatisfaction}/5.0`}
          subtitle="Based on 1,247 reviews"
          icon={TrendingUp}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Routes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Popular Routes</span>
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          
          <div className="space-y-4">
            {data!.routes.popular.map((route, index) => (
              <div key={route.route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{route.route}</p>
                    <p className="text-sm text-gray-500">{route.count} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${(route.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span>Booking Status Distribution</span>
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Delivered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92.7%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">92.7%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">In Transit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '4.8%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">4.8%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Cancelled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '2.5%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">2.5%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Key Performance Indicators</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">94.5%</p>
                <p className="text-xs text-green-700">On-Time Delivery</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">2.3</p>
                <p className="text-xs text-blue-700">Avg Days</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;