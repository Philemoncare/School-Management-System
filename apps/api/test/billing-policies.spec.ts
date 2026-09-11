import { BillingService } from '../src/subscriptions/billing.service';
import { BillingInterval } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('Billing Policies (Deterministic)', () => {
  const service = new BillingService();

  describe('Policy 27: Month-End Billing Rule', () => {
    it('January 31 + 1 Month should be February 28 (non-leap year)', () => {
      const start = new Date('2023-01-31');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.getDate()).toBe(28);
      expect(next.getMonth()).toBe(1); // February
    });

    it('January 31 + 1 Month should be February 29 (leap year)', () => {
      const start = new Date('2024-01-31');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.getDate()).toBe(29);
    });

    it('March 31 + 1 Month should be April 30', () => {
      const start = new Date('2026-03-31');
      const next = service.calculateNextBillingDate(start, BillingInterval.MONTHLY);
      expect(next.getDate()).toBe(30);
    });
  });

  describe('Policy 7: Daily Proration Method', () => {
    it('should calculate 50% net charge for a mid-month upgrade from 100 to 200', () => {
      const oldPrice = new Decimal(100);
      const newPrice = new Decimal(200);
      const start = new Date('2026-10-01');
      const end = new Date('2026-10-31');
      const now = new Date('2026-10-16'); // Exactly halfway in a 30-day window (approx)

      const result = service.calculateProration(oldPrice, newPrice, start, end, now);

      // remaining days: Oct 16 to Oct 31 = 15 days
      // total days: Oct 1 to Oct 31 = 30 days
      // Credit: (100 / 30) * 15 = 50
      // Charge: (200 / 30) * 15 = 100
      // Net: 100 - 50 = 50
      expect(result.credit.toNumber()).toBe(50);
      expect(result.charge.toNumber()).toBe(100);
      expect(result.net.toNumber()).toBe(50);
    });
  });
});
