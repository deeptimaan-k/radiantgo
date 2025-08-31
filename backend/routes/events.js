import express from 'express';
import { BookingEvent } from '../models/BookingEvent.js';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await BookingEvent.findAll();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/booking/:bookingId - Get events for specific booking
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const events = await BookingEvent.findByBookingId(req.params.bookingId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await BookingEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as eventRoutes };