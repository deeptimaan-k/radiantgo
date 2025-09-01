import mongoose, { Document, Schema } from 'mongoose';

export interface IFlight extends Document {
  flight_id: string;
  flight_number: string;
  airline: string;
  departure: Date;
  arrival: Date;
  origin: string;
  destination: string;
  created_at: Date;
  updated_at: Date;
}

const FlightSchema = new Schema<IFlight>({
  flight_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  flight_number: {
    type: String,
    required: true,
    trim: true
  },
  airline: {
    type: String,
    required: true,
    trim: true
  },
  departure: {
    type: Date,
    required: true
  },
  arrival: {
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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for route queries
FlightSchema.index({ origin: 1, destination: 1, departure: 1 });

export const Flight = mongoose.model<IFlight>('Flight', FlightSchema);