import mongoose from 'mongoose';

// Flight Schema
const flightSchema = new mongoose.Schema({
  flight_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  airline: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    type: String,
    required: true,
    length: 3,
    uppercase: true
  },
  destination: {
    type: String,
    required: true,
    length: 3,
    uppercase: true
  },
  departure_ts: {
    type: Date,
    required: true
  },
  arrival_ts: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
flightSchema.index({ origin: 1, destination: 1, departure_ts: 1 });
flightSchema.index({ flight_number: 1 });

// Booking Schema
const bookingSchema = new mongoose.Schema({
  ref_id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  origin: {
    type: String,
    required: true,
    length: 3,
    uppercase: true
  },
  destination: {
    type: String,
    required: true,
    length: 3,
    uppercase: true
  },
  pieces: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  weight_kg: {
    type: Number,
    required: true,
    min: 0.1,
    max: 10000
  },
  status: {
    type: String,
    required: true,
    enum: ['BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
    default: 'BOOKED'
  },
  customer_name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  customer_email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
bookingSchema.index({ ref_id: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ origin: 1, destination: 1 });

// Booking Event Schema
const bookingEventSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'BOOKING_CREATED',
      'STATUS_CHANGED_DEPARTED',
      'STATUS_CHANGED_ARRIVED',
      'STATUS_CHANGED_DELIVERED',
      'STATUS_CHANGED_CANCELLED',
      'LOCATION_UPDATE',
      'FLIGHT_ASSIGNED'
    ]
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  flight_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    default: null
  },
  at_ts: {
    type: Date,
    required: true,
    default: Date.now
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// Indexes
bookingEventSchema.index({ booking_id: 1, at_ts: -1 });
bookingEventSchema.index({ type: 1, at_ts: -1 });

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user', 'operator'],
    default: 'user'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Outbox Schema for reliable event publishing
const outboxSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  event_type: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  published_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// Indexes
outboxSchema.index({ published_at: 1 });
outboxSchema.index({ booking_id: 1, created_at: -1 });

// Export models
export const Flight = mongoose.model('Flight', flightSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
export const BookingEvent = mongoose.model('BookingEvent', bookingEventSchema);
export const User = mongoose.model('User', userSchema);
export const Outbox = mongoose.model('Outbox', outboxSchema);