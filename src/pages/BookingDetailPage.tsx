import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Clock, 
  Plane, 
  CheckCircle, 
  Circle, 
  ArrowLeft,
  Weight,
  Calendar,
  User,
  Mail,
  AlertCircle,
  Navigation,
  Truck,
  Building
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface BookingEvent {
  _id: string;
  booking_id: string;
  type: string;
  location: string;
  at_ts: string;
  payload: any;
}

interface BookingDetails {
  booking: Booking;
  timeline: BookingEvent[];
  meta: {
    totalEvents: number;
    lastUpdated: string;
    canCancel: boolean;
    nextValidStatuses: string[];
  };
}

export function BookingDetailPage() {
  const { refId } = useParams<{ refId: string }>();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (refId) {
      fetchBookingDetails();
    }
  }, [refId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${refId}`);
      const data = await response.json();
      setBookingDetails(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
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

  const getProgressStep = (status: string) => {
    switch (status) {
      case 'BOOKED': return 1;
      case 'DEPARTED': return 2;
      case 'ARRIVED': return 3;
      case 'DELIVERED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('DEPARTED')) return <Plane className="w-6 h-6 text-yellow-600" />;
    if (eventType.includes('ARRIVED')) return <Navigation className="w-6 h-6 text-green-600" />;
    if (eventType.includes('DELIVERED')) return <Truck className="w-6 h-6 text-emerald-600" />;
    if (eventType.includes('CANCELLED')) return <AlertCircle className="w-6 h-6 text-red-600" />;
    return <Package className="w-6 h-6 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="container-fluid py-8">
        <div className="space-y-8">
          <div className="loading-skeleton h-12 rounded-2xl w-1/3"></div>
          <div className="loading-skeleton h-64 rounded-3xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="loading-skeleton h-96 rounded-3xl"></div>
            <div className="loading-skeleton h-96 rounded-3xl lg:col-span-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="container-fluid py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 text-shadow">Booking Not Found</h2>
          <p className="text-white/80 mb-8 text-lg">
            The booking reference ID "{refId}" could not be found in our system.
          </p>
          <Link to="/">
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-2xl px-8 py-4 backdrop-blur-sm">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const { booking, timeline } = bookingDetails;
  const currentStep = getProgressStep(booking.status);

  return (
    <div className="container-fluid py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
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
              Booking Details
            </h1>
            <p className="text-white/80 text-lg">Reference: {booking.ref_id}</p>
          </div>
        </div>
        
        <Badge className={`${getStatusColor(booking.status)} text-white px-6 py-3 rounded-2xl text-lg font-bold shadow-xl`}>
          {booking.status}
        </Badge>
      </motion.div>

      {/* Status Progress Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 p-8">
            <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              Shipment Progress
            </CardTitle>
            <CardDescription className="text-gray-600">
              Track your cargo's journey from booking to delivery
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                Last updated: {new Date(booking.updated_at).toLocaleString()}
              </div>
            </div>

            {/* Progress Visualization */}
            {booking.status !== 'CANCELLED' ? (
              <div className="relative">
                <div className="flex items-center justify-between">
                  {['BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED'].map((status, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber;
                    const isCurrent = currentStep === stepNumber;
                    
                    return (
                      <motion.div
                        key={status}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.2, duration: 0.5 }}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div className={`progress-step ${
                          isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">{stepNumber}</span>
                          )}
                        </div>
                        <div className="text-center mt-3">
                          <p className="text-sm font-semibold text-gray-900">{status}</p>
                          <p className="text-xs text-gray-600 hidden sm:block">
                            {status === 'BOOKED' && 'Booking confirmed'}
                            {status === 'DEPARTED' && 'In transit'}
                            {status === 'ARRIVED' && 'At destination'}
                            {status === 'DELIVERED' && 'Completed'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full -z-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, (currentStep - 1) * 33.33)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">Booking Cancelled</h3>
                <p className="text-red-700">This booking has been cancelled and will not be processed.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Information */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden h-fit">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100 p-6">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Cargo Information
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-blue-50 rounded-2xl p-4">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-900 font-medium mb-1">Route</p>
                  <p className="text-lg font-bold text-blue-900">{booking.origin} → {booking.destination}</p>
                </div>
                <div className="text-center bg-purple-50 rounded-2xl p-4">
                  <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-900 font-medium mb-1">Booked</p>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-yellow-50 rounded-2xl p-4">
                  <Package className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-900 font-medium mb-1">Pieces</p>
                  <p className="text-2xl font-bold text-yellow-900">{booking.pieces}</p>
                </div>
                <div className="text-center bg-green-50 rounded-2xl p-4">
                  <Weight className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-900 font-medium mb-1">Weight</p>
                  <p className="text-2xl font-bold text-green-900">{booking.weight_kg} kg</p>
                </div>
              </div>

              {(booking.customer_name || booking.customer_email) && (
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-600" />
                    Customer Information
                  </h4>
                  {booking.customer_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Name</p>
                        <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                      </div>
                    </div>
                  )}
                  {booking.customer_email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Email</p>
                        <p className="font-semibold text-gray-900">{booking.customer_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100 p-8">
              <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                Event Timeline
              </CardTitle>
              <CardDescription className="text-gray-600">
                Complete history of your cargo's journey with detailed timestamps
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-6">
                <AnimatePresence>
                  {timeline.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className="timeline-item"
                    >
                      <div className="timeline-dot bg-gradient-to-br from-blue-500 to-purple-600"></div>
                      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                              {event.type
                                .replace('STATUS_CHANGED_', '')
                                .replace('BOOKING_', '')
                                .replace('_', ' ')
                                .toLowerCase()
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span>{new Date(event.at_ts).toLocaleString()}</span>
                              </div>
                            </div>
                            {event.payload.notes && (
                              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
                                <p className="text-gray-700 font-medium">{event.payload.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      {bookingDetails.meta.canCancel && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex justify-center"
        >
          <Button 
            variant="destructive" 
            size="lg"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            onClick={() => {
              console.log('Cancel booking:', booking.ref_id);
            }}
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Cancel Booking
          </Button>
        </motion.div>
      )}
    </div>
  );
}