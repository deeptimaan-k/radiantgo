import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Weight, 
  User, 
  Mail, 
  Plane, 
  Route, 
  Clock,
  CheckCircle,
  ArrowRight,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface RouteType {
  type: 'direct' | 'one-hop';
  flights: any[];
  connection_airport?: string;
  connection_time?: number;
  total_duration: number;
  total_distance: number;
}

export function CreateBookingPage() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    pieces: 1,
    weight_kg: 10,
    customer_name: '',
    customer_email: ''
  });
  const [routes, setRoutes] = useState<{ direct: RouteType[], oneHop: RouteType[] } | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const searchRoutes = async () => {
    if (!formData.origin || !formData.destination || !formData.date) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date
      });
      const response = await fetch(`/api/routes?${params}`);
      const data = await response.json();
      setRoutes(data);
      if (data.direct.length > 0 || data.oneHop.length > 0) {
        setStep(2);
      }
    } catch (error) {
      console.error('Error searching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          pieces: formData.pieces,
          weight_kg: formData.weight_kg,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email
        }),
      });
      
      if (response.ok) {
        const booking = await response.json();
        navigate(`/booking/${booking.ref_id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToRoutes = formData.origin && formData.destination && formData.date && formData.origin !== formData.destination;
  const canCreateBooking = selectedRoute && formData.pieces > 0 && formData.weight_kg > 0;

  const steps = [
    { number: 1, title: 'Shipment Details', description: 'Enter cargo information' },
    { number: 2, title: 'Select Route', description: 'Choose your flight' },
    { number: 3, title: 'Confirmation', description: 'Review and confirm' }
  ];

  return (
    <div className="container-fluid py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-responsive-4xl font-bold text-white mb-4 text-shadow">
          Create New Booking
        </h1>
        <p className="text-responsive-lg text-white/80 max-w-2xl mx-auto">
          Book cargo space on our global flight network with real-time availability
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex justify-center mb-12"
      >
        <div className="flex items-center space-x-4 lg:space-x-8 bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
          {steps.map((stepInfo, index) => (
            <div key={stepInfo.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= stepInfo.number
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step > stepInfo.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepInfo.number
                  )}
                </motion.div>
                <div className="text-center mt-2 hidden lg:block">
                  <p className="text-sm font-semibold text-white">{stepInfo.title}</p>
                  <p className="text-xs text-white/70">{stepInfo.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 lg:w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                  step > stepInfo.number ? 'bg-blue-500' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Step 1: Shipment Details */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 p-8">
              <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                Shipment Details
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your cargo shipment information and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {/* Route Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Route Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="origin" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Origin Airport
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="origin"
                        value={formData.origin}
                        onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                        placeholder="DEL"
                        maxLength={3}
                        className="input-enhanced pl-12 h-14 text-lg font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="destination" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Destination Airport
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="destination"
                        value={formData.destination}
                        onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                        placeholder="BLR"
                        maxLength={3}
                        className="input-enhanced pl-12 h-14 text-lg font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Departure Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="input-enhanced pl-12 h-14 text-lg font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Cargo Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="pieces" className="text-sm font-semibold text-gray-700">
                      Number of Pieces
                    </Label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="pieces"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.pieces}
                        onChange={(e) => setFormData(prev => ({ ...prev, pieces: parseInt(e.target.value) }))}
                        className="input-enhanced pl-12 h-14 text-lg font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-sm font-semibold text-gray-700">
                      Total Weight (kg)
                    </Label>
                    <div className="relative">
                      <Weight className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="weight"
                        type="number"
                        min="0.1"
                        max="10000"
                        step="0.1"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) }))}
                        className="input-enhanced pl-12 h-14 text-lg font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Customer Information
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="customer-name" className="text-sm font-semibold text-gray-700">
                      Customer Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="customer-name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="John Doe"
                        className="input-enhanced pl-12 h-14 text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="customer-email" className="text-sm font-semibold text-gray-700">
                      Customer Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="customer-email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="john@example.com"
                        className="input-enhanced pl-12 h-14 text-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={searchRoutes}
                disabled={!canProceedToRoutes || loading}
                className="w-full h-16 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] font-semibold"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-3"
                    >
                      <Search className="w-6 h-6" />
                    </motion.div>
                    Searching Available Routes...
                  </>
                ) : (
                  <>
                    <Route className="w-6 h-6 mr-3" />
                    Search Available Routes
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Route Selection */}
        <AnimatePresence>
          {routes && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100 p-8">
                  <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Route className="w-6 h-6 text-white" />
                    </div>
                    Available Routes
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Select your preferred flight route from available options
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-8 space-y-8">
                  {/* Direct Routes */}
                  {routes.direct.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Direct Flights ({routes.direct.length})
                        </h3>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Recommended
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {routes.direct.map((route, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`border-3 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                              selectedRoute === route 
                                ? 'border-blue-500 bg-blue-50 shadow-xl' 
                                : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-lg'
                            }`}
                            onClick={() => setSelectedRoute(route)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                    Direct Flight
                                  </Badge>
                                  <span className="text-lg font-bold text-gray-900">
                                    {route.flights[0].flight_number}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-gray-700 font-medium">
                                    {route.flights[0].origin} → {route.flights[0].destination}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {new Date(route.flights[0].departure_ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <span>→</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {new Date(route.flights[0].arrival_ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                  {Math.floor(route.total_duration / 60)}h {route.total_duration % 60}m
                                </div>
                                <p className="text-sm text-gray-600">{route.total_distance} km</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* One-Hop Routes */}
                  {routes.oneHop.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                          <Route className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Connecting Flights ({routes.oneHop.length})
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {routes.oneHop.map((route, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (routes.direct.length + index) * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`border-3 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                              selectedRoute === route 
                                ? 'border-blue-500 bg-blue-50 shadow-xl' 
                                : 'border-gray-200 hover:border-yellow-300 bg-white hover:shadow-lg'
                            }`}
                            onClick={() => setSelectedRoute(route)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                    Via {route.connection_airport}
                                  </Badge>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {route.connection_time} min layover
                                  </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="font-medium">{route.flights[0].flight_number}:</span>
                                    <span>{route.flights[0].origin} → {route.flights[0].destination}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    <span className="font-medium">{route.flights[1].flight_number}:</span>
                                    <span>{route.flights[1].origin} → {route.flights[1].destination}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                  {Math.floor(route.total_duration / 60)}h {route.total_duration % 60}m
                                </div>
                                <p className="text-sm text-gray-600">{route.total_distance} km</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {routes.direct.length === 0 && routes.oneHop.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Plane className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No Routes Available</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        No flights found for the selected route and date. Please try different dates or routes.
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 3: Confirmation */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="card-elevated rounded-3xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100 p-8">
                <CardTitle className="text-responsive-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  Confirm Your Booking
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Review all details before finalizing your cargo booking
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Selected Route Summary */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Route className="w-5 h-5 text-blue-600" />
                      Selected Route
                    </h4>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${selectedRoute.type === 'direct' ? 'bg-green-500' : 'bg-yellow-500'} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md`}>
                          {selectedRoute.type === 'direct' ? 'Direct Flight' : `Via ${selectedRoute.connection_airport}`}
                        </Badge>
                        <span className="text-lg font-bold text-gray-900">
                          {selectedRoute.flights[0].flight_number}
                          {selectedRoute.type === 'one-hop' && ` + ${selectedRoute.flights[1].flight_number}`}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Route:</span>
                          <span className="font-bold text-gray-900">{formData.origin} → {formData.destination}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Duration:</span>
                          <span className="font-bold text-gray-900">
                            {Math.floor(selectedRoute.total_duration / 60)}h {selectedRoute.total_duration % 60}m
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Distance:</span>
                          <span className="font-bold text-gray-900">{selectedRoute.total_distance} km</span>
                        </div>
                        {selectedRoute.connection_time && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">Layover:</span>
                            <span className="font-bold text-gray-900">{selectedRoute.connection_time} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cargo Summary */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      Cargo Details
                    </h4>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{formData.pieces}</p>
                            <p className="text-sm text-gray-600 font-medium">Pieces</p>
                          </div>
                          <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                            <Weight className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{formData.weight_kg}</p>
                            <p className="text-sm text-gray-600 font-medium">kg</p>
                          </div>
                        </div>
                        
                        {(formData.customer_name || formData.customer_email) && (
                          <div className="pt-4 border-t border-purple-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Customer Information</h5>
                            {formData.customer_name && (
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">{formData.customer_name}</span>
                              </div>
                            )}
                            {formData.customer_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">{formData.customer_email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Button 
                    onClick={createBooking}
                    disabled={!canCreateBooking || loading}
                    className="w-full h-16 text-xl bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-500 hover:from-yellow-600 hover:via-yellow-700 hover:to-orange-600 text-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] font-bold"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-3"
                        >
                          <Package className="w-7 h-7" />
                        </motion.div>
                        Creating Your Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-7 h-7 mr-3" />
                        Confirm Booking
                        <ArrowRight className="w-6 h-6 ml-3" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}