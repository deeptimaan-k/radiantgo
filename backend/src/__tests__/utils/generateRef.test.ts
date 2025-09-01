import { generateBookingRef, generateFlightId } from '../../utils/generateRef';
import { nanoid } from 'nanoid/non-secure';
describe('Generate Reference Utils', () => {
  describe('generateBookingRef', () => {
    it('should generate valid booking reference', () => {
      const ref = generateBookingRef();
      expect(ref).toMatch(/^RG[A-Z0-9]{8}$/);
    });

    it('should generate unique references', () => {
      const ref1 = generateBookingRef();
      const ref2 = generateBookingRef();
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('generateFlightId', () => {
    it('should generate valid flight ID', () => {
      const id = generateFlightId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(10);
    });

    it('should generate unique IDs', () => {
      const id1 = generateFlightId();
      const id2 = generateFlightId();
      expect(id1).not.toBe(id2);
    });
  });
});