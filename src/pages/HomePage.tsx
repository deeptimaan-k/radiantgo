import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plane, 
  Search, 
  Plus, 
  TrendingUp, 
  Clock, 
  MapPin,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Booking {
  _id: string;
  ref_id: string;
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function HomePage() {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [searchRef, setSearchRef] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setRecentBookings(data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      navigate(`/search?ref=${searchRef.trim()}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'status-booked';
      case 'DEPARTED': return 'status-departed';
      case 'ARRIVED': return 'status-arrived';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'bg-gray-500';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Book cargo space in seconds with our streamlined process"
    },
    {
      icon: Shield,
      title: "Secure Tracking",
      description: "Real-time updates with enterprise-grade security"
    },
    {
      icon: Globe,
      title: "Global Network",
      description: "Connect to destinations worldwide with our flight network"
    },
    {
      icon: Users,
      title: "24/7 Support",
      description: "Expert support team available around the clock"
    }
  ];

  return (
    <div className="container-fluid py-8 space-y-responsive">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center py-12 lg:py-20"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-responsive-4xl lg:text-7xl font-bold text-white mb-6 text-shadow">
            Air Cargo,{' '}
            <span className="text-gradient bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-responsive-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of cargo logistics with real-time tracking, 
            intelligent routing, and seamless booking management
          </p>
        </motion.div>

        {/* Hero Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/60 w-6 h-6" />
              <Input
                type="text"
                placeholder="Enter booking reference ID to track your shipment..."
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="pl-16 h-16 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-3xl backdrop-blur-sm shadow-2xl"
              />
            </div>
            <Button 
              type="submit" 
              size="lg"
              className="h-16 px-8 bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-3xl backdrop-blur-sm shadow-2xl transition-all duration-300 hover:scale-105"
              variant="outline"
            >
              <Search className="w-6 h-6 mr-2" />
              <span className="hidden sm:inline">Track Shipment</span>
            </Button>
          </form>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/create-booking">
            <Button 
              size="lg"
              className="h-16 px-10 text-lg bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white rounded-3xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <Plus className="w-6 h-6 mr-3" />
              Create New Booking
            </Button>
          </Link>
          
          <Button 
            size="lg"
            variant="outline"
            className="h-16 px-10 text-lg bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 rounded-3xl backdrop-blur-sm shadow-2xl transition-all duration-300"
          >
            <Package className="w-6 h-6 mr-3" />
            View All Bookings
          </Button>
        </motion.div>
      </motion.section>

      {/* Stats Dashboard */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
      >
        <motion.div variants={itemVariants}>
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{recentBookings.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                </div>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Plane className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-600 font-medium">Active Routes</p>
                </div>
              </div>
              <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {recentBookings.filter(b => b.status === 'DELIVERED').length}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Delivered Today</p>
                </div>
              </div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-600 font-medium">On-Time Rate</p>
                </div>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-full"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mb-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-responsive-3xl font-bold text-white mb-4 text-shadow">
            Why Choose RadiantGo?
          </h2>
          <p className="text-responsive-lg text-white/80 max-w-2xl mx-auto">
            Experience the next generation of cargo logistics with our cutting-edge platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
                className="group"
              >
                <Card className="card-elevated rounded-3xl border-0 h-full text-center p-8 group-hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Recent Bookings */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-responsive-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  Recent Bookings
                </CardTitle>
                <CardDescription className="text-responsive-base text-gray-600">
                  Track your latest cargo shipments and their current status
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Link to="/create-booking">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    New Booking
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-32 rounded-2xl"></div>
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking._id}
                    variants={itemVariants}
                    className="group"
                  >
                    <Link to={`/booking/${booking.ref_id}`}>
                      <Card className="rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group-hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {booking.ref_id}
                                </h3>
                                <Badge className={`${getStatusColor(booking.status)} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                                  {booking.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">{booking.origin} → {booking.destination}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    {booking.pieces} pieces
                                  </span>
                                  <span>{booking.weight_kg} kg</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(booking.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-blue-500 group-hover:text-blue-700 transition-colors group-hover:translate-x-1 duration-300">
                              <ArrowRight className="w-6 h-6" />
                            </div>
                          </div>
                          
                          {/* Progress Indicator */}
                          <div className="progress-bar h-2">
                            <div 
                              className="progress-fill"
                              style={{
                                width: booking.status === 'BOOKED' ? '25%' :
                                       booking.status === 'DEPARTED' ? '50%' :
                                       booking.status === 'ARRIVED' ? '75%' :
                                       booking.status === 'DELIVERED' ? '100%' : '0%'
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start your cargo journey by creating your first booking with our streamlined process
                </p>
                <Link to="/create-booking">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Booking
                  </Button>
                </Link>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}