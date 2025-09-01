export interface CreateBookingRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  route_id: string;
  departure_date: string;
}

export interface StatusUpdateRequest {
  location?: string;
  flight_info?: {
    flight_number?: string;
    airline?: string;
  };
  meta?: Record<string, any>;
  reason?: string;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  date: string;
}

export interface RouteOption {
  id: string;
  type: 'direct' | 'one_transit';
  flights: any[];
  total_duration: number;
  total_cost: number;
}

export enum BookingStatus {
  BOOKED = 'BOOKED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}