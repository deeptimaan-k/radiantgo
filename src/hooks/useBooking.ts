import { useState, useCallback } from 'react';
import { apiService } from '../lib/api';
import { Booking, Route, BookingRequest, RouteSearchRequest } from '../types';
import toast from 'react-hot-toast';

export const useBooking = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const searchRoutes = useCallback(async (searchParams: RouteSearchRequest) => {
    setIsSearching(true);
    console.log('Starting route search with params:', searchParams);
    
    try {
      const routeResults = await apiService.searchRoutes(searchParams);
      console.log('Route search results:', routeResults);
      setRoutes(routeResults);
      
      if (routeResults.length === 0) {
        toast.error('No routes found for your search criteria. Please try different airports or dates.');
      } else {
        const directRoutes = routeResults.filter(r => r.route_type === 'direct').length;
        const transitRoutes = routeResults.filter(r => r.route_type === 'one_transit').length;
        toast.success(`Found ${routeResults.length} route(s): ${directRoutes} direct, ${transitRoutes} with transit`);
      }
    } catch (error: any) {
      console.error('Route search error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to search routes. Please try again.';
      toast.error(errorMessage);
      setRoutes([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData: BookingRequest): Promise<string | null> => {
    setIsCreating(true);
    try {
      const newBooking = await apiService.createBooking(bookingData);
      setBooking(newBooking);
      
      // Save to localStorage for quick access
      localStorage.setItem('lastBookingRefId', newBooking.ref_id);
      localStorage.setItem('lastBookingTimestamp', new Date().toISOString());
      
      toast.success(`Booking created successfully! Reference ID: ${newBooking.ref_id}`);
      return newBooking.ref_id;
    } catch (error: any) {
      console.error('Booking creation error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const trackBooking = useCallback(async (refId: string) => {
    setIsTracking(true);
    try {
      const bookingData = await apiService.getBooking(refId);
      setBooking(bookingData);
      toast.success('Booking found successfully');
    } catch (error: any) {
      console.error('Booking tracking error:', error);
      let errorMessage = 'Failed to track booking. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Booking not found. Please check your reference ID and try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
      setBooking(null);
    } finally {
      setIsTracking(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (refId: string, status: string, data: any = {}) => {
    try {
      const updatedBooking = await apiService.updateBookingStatus(refId, status, data);
      setBooking(updatedBooking);
      toast.success(`Booking status updated to ${status.toUpperCase()}`);
      return updatedBooking;
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update booking status';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const resetBooking = useCallback(() => {
    setBooking(null);
    setRoutes([]);
    setSelectedRoute(null);
  }, []);

  return {
    routes,
    selectedRoute,
    booking,
    isSearching,
    isCreating,
    isTracking,
    searchRoutes,
    createBooking,
    trackBooking,
    updateBookingStatus,
    setSelectedRoute,
    resetBooking,
  };
};

export const getLastBookingRefId = (): string | null => {
  return localStorage.getItem('lastBookingRefId');
};

export const getLastBookingTimestamp = (): string | null => {
  return localStorage.getItem('lastBookingTimestamp');
};