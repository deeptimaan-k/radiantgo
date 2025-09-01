import axios from 'axios';
import { Booking, Route, BookingRequest, RouteSearchRequest } from '../types';
import { tokenManager } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    // Handle auth errors
    if (error.response?.status === 401) {
      tokenManager.removeToken();
      window.location.href = '/login';
    }
    
    // Transform backend errors to user-friendly messages
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Search for available routes
  searchRoutes: async (searchParams: RouteSearchRequest): Promise<Route[]> => {
    console.log('Searching routes with params:', searchParams);
    
    const response = await api.get('/flights/routes', { 
      params: {
        origin: searchParams.origin.toUpperCase(),
        destination: searchParams.destination.toUpperCase(),
        departure_date: searchParams.departure_date
      }
    });
    
    console.log('Route search response:', response.data);
    
    const routes = response.data.data;
    
    if (!Array.isArray(routes)) {
      console.error('Invalid routes response format:', routes);
      return [];
    }
    
    // Transform backend route data to frontend format
    return routes.map((route: any) => ({
      id: route.id,
      origin: route.flights[0].origin,
      destination: route.flights[route.flights.length - 1].destination,
      flights: route.flights.map((flight: any) => ({
        id: flight.flight_id,
        flight_number: flight.flight_number,
        airline: flight.airline,
        origin: flight.origin,
        destination: flight.destination,
        departure_time: flight.departure,
        arrival_time: flight.arrival,
        cost: route.total_cost / route.flights.length, // Distribute cost evenly
        duration: Math.floor((new Date(flight.arrival).getTime() - new Date(flight.departure).getTime()) / (1000 * 60))
      })),
      total_cost: route.total_cost,
      total_duration: route.total_duration,
      route_type: route.type
    }));
  },

  // Create a new booking
  createBooking: async (bookingData: BookingRequest): Promise<Booking> => {
    const response = await api.post('/bookings', {
      origin: bookingData.origin.toUpperCase(),
      destination: bookingData.destination.toUpperCase(),
      pieces: bookingData.pieces,
      weight_kg: bookingData.weight,
      route_id: bookingData.route_id,
      departure_date: bookingData.departure_date
    }, {
      headers: {
        'Idempotency-Key': `booking-${Date.now()}-${Math.random()}`
      }
    });
    
    const booking = response.data.data;
    
    // Transform backend response to frontend format
    return {
      ref_id: booking.ref_id,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      weight: booking.weight_kg,
      status: booking.status,
      created_at: booking.created_at,
      route: {
        id: bookingData.route_id,
        origin: booking.origin,
        destination: booking.destination,
        flights: [],
        total_cost: 0,
        total_duration: 0,
        route_type: 'direct'
      },
      events: booking.events.map((event: any) => ({
        id: event.id,
        booking_id: booking._id,
        status: event.status,
        timestamp: event.timestamp,
        description: event.description,
        location: event.location
      }))
    };
  },

  // Get booking by reference ID
  getBooking: async (refId: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${refId.toUpperCase()}`);
    const booking = response.data.data;
    
    // Transform backend response to frontend format
    return {
      ref_id: booking.ref_id,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      weight: booking.weight_kg,
      status: booking.status,
      created_at: booking.created_at,
      route: {
        id: `route-${booking.flight_ids.join('-')}`,
        origin: booking.origin,
        destination: booking.destination,
        flights: [],
        total_cost: 0,
        total_duration: 0,
        route_type: booking.flight_ids.length > 1 ? 'one_transit' : 'direct'
      },
      events: booking.events.map((event: any) => ({
        id: event.id,
        booking_id: booking._id,
        status: event.status,
        timestamp: event.timestamp,
        description: event.description,
        location: event.location
      }))
    };
  },

  // Get all bookings (for admin)
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings');
    const bookings = response.data.data;
    
    return bookings.map((booking: any) => ({
      ref_id: booking.ref_id,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      weight: booking.weight_kg,
      status: booking.status,
      created_at: booking.created_at,
      route: {
        id: `route-${booking.flight_ids.join('-')}`,
        origin: booking.origin,
        destination: booking.destination,
        flights: [],
        total_cost: 0,
        total_duration: 0,
        route_type: booking.flight_ids.length > 1 ? 'one_transit' : 'direct'
      },
      events: booking.events.map((event: any) => ({
        id: event.id,
        booking_id: booking._id,
        status: event.status,
        timestamp: event.timestamp,
        description: event.description,
        location: event.location
      }))
    }));
  },

  // Update booking status
  updateBookingStatus: async (refId: string, status: string, data: any = {}): Promise<Booking> => {
    const response = await api.post(`/bookings/${refId.toUpperCase()}/${status}`, data);
    const booking = response.data.data;
    
    return {
      ref_id: booking.ref_id,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      weight: booking.weight_kg,
      status: booking.status,
      created_at: booking.created_at,
      route: {
        id: `route-${booking.flight_ids.join('-')}`,
        origin: booking.origin,
        destination: booking.destination,
        flights: [],
        total_cost: 0,
        total_duration: 0,
        route_type: booking.flight_ids.length > 1 ? 'one_transit' : 'direct'
      },
      events: booking.events.map((event: any) => ({
        id: event.id,
        booking_id: booking._id,
        status: event.status,
        timestamp: event.timestamp,
        description: event.description,
        location: event.location
      }))
    };
  }
};

export default api;