import { nanoid } from 'nanoid/non-secure';

export const generateBookingRef = (): string => {
  const prefix = 'RG';
  const id = nanoid(8).toUpperCase();
  return `${prefix}${id}`;
};

export const generateFlightId = (): string => {
  return nanoid(10);
};