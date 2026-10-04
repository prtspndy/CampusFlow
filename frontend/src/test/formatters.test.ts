import { describe, it, expect } from 'vitest';
import { formatINR, formatPaise, formatDate, formatDateTime, truncateId, getStatusStyle } from '../lib/formatters';

describe('formatters', () => {
  describe('formatINR', () => {
    it('formats rupees with rupee symbol and Indian grouping', () => {
      const result = formatINR(1500);
      expect(result).toContain('1,500');
      expect(result).toContain('₹');
    });

    it('formats large numbers with Indian lakh/crore commas', () => {
      const result = formatINR(100000);
      expect(result).toContain('1,00,000');
    });

    it('formats 0 correctly', () => {
      const result = formatINR(0);
      expect(result).toContain('0');
      expect(result).toContain('₹');
    });

    it('safely handles NaN, Infinity, negative, and invalid values without producing ₹NaN', () => {
      expect(formatINR(NaN)).toBe('₹0');
      expect(formatINR(Infinity)).toBe('₹0');
      expect(formatINR(-Infinity)).toBe('₹0');
      expect(formatINR(undefined as unknown as number)).toBe('₹0');
      expect(formatINR(null as unknown as number)).toBe('₹0');
      expect(formatINR(-500)).toContain('500');
      expect(formatINR(-500)).not.toContain('NaN');
    });

    it('calculates and formats multi-quantity totals correctly', () => {
      const unitPrice = 500;
      expect(formatINR(unitPrice * 1)).toContain('500');
      expect(formatINR(unitPrice * 3)).toContain('1,500');
      expect(formatINR(unitPrice * 10)).toContain('5,000');
    });
  });

  describe('formatPaise', () => {
    it('converts paise to rupees accurately', () => {
      const result = formatPaise(25000); // 250 INR
      expect(result).toContain('250');
      expect(result).toContain('₹');
    });

    it('converts small paise amounts with fractional values', () => {
      const result = formatPaise(9950); // 99.50 INR
      expect(result).toContain('99.5');
    });

    it('safely handles NaN, Infinity, negative, and invalid values without producing ₹NaN', () => {
      expect(formatPaise(NaN)).toBe('₹0');
      expect(formatPaise(Infinity)).toBe('₹0');
      expect(formatPaise(-Infinity)).toBe('₹0');
      expect(formatPaise(undefined as unknown as number)).toBe('₹0');
      expect(formatPaise(null as unknown as number)).toBe('₹0');
      expect(formatPaise(-25000)).toContain('250');
      expect(formatPaise(-25000)).not.toContain('NaN');
    });

    it('converts multi-quantity ticket order amounts in paise correctly', () => {
      // 1 ticket @ ₹500 = 50,000 paise -> ₹500
      expect(formatPaise(50000)).toContain('500');
      // 3 tickets @ ₹500 = 150,000 paise -> ₹1,500
      expect(formatPaise(150000)).toContain('1,500');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO dates', () => {
      const formatted = formatDate('2026-05-15T10:00:00.000Z');
      expect(formatted).toMatch(/15\s+May\s+2026/);
    });

    it('returns em-dash for null, undefined, or empty values', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('returns em-dash for invalid date strings', () => {
      expect(formatDate('invalid-date-string')).toBe('—');
    });
  });

  describe('formatDateTime', () => {
    it('formats valid ISO timestamps with hour and minute', () => {
      const formatted = formatDateTime('2026-05-15T14:30:00.000Z');
      expect(formatted).toContain('2026');
      expect(formatted).toMatch(/am|pm|AM|PM/);
    });

    it('returns em-dash for missing or invalid dates', () => {
      expect(formatDateTime(null)).toBe('—');
      expect(formatDateTime('not-a-date')).toBe('—');
    });
  });

  describe('truncateId', () => {
    it('truncates strings longer than specified length', () => {
      expect(truncateId('clrk90918000108l4309a1234', 8)).toBe('clrk9091...');
    });

    it('leaves short strings untouched', () => {
      expect(truncateId('short', 8)).toBe('short');
    });

    it('returns empty string for empty input', () => {
      expect(truncateId('')).toBe('');
    });
  });

  describe('getStatusStyle', () => {
    it('maps positive statuses to success color', () => {
      expect(getStatusStyle('ACTIVE').color).toBe('success');
      expect(getStatusStyle('PAID').color).toBe('success');
      expect(getStatusStyle('CONFIRMED').color).toBe('success');
      expect(getStatusStyle('APPROVED').color).toBe('success');
      expect(getStatusStyle('SETTLED').color).toBe('success');
    });

    it('maps waiting statuses to warning color', () => {
      expect(getStatusStyle('PENDING').color).toBe('warning');
      expect(getStatusStyle('DRAFT').color).toBe('warning');
      expect(getStatusStyle('PENDING_PAYMENT').color).toBe('warning');
    });

    it('maps negative statuses to error color', () => {
      expect(getStatusStyle('REJECTED').color).toBe('error');
      expect(getStatusStyle('CANCELLED').color).toBe('error');
      expect(getStatusStyle('FAILED').color).toBe('error');
      expect(getStatusStyle('NO_SHOW').color).toBe('error');
    });

    it('falls back to default for unrecognized statuses', () => {
      expect(getStatusStyle('SOME_CUSTOM_STATUS').color).toBe('default');
    });
  });
});
