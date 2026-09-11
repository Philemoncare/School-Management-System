import { Injectable } from '@nestjs/common';
import { BillingInterval } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BillingService {
  /**
   * Calculates the next billing date based on interval and the Month-End Billing Rule.
   * Rule: If the start date day doesn't exist in the next month, use the last valid day.
   */
  calculateNextBillingDate(startDate: Date, interval: BillingInterval): Date {
    const nextDate = new Date(startDate);
    const dayOfMonth = startDate.getDate();

    switch (interval) {
      case BillingInterval.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingInterval.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingInterval.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case BillingInterval.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    // Month-End Rule implementation
    // If the day changed (e.g. Jan 31 -> Mar 3), set to last day of previous month (Feb 28/29)
    if (nextDate.getDate() !== dayOfMonth) {
      nextDate.setDate(0);
    }

    return nextDate;
  }

  /**
   * Calculates daily proration for upgrades.
   * Formula: (Price / Days in Period) * Remaining Days
   */
  calculateProration(
    currentPrice: Decimal,
    newPrice: Decimal,
    periodStart: Date,
    periodEnd: Date,
    effectiveDate: Date
  ) {
    const totalDaysInPeriod = this.getDaysBetween(periodStart, periodEnd);
    const remainingDays = this.getDaysBetween(effectiveDate, periodEnd);

    if (totalDaysInPeriod <= 0) {
      return {
        credit: new Decimal(0),
        charge: new Decimal(0),
        net: new Decimal(0),
        remainingDays: 0,
      };
    }

    // Use higher precision for intermediate rates
    const oldDailyRate = currentPrice.dividedBy(totalDaysInPeriod);
    const newDailyRate = newPrice.dividedBy(totalDaysInPeriod);

    const prorationCredit = oldDailyRate.times(remainingDays);
    const prorationCharge = newDailyRate.times(remainingDays);
    const netAmount = prorationCharge.minus(prorationCredit);

    return {
      credit: prorationCredit,
      charge: prorationCharge,
      net: netAmount,
      remainingDays,
      totalDays: totalDaysInPeriod,
    };
  }

  getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
