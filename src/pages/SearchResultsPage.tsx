import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  Weight, 
  ArrowLeft, 
  AlertCircle,
  User,
  Mail,
  Clock,
  CheckCircle,
  Zap
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
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  updated_at: string;
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [searchRef, setSearchRef] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setSearchRef(ref);
      searchBooking(ref);
    }
  }, [searchParams]);

  const searchBooking = async (refId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${refId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
      } else {
        setError('Booking not found');
        setBooking(null);
      }
    } catch (error) {
      setError('Error searching for booking');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      setSearchParams({ ref: searchRef.trim() });
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

  return (
    <div className="container-fluid py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center gap-6"
      >
        <Link to="/">
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-2xl backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-responsive-3xl font-bold text-white text-shadow">
            Search Results
          </h1>
          <p className="text-white/80 text-lg">Find and track your cargo shipments</p>
        </div>
      </motion.div>

      {/* Enhanced Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 p-8">
            <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              Track Your Shipment
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your booking reference ID to get real-time tracking information
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Enter booking reference ID (e.g., RG123ABC456)"
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  className="input-enhanced pl-16 h-16 text-lg font-medium"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !searchRef.trim()}
                size="lg"
                className="h-16 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Search className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-2" />
                    <span className="hidden sm:inline">Search Booking</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-elevated rounded-3xl border-0">
              <CardContent className="p-12">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  >
                    <Search className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Searching...</h3>
                  <p className="text-gray-600">Looking up your booking information</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-elevated rounded-3xl border-0 overflow-hidden border-red-200 bg-red-50">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-red-900 mb-3">Booking Not Found</h3>
                <p className="text-red-700 text-lg max-w-md mx-auto">
                  No booking found with reference ID "{searchRef}". Please verify the ID and try again.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {booking && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100 p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="text-responsive-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      {booking.ref_id}
                    </CardTitle>
                    <CardDescription className="text-responsive-lg text-gray-700 font-medium">
                      {booking.origin} → {booking.destination}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(booking.status)} text-white px-6 py-3 rounded-2xl text-lg font-bold shadow-xl`}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-blue-900 font-semibold mb-1">Pieces</p>
                    <p className="text-3xl font-bold text-blue-900">{booking.pieces}</p>
                  </div>

                  <div className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Weight className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-yellow-900 font-semibold mb-1">Weight</p>
                    <p className="text-3xl font-bold text-yellow-900">{booking.weight_kg} kg</p>
                  </div>

                  <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-green-900 font-semibold mb-1">Created</p>
                    <p className="text-lg font-bold text-green-900">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-purple-900 font-semibold mb-1">Updated</p>
                    <p className="text-lg font-bold text-purple-900">
                      {new Date(booking.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Customer Information */}
                {(booking.customer_name || booking.customer_email) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200"
                  >
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {booking.customer_name && (
                        <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Customer Name</p>
                            <p className="text-lg font-bold text-gray-900">{booking.customer_name}</p>
                          </div>
                        </div>
                      )}
                      {booking.customer_email && (
                        <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Email Address</p>
                            <p className="text-lg font-bold text-gray-900">{booking.customer_email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex justify-center"
                >
                  <Link to={`/booking/${booking.ref_id}`}>
                    <Button 
                      size="lg"
                      className="h-16 px-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 font-semibold"
                    >
                      <Zap className="w-6 h-6 mr-3" />
                      View Full Details
                      <CheckCircle className="w-6 h-6 ml-3" />
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}