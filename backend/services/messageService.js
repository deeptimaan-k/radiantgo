import amqp from 'amqplib';
import logger from '../utils/logger.js';

class MessageService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.eventQueue = []; // Fallback in-memory queue for WebContainer
  }

  async connect() {
    try {
      // In WebContainer, we'll use in-memory queue
      // In production, this would connect to actual RabbitMQ
      if (process.env.NODE_ENV === 'production' && process.env.RABBITMQ_URL) {
        logger.info('Connecting to RabbitMQ...', { url: process.env.RABBITMQ_URL });
        this.connection = await amqp.connect(process.env.RABBITMQ_URL);
        this.channel = await this.connection.createChannel();
        
        // Declare exchanges and queues
        logger.debug('Setting up RabbitMQ exchanges and queues...');
        await this.channel.assertExchange('booking.events', 'topic', { durable: true });
        await this.channel.assertQueue('booking.notifications', { durable: true });
        await this.channel.assertQueue('booking.tracking', { durable: true });
        
        this.isConnected = true;
        logger.info('✅ Connected to RabbitMQ');
      } else {
        logger.info('📝 Using in-memory message queue (WebContainer mode)');
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('❌ RabbitMQ connection failed:', { error: error.message });
      this.isConnected = false;
    }
  }

  async publishBookingEvent(eventType, bookingData, additionalData = {}) {
    logger.info(`Publishing booking event: ${eventType}`, { 
      bookingId: bookingData._id,
      refId: bookingData.ref_id,
      eventType 
    });
    
    const message = {
      eventType,
      bookingId: bookingData._id,
      refId: bookingData.ref_id,
      timestamp: new Date().toISOString(),
      data: {
        ...bookingData,
        ...additionalData
      }
    };

    try {
      if (this.channel) {
        const routingKey = `booking.${eventType.toLowerCase()}`;
        logger.debug(`Publishing to RabbitMQ exchange`, { 
          exchange: 'booking.events',
          routingKey,
          messageSize: JSON.stringify(message).length 
        });
        await this.channel.publish(
          'booking.events',
          routingKey,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );
        logger.info(`📤 Published event: ${eventType} for booking ${bookingData.ref_id}`, { routingKey });
      } else {
        // In-memory queue simulation
        this.eventQueue.push(message);
        logger.info(`📝 Queued event: ${eventType} for booking ${bookingData.ref_id}`, { 
          queueSize: this.eventQueue.length 
        });
        
        // Simulate processing
        setTimeout(() => {
          this.processEvent(message);
        }, 100);
      }
      return true;
    } catch (error) {
      logger.error('Message publishing error:', { 
        error: error.message, 
        eventType,
        bookingId: bookingData._id,
        refId: bookingData.ref_id 
      });
      return false;
    }
  }

  // Simulate event processing for WebContainer
  processEvent(message) {
    logger.info(`🔄 Processing event: ${message.eventType} for ${message.refId}`, { 
      eventType: message.eventType,
      refId: message.refId,
      timestamp: message.timestamp 
    });
    
    // Simulate different event handlers
    switch (message.eventType) {
      case 'BOOKING_CREATED':
        logger.info(`📧 Sending confirmation email for booking ${message.refId}`, { 
          customerEmail: message.data.customer_email 
        });
        break;
      case 'STATUS_DEPARTED':
        logger.info(`📱 Sending departure notification for ${message.refId}`, { 
          location: message.data.location 
        });
        break;
      case 'STATUS_ARRIVED':
        logger.info(`📱 Sending arrival notification for ${message.refId}`, { 
          location: message.data.location 
        });
        break;
      case 'STATUS_DELIVERED':
        logger.info(`✅ Sending delivery confirmation for ${message.refId}`, { 
          location: message.data.location 
        });
        break;
      case 'STATUS_CANCELLED':
        logger.info(`❌ Sending cancellation notice for ${message.refId}`, { 
          reason: message.data.notes 
        });
        break;
      default:
        logger.warn(`Unknown event type: ${message.eventType}`, { refId: message.refId });
    }
  }

  async getQueuedEvents() {
    logger.debug(`Retrieving queued events: ${this.eventQueue.length} events`);
    return [...this.eventQueue];
  }

  async disconnect() {
    logger.info('Disconnecting from message service...');
    if (this.channel) {
      await this.channel.close();
      logger.debug('RabbitMQ channel closed');
    }
    if (this.connection) {
      await this.connection.close();
      logger.debug('RabbitMQ connection closed');
    }
    this.eventQueue = [];
    logger.debug('Event queue cleared');
    this.isConnected = false;
    logger.info('Message service disconnected');
  }
}

export const messageService = new MessageService();