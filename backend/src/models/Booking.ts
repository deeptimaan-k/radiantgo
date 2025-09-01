import mongoose, { Document, Schema } from 'mongoose';

export enum BookingStatus {
  BOOKED = 'BOOKED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface IBookingEvent {
  id: string;
  type: string;
  status: BookingStatus;
  location: string;
  timestamp: Date;
  description: string;
  flight_info?: {
    flight_number?: string;
    airline?: string;
  };
  meta?: Record<string, any>;
}

export interface IBooking extends Document {
  ref_id: string;
  origin: string;
  destination: string;
  departure_date: Date;
  pieces: number;
  weight_kg: number;
  status: BookingStatus;
  flight_ids: string[];
  events: IBookingEvent[];
  created_at: Date;
  updated_at: Date;
}

const BookingEventSchema = new Schema<IBookingEvent>({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  flight_info: {
    flight_number: String,
    airline: String
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const BookingSchema = new Schema<IBooking>({
  ref_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  departure_date: {
    type: Date,
    required: true
  },
  origin: {
    type: String,
    required: true,
    length: 3,
    uppercase: true,
    match: /^[A-Z]{3}$/
  },
  destination: {
    type: String,
    required: true,
    length: 3,
    uppercase: true,
    match: /^[A-Z]{3}$/
  },
  pieces: {
    type: Number,
    required: true,
    min: 1
  },
  weight_kg: {
    type: Number,
    required: true,
    min: 0.1
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.BOOKED
  },
  flight_ids: [{
    type: String,
    required: true
  }],
  events: [BookingEventSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
BookingSchema.index({ status: 1 });
BookingSchema.index({ origin: 1, destination: 1 });
BookingSchema.index({ 'events.timestamp': -1 });
BookingSchema.index({ created_at: -1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);