import { Booking } from '../models/Booking.js';
import { BookingEvent } from '../models/BookingEvent.js';
import { Flight } from '../models/Flight.js';
import { distributedLock } from '../middleware/distributedLock.js';
import { performanceService } from './performanceService.js';
import { cacheService } from './cacheService.js';
import { messageService } from './messageService.js';
import logger from '../utils/logger.js';

export class BulkOperationService {
  constructor() {
    this.batchSize = 100;
    this.maxConcurrency = 10;
    this.retryAttempts = 3;
  }

  /**
   * Bulk booking creation for high-volume scenarios
   */
  async createBookingsBulk(bookingsData) {
    logger.info(`🚀 Starting bulk booking creation: ${bookingsData.length} bookings`);
    
    const startTime = Date.now();
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      processingTime: 0
    };

    try {
      // Validate all bookings first
      const validationErrors = [];
      bookingsData.forEach((booking, index) => {
        if (!booking.origin || !booking.destination || booking.origin === booking.destination) {
          validationErrors.push({ index, error: 'Invalid origin/destination' });
        }
        if (!booking.pieces || booking.pieces < 1 || booking.pieces > 1000) {
          validationErrors.push({ index, error: 'Invalid pieces count' });
        }
        if (!booking.weight_kg || booking.weight_kg <= 0 || booking.weight_kg > 10000) {
          validationErrors.push({ index, error: 'Invalid weight' });
        }
      });

      if (validationErrors.length > 0) {
        logger.warn(`Bulk booking validation failed: ${validationErrors.length} errors`);
        return { ...results, validationErrors };
      }

      // Process in batches with concurrency control
      const batches = this.createBatches(bookingsData, this.batchSize);
      logger.info(`Processing ${batches.length} batches of ${this.batchSize} bookings each`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        logger.debug(`Processing batch ${batchIndex + 1}/${batches.length}`);

        // Process batch with limited concurrency
        const batchPromises = batch.map(async (bookingData, itemIndex) => {
          const globalIndex = batchIndex * this.batchSize + itemIndex;
          
          try {
            // Use distributed lock for each booking creation
            const lockKey = `bulk:booking:${globalIndex}:${Date.now()}`;
            
            const booking = await distributedLock.withLock(lockKey, async () => {
              return await Booking.create(bookingData);
            }, 10); // 10 second lock for creation

            // Publish event asynchronously
            setImmediate(() => {
              messageService.publishBookingEvent('BOOKING_CREATED', booking)
                .catch(error => logger.error('Bulk booking event publish error:', { 
                  error: error.message,
                  bookingRef: booking.ref_id 
                }));
            });

            results.successful.push({
              index: globalIndex,
              booking,
              ref_id: booking.ref_id
            });

            logger.debug(`Bulk booking created: ${booking.ref_id} (${globalIndex + 1}/${bookingsData.length})`);
            
          } catch (error) {
            logger.error(`Bulk booking creation failed for item ${globalIndex}:`, { 
              error: error.message,
              bookingData 
            });
            
            results.failed.push({
              index: globalIndex,
              error: error.message,
              bookingData
            });
          }
        });

        // Wait for batch completion with concurrency limit
        await this.limitConcurrency(batchPromises, this.maxConcurrency);
        
        results.totalProcessed += batch.length;
        
        // Brief pause between batches to prevent overwhelming the system
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      results.processingTime = Date.now() - startTime;
      
      logger.info(`✅ Bulk booking creation completed`, {
        totalBookings: bookingsData.length,
        successful: results.successful.length,
        failed: results.failed.length,
        processingTimeMs: results.processingTime,
        throughput: `${(bookingsData.length / (results.processingTime / 1000)).toFixed(2)} bookings/sec`
      });

      // Invalidate relevant caches
      await cacheService.invalidate('bookings:page:*');
      
      return results;

    } catch (error) {
      logger.error('Bulk booking creation error:', { 
        error: error.message,
        totalBookings: bookingsData.length,
        processedSoFar: results.totalProcessed 
      });
      throw error;
    }
  }

  /**
   * Bulk status updates with distributed locking
   */
  async updateBookingStatusBulk(updates) {
    logger.info(`🔄 Starting bulk status updates: ${updates.length} updates`);
    
    const startTime = Date.now();
    const results = {
      successful: [],
      failed: [],
      skipped: [],
      totalProcessed: 0
    };

    try {
      // Group updates by booking to avoid conflicts
      const updatesByBooking = new Map();
      updates.forEach((update, index) => {
        const key = update.ref_id;
        if (!updatesByBooking.has(key)) {
          updatesByBooking.set(key, []);
        }
        updatesByBooking.get(key).push({ ...update, originalIndex: index });
      });

      logger.info(`Grouped ${updates.length} updates into ${updatesByBooking.size} booking groups`);

      // Process each booking's updates sequentially to maintain order
      for (const [refId, bookingUpdates] of updatesByBooking.entries()) {
        try {
          const lockKey = `booking:bulk:status:${refId}`;
          
          await distributedLock.withLock(lockKey, async () => {
            logger.debug(`Processing ${bookingUpdates.length} updates for booking: ${refId}`);
            
            for (const update of bookingUpdates) {
              try {
                const booking = await Booking.findByRefId(refId);
                if (!booking) {
                  results.failed.push({
                    index: update.originalIndex,
                    ref_id: refId,
                    error: 'Booking not found'
                  });
                  continue;
                }

                // Validate status transition
                if (!this.isValidStatusTransition(booking.status, update.newStatus)) {
                  results.skipped.push({
                    index: update.originalIndex,
                    ref_id: refId,
                    reason: `Invalid transition: ${booking.status} → ${update.newStatus}`
                  });
                  continue;
                }

                // Update status
                const updatedBooking = await Booking.updateStatus(
                  booking._id,
                  update.newStatus,
                  update.eventData || {}
                );

                results.successful.push({
                  index: update.originalIndex,
                  ref_id: refId,
                  previousStatus: booking.status,
                  newStatus: update.newStatus,
                  booking: updatedBooking
                });

                // Publish event asynchronously
                setImmediate(() => {
                  messageService.publishBookingEvent(
                    `STATUS_${update.newStatus}`,
                    updatedBooking,
                    update.eventData || {}
                  ).catch(error => logger.error('Bulk status update event error:', { 
                    error: error.message,
                    refId 
                  }));
                });

                logger.debug(`Bulk status update: ${refId} → ${update.newStatus}`);

              } catch (error) {
                results.failed.push({
                  index: update.originalIndex,
                  ref_id: refId,
                  error: error.message
                });
              }
            }
          }, 60); // 60 second lock for bulk updates

          results.totalProcessed += bookingUpdates.length;

        } catch (error) {
          logger.error(`Bulk update error for booking ${refId}:`, { error: error.message });
          bookingUpdates.forEach(update => {
            results.failed.push({
              index: update.originalIndex,
              ref_id: refId,
              error: `Lock acquisition failed: ${error.message}`
            });
          });
        }
      }

      const processingTime = Date.now() - startTime;
      
      logger.info(`✅ Bulk status updates completed`, {
        totalUpdates: updates.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        processingTimeMs: processingTime,
        throughput: `${(updates.length / (processingTime / 1000)).toFixed(2)} updates/sec`
      });

      // Invalidate caches after bulk updates
      await cacheService.invalidate('bookings:*');
      await cacheService.invalidate('booking:details:*');

      return { ...results, processingTime };

    } catch (error) {
      logger.error('Bulk status update error:', { 
        error: error.message,
        totalUpdates: updates.length 
      });
      throw error;
    }
  }

  /**
   * Bulk flight data import/update
   */
  async importFlightsBulk(flightsData) {
    logger.info(`✈️ Starting bulk flight import: ${flightsData.length} flights`);
    
    const startTime = Date.now();
    const results = await performanceService.processBatch(
      flightsData,
      this.batchSize,
      async (flightData) => {
        // Validate flight data
        if (!flightData.flight_number || !flightData.origin || !flightData.destination) {
          throw new Error('Missing required flight fields');
        }

        if (flightData.origin === flightData.destination) {
          throw new Error('Origin and destination cannot be the same');
        }

        if (new Date(flightData.departure_ts) >= new Date(flightData.arrival_ts)) {
          throw new Error('Departure must be before arrival');
        }

        // Use distributed lock for flight creation/update
        const lockKey = `flight:${flightData.flight_number}`;
        
        return await distributedLock.withLock(lockKey, async () => {
          // Check if flight exists
          const existingFlight = await Flight.find({ flight_number: flightData.flight_number });
          
          if (existingFlight.length > 0) {
            // Update existing flight
            return await Flight.updateById(existingFlight[0]._id, flightData);
          } else {
            // Create new flight
            return await Flight.create(flightData);
          }
        }, 15);
      }
    );

    const processingTime = Date.now() - startTime;
    
    logger.info(`✅ Bulk flight import completed`, {
      totalFlights: flightsData.length,
      successful: results.results.length,
      failed: results.errors.length,
      processingTimeMs: processingTime,
      throughput: `${(flightsData.length / (processingTime / 1000)).toFixed(2)} flights/sec`
    });

    // Invalidate flight and route caches
    await cacheService.invalidate('flights:*');
    await cacheService.invalidate('routes:*');

    return results;
  }

  /**
   * Utility methods
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async limitConcurrency(promises, maxConcurrency) {
    const results = [];
    
    for (let i = 0; i < promises.length; i += maxConcurrency) {
      const batch = promises.slice(i, i + maxConcurrency);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const transitions = {
      'BOOKED': ['DEPARTED', 'CANCELLED'],
      'DEPARTED': ['ARRIVED', 'CANCELLED'],
      'ARRIVED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': []
    };
    
    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Performance monitoring for bulk operations
   */
  async monitorBulkPerformance(operationType, itemCount, processingTime) {
    const throughput = itemCount / (processingTime / 1000);
    
    logger.info(`📊 Bulk operation performance: ${operationType}`, {
      itemCount,
      processingTimeMs: processingTime,
      throughputPerSecond: throughput.toFixed(2),
      avgTimePerItem: (processingTime / itemCount).toFixed(2)
    });

    // Alert on performance issues
    if (throughput < 10) {
      logger.warn(`⚠️ Low throughput detected for ${operationType}`, {
        throughput: throughput.toFixed(2),
        expected: '> 10 items/sec'
      });
    }

    if (processingTime > 30000) {
      logger.warn(`⚠️ Long processing time for ${operationType}`, {
        processingTimeMs: processingTime,
        itemCount
      });
    }

    return {
      operationType,
      itemCount,
      processingTime,
      throughput,
      timestamp: new Date().toISOString()
    };
  }
}

export const bulkOperationService = new BulkOperationService();