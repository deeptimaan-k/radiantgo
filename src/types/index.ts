export interface Booking {
  ref_id: string;
  origin: string;
  destination: string;
  pieces: number;
  weight: number;
  status: BookingStatus;
  created_at: string;
  route: Route;
  events: BookingEvent[];
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  flights: Flight[];
  total_cost: number;
  total_duration: number;
  route_type: 'direct' | 'one_transit';
}

export interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  cost: number;
  duration: number;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  status: BookingStatus;
  timestamp: string;
  description: string;
  location?: string;
}

export type BookingStatus = 'BOOKED' | 'DEPARTED' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';

export interface BookingRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight: number;
  route_id: string;
  departure_date: string;
  cargo_details?: import('./cargo').CargoDetails;
  insurance?: import('./cargo').Insurance;
  customs_info?: import('./cargo').CustomsInfo;
}

export interface RouteSearchRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight: number;
  departure_date: string;
}

// Re-export auth types
export * from './auth';
export * from './cargo';