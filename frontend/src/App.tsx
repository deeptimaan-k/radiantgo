import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Package, Calendar, MapPin, Clock, RefreshCw, Search, Route } from 'lucide-react';

interface Flight {
  _id: string;
  flight_number: string;
  airline: string;
  origin: string;
  destination: string;
  departure_ts: string;
  arrival_ts: string;
}

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

interface Route {
  type: 'direct' | 'one-hop';
  flights: Flight[];
  connection_airport?: string;
  connection_time?: number;
  total_duration: number;
  total_distance: number;
}

interface BookingEvent {
  _id: string;
  booking_id: string;
  type: string;
  location: string;
  at_ts: string;
  payload: any;
}

function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<{ direct: Route[], oneHop: Route[] } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking, timeline: BookingEvent[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeSearch, setRouteSearch] = useState({
    origin: 'DEL',
    destination: 'BLR',
    date: new Date().toISOString().split('T')[0]
  });
  const [newBooking, setNewBooking] = useState({
    origin: 'DEL',
    destination: 'BLR',
    pieces: 1,
    weight_kg: 10,
    customer_name: '',
    customer_email: ''
  });

  const fetchFlights = async () => {
    try {
      const response = await fetch('/api/flights');
      const data = await response.json();
      setFlights(data);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const searchRoutes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(routeSearch);
      const response = await fetch(`/api/routes?${params}`);
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error searching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingDetails = async (refId: string) => {
    try {
      const response = await fetch(`/api/bookings/${refId}`);
      const data = await response.json();
      setSelectedBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const updateBookingStatus = async (refId: string, action: string, additionalData = {}) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${refId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(additionalData),
      });
      
      if (response.ok) {
        fetchBookings();
        if (selectedBooking && selectedBooking.booking.ref_id === refId) {
          getBookingDetails(refId);
        }
      }
    } catch (error) {
      console.error(`Error updating booking status:`, error);
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
        body: JSON.stringify(newBooking),
      });
      
      if (response.ok) {
        setNewBooking({ 
          origin: 'DEL', 
          destination: 'BLR', 
          pieces: 1, 
          weight_kg: 10,
          customer_name: '',
          customer_email: ''
        });
        fetchBookings();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-blue-500';
      case 'DEPARTED': return 'bg-yellow-500';
      case 'ARRIVED': return 'bg-green-500';
      case 'DELIVERED': return 'bg-emerald-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Plane className="text-blue-600" size={40} />
            RadiantGo
          </h1>
          <p className="text-lg text-gray-600">Cargo Booking & Tracking System</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="routes">Route Search</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="create">Create Booking</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="text-blue-600" size={24} />
                  Current Bookings
                </CardTitle>
                <CardDescription>
                  Track and manage cargo bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">Ref: {booking.ref_id}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {booking.origin} → {booking.destination}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package size={14} />
                              {booking.pieces} pieces, {booking.weight_kg}kg
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${getStatusColor(booking.status)} text-white`}>
                            {booking.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => getBookingDetails(booking.ref_id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {booking.status === 'BOOKED' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateBookingStatus(booking.ref_id, 'depart', { location: booking.origin })}
                            >
                              Mark Departed
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.ref_id, 'cancel', { location: booking.origin })}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'DEPARTED' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateBookingStatus(booking.ref_id, 'arrive', { location: booking.destination })}
                            >
                              Mark Arrived
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.ref_id, 'cancel', { location: 'In Transit' })}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'ARRIVED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateBookingStatus(booking.ref_id, 'deliver', { location: booking.destination })}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No bookings found. Create your first booking to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="text-blue-600" size={24} />
                  Route Search
                </CardTitle>
                <CardDescription>
                  Find direct flights and connecting routes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-origin">Origin</Label>
                    <Input
                      id="search-origin"
                      value={routeSearch.origin}
                      onChange={(e) => setRouteSearch(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                      placeholder="DEL"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-destination">Destination</Label>
                    <Input
                      id="search-destination"
                      value={routeSearch.destination}
                      onChange={(e) => setRouteSearch(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                      placeholder="BLR"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-date">Date</Label>
                    <Input
                      id="search-date"
                      type="date"
                      value={routeSearch.date}
                      onChange={(e) => setRouteSearch(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Button onClick={searchRoutes} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching Routes...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Routes
                    </>
                  )}
                </Button>

                {routes && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Direct Routes ({routes.direct.length})</h3>
                    {routes.direct.map((route, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{route.flights[0].flight_number}</p>
                            <p className="text-sm text-gray-600">
                              {route.flights[0].origin} → {route.flights[0].destination}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{route.total_duration} min</p>
                            <p className="text-gray-600">{route.total_distance} km</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <h3 className="text-lg font-semibold">One-Hop Routes ({routes.oneHop.length})</h3>
                    {routes.oneHop.map((route, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Via {route.connection_airport}</p>
                            <div className="text-right text-sm">
                              <p>{route.total_duration} min total</p>
                              <p className="text-gray-600">{route.connection_time} min layover</p>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>{route.flights[0].flight_number}: {route.flights[0].origin} → {route.flights[0].destination}</p>
                            <p>{route.flights[1].flight_number}: {route.flights[1].origin} → {route.flights[1].destination}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="text-blue-600" size={24} />
                  Available Flights
                </CardTitle>
                <CardDescription>
                  View scheduled flights for cargo booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {flights.map((flight) => (
                    <div key={flight._id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{flight.flight_number}</h3>
                          <p className="text-sm text-gray-600 mb-2">{flight.airline}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {flight.origin} → {flight.destination}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock size={14} />
                              Departure: {new Date(flight.departure_ts).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              Arrival: {new Date(flight.arrival_ts).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {flights.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No flights available. Contact admin to add flight schedules.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="text-blue-600" size={24} />
                  Create New Booking
                </CardTitle>
                <CardDescription>
                  Book cargo space on available flights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin"
                      value={newBooking.origin}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                      placeholder="DEL"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={newBooking.destination}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                      placeholder="BLR"
                      maxLength={3}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pieces">Number of Pieces</Label>
                    <Input
                      id="pieces"
                      type="number"
                      min="1"
                      value={newBooking.pieces}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, pieces: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newBooking.weight_kg}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                    <Input
                      id="customer-name"
                      value={newBooking.customer_name}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Customer Email (Optional)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={newBooking.customer_email}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <Button 
                  onClick={createBooking} 
                  disabled={loading || !newBooking.origin || !newBooking.destination}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Booking Details: {selectedBooking.booking.ref_id}</CardTitle>
                    <CardDescription>
                      {selectedBooking.booking.origin} → {selectedBooking.booking.destination}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={`${getStatusColor(selectedBooking.booking.status)} text-white`}>
                      {selectedBooking.booking.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cargo</p>
                    <p>{selectedBooking.booking.pieces} pieces, {selectedBooking.booking.weight_kg}kg</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Event Timeline</h4>
                  <div className="space-y-3">
                    {selectedBooking.timeline.map((event, index) => (
                      <div key={event._id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{event.type.replace('STATUS_CHANGED_', '').replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.at_ts).toLocaleString()}
                          </p>
                          {event.payload.notes && (
                            <p className="text-sm text-gray-700 mt-1">{event.payload.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;