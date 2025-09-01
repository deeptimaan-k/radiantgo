export interface ValidationError {
  field: string;
  message: string;
}

export const validateBookingForm = (data: {
  origin: string;
  destination: string;
  pieces: number;
  weight: number;
  departure_date: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.origin.trim()) {
    errors.push({ field: 'origin', message: 'Origin is required' });
  } else if (data.origin.length !== 3) {
    errors.push({ field: 'origin', message: 'Origin must be a 3-letter airport code' });
  }

  if (!data.destination.trim()) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  } else if (data.destination.length !== 3) {
    errors.push({ field: 'destination', message: 'Destination must be a 3-letter airport code' });
  }

  if (data.origin.trim() === data.destination.trim()) {
    errors.push({ field: 'destination', message: 'Destination must be different from origin' });
  }

  if (data.pieces <= 0) {
    errors.push({ field: 'pieces', message: 'Number of pieces must be greater than 0' });
  }

  if (data.weight <= 0) {
    errors.push({ field: 'weight', message: 'Weight must be greater than 0' });
  } else if (data.weight > 10000) {
    errors.push({ field: 'weight', message: 'Weight cannot exceed 10,000 kg per booking' });
  }

  if (!data.departure_date) {
    errors.push({ field: 'departure_date', message: 'Departure date is required' });
  } else {
    const selectedDate = new Date(data.departure_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push({ field: 'departure_date', message: 'Departure date cannot be in the past' });
    }
  }

  return errors;
};

export const validateRefId = (refId: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!refId.trim()) {
    errors.push({ field: 'refId', message: 'Reference ID is required' });
  }

  return errors;
};