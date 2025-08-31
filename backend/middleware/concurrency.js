// This file is deprecated - functionality moved to distributedLock.js
// Keeping for backward compatibility during migration

import { withDistributedLock, lockKeys as newLockKeys } from './distributedLock.js';
import logger from '../utils/logger.js';

logger.warn('⚠️ concurrency.js is deprecated. Please use distributedLock.js instead.');

// Re-export new implementations for backward compatibility
export const withBookingLock = withDistributedLock;
export const lockKeys = newLockKeys;