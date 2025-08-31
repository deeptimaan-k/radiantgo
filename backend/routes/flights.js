import express from 'express';
import logger from '../utils/logger.js';
import { Flight } from '../models/Flight.js';

const router = express.Router();

// GET /api/flights - Get all flights
router.get('/', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    
    logger.info('Fetching flights', { 
      requestId: req.id, 
      filters: { origin, destination } 
    });
    
    let flights;
    if (origin && destination) {
      logger.debug(`Filtering flights by route: ${origin} → ${destination}`, { requestId: req.id });
      flights = await Flight.findByRoute(origin, destination);
    } else {
      logger.debug('Fetching all flights', { requestId: req.id });
      flights = await Flight.findAll();
    }
    
    logger.info(`Retrieved ${flights.length} flights`, { 
      requestId: req.id,
      filters: { origin, destination }
    });
    res.json(flights);
  } catch (error) {
    logger.error('Error fetching flights:', { 
      error: error.message, 
      query: req.query,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flights/:id - Get flight by ID
router.get('/:id', async (req, res) => {
  try {
    logger.info(`Fetching flight by ID: ${req.params.id}`, { requestId: req.id });
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      logger.warn(`Flight not found with ID: ${req.params.id}`, { requestId: req.id });
      return res.status(404).json({ error: 'Flight not found' });
    }
    logger.info(`Retrieved flight: ${flight.flight_number}`, { requestId: req.id });
    res.json(flight);
  } catch (error) {
    logger.error('Error fetching flight by ID:', { 
      error: error.message, 
      flightId: req.params.id,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/flights - Create new flight
router.post('/', async (req, res) => {
  try {
    const { flight_number, airline, origin, destination, departure_ts, arrival_ts } = req.body;
    
    logger.info('Creating new flight', { 
      requestId: req.id,
      flight_number,
      airline,
      route: `${origin} → ${destination}`
    });
    
    if (!flight_number || !airline || !origin || !destination || !departure_ts || !arrival_ts) {
      logger.warn('Missing required fields for flight creation', { 
        requestId: req.id,
        providedFields: Object.keys(req.body)
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const flight = await Flight.create({
      flight_number,
      airline,
      origin,
      destination,
      departure_ts,
      arrival_ts
    });
    
    logger.info(`Flight created successfully: ${flight.flight_number}`, { 
      requestId: req.id,
      flightId: flight._id,
      route: `${origin} → ${destination}`
    });
    res.status(201).json(flight);
  } catch (error) {
    logger.error('Error creating flight:', { 
      error: error.message, 
      requestBody: req.body,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/flights/:id - Update flight
router.put('/:id', async (req, res) => {
  try {
    logger.info(`Updating flight: ${req.params.id}`, { 
      requestId: req.id,
      updateFields: Object.keys(req.body)
    });
    const flight = await Flight.updateById(req.params.id, req.body);
    if (!flight) {
      logger.warn(`Flight not found for update: ${req.params.id}`, { requestId: req.id });
      return res.status(404).json({ error: 'Flight not found' });
    }
    logger.info(`Flight updated successfully: ${flight.flight_number}`, { 
      requestId: req.id,
      flightId: req.params.id
    });
    res.json(flight);
  } catch (error) {
    logger.error('Error updating flight:', { 
      error: error.message, 
      flightId: req.params.id,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/flights/:id - Delete flight
router.delete('/:id', async (req, res) => {
  try {
    logger.info(`Attempting to delete flight: ${req.params.id}`, { requestId: req.id });
    const flight = await Flight.deleteById(req.params.id);
    if (!flight) {
      logger.warn(`Flight not found for deletion: ${req.params.id}`, { requestId: req.id });
      return res.status(404).json({ error: 'Flight not found' });
    }
    logger.info(`Flight deleted successfully: ${flight.flight_number}`, { 
      requestId: req.id,
      deletedFlightId: req.params.id 
    });
    res.json({ message: 'Flight deleted successfully' });
  } catch (error) {
    logger.error('Error deleting flight:', { 
      error: error.message, 
      flightId: req.params.id,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

export { router as flightRoutes };