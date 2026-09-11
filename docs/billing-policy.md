# Subscription & Billing Policy (Master)

This document defines the deterministic billing and proration policies for the School Management SaaS platform.

## 1. Billing Intervals
We support standard intervals defined in the platform pricing:
- `MONTHLY`
- `QUARTERLY`
- `SEMI_ANNUAL`
- `ANNUAL`

## 2. Month-End Billing Rule
Calculations for next billing dates follow the **Last Valid Day** rule.
- If a subscription starts on the 31st and the next month only has 30 days, the renewal occurs on the 30th.
- **Example**: Jan 31 renewal happens on Feb 28 (or Feb 29 in leap years).

## 3. Proration Method (Upgrades)
We use a **Daily Proration Method** for all immediate plan changes.
- **Formula**: `(Plan Price / Total Days in Billing Period) * Remaining Days`.
- **Upgrade Workflow**:
    1. Calculate **Proration Credit** for the unused portion of the current plan.
    2. Calculate **Proration Charge** for the remaining portion of the new plan.
    3. **Net Amount** = `Proration Charge - Proration Credit`.
- **Zero/Negative Balances**: If the credit exceeds the charge, no cash refund is issued. The difference is stored as a **Subscription Credit** applied to the next automated invoice.

## 4. Downgrade Policy
Downgrades are **delayed** by default.
- Access to premium features remains active until the end of the current paid billing period.
- The new, lower-tier plan becomes effective at the start of the next period.
- No proration credits are issued for standard downgrades.

## 5. Cancellation Policy
We support two modes of cancellation:
1. **CANCEL_AT_PERIOD_END**: access remains until `currentPeriodEnd`.
2. **CANCEL_IMMEDIATELY**: access is revoked instantly. No automatic refund of unused time is issued.

## 6. Renewal & Grace Periods
- **Auto-Renew**: If enabled, an invoice is generated on the day of expiry.
- **Grace Period**: Subscriptions move to `PAST_DUE` status if payment fails. Access is maintained for the duration of the configured platform grace period (e.g., 7 days).
- **Suspension**: Failure to pay after the grace period results in `SUSPENDED` status, revoking feature access while preserving data.

## 7. Currency & Invoicing
- All billing occurs in the currency specified in the selected `SubscriptionPricing` record.
- **Cross-currency upgrades are prohibited** to prevent complex exchange rate issues.
- Once an invoice is issued, its totals are **immutable**. Corrections are handled via separate Credit/Debit adjustments.

## 8. Usage Tracking
- Limits (e.g., Max Students) are enforced server-side.
- Plan changes that result in lower limits will trigger a warning in the UI, but no data is deleted. Access to create **new** records will be restricted if the current count exceeds the new plan limit.
