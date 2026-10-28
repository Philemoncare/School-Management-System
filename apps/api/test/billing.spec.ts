import { BillingService } from '../src/subscriptions/billing.service';
import { BillingInterval } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingService (Deterministic Calculations)', () => {
  const service = new BillingService();

  describe('calculateNextBillingDate', () => {
    it('should handle standard monthly renewal', () => {
      const start = new Date('2026-01-15');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.toISOString().split('T')[0]).toBe('2026-02-15');
    });

    it('should handle month-end overflow (Jan 31 -> Feb 28)', () => {
      const start = new Date('2026-01-31');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.toISOString().split('T')[0]).toBe('2026-02-28');
    });

    it('should handle leap year (Feb 29 -> Mar 29)', () => {
      const start = new Date('2024-02-29');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.toISOString().split('T')[0]).toBe('2024-03-29');
    });
  });

  describe('calculateProration', () => {
    it('should calculate 50% proration halfway through a 30-day month', () => {
      const oldPrice = new Decimal(100);
      const newPrice = new Decimal(200);
      const start = new Date('2026-10-01');
      const end = new Date('2026-10-31');
      const effective = new Date('2026-10-16'); // 15 days in, 15 remaining

      const result = service.calculateProration(oldPrice, newPrice, start, end, effective);

      // Old unused: (100 / 30) * 15 = 50
      // New remaining: (200 / 30) * 15 = 100
      // Net: 100 - 50 = 50
      expect(result.credit.toNumber()).toBe(50);
      expect(result.charge.toNumber()).toBe(100);
      expect(result.net.toNumber()).toBe(50);
      expect(result.remainingDays).toBe(15);
    });
  });
});
