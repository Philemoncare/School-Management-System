# School Lifecycle

## States
1. **ACTIVE:** The school is fully operational. All authorized users can perform actions based on their roles.
2. **SUSPENDED:** Access is restricted. Typically due to payment failure or policy violations. Users see a suspension notice.
3. **DEACTIVATED:** The school is no longer operational but historical data is preserved.
4. **TRIAL:** Limited period for new schools to evaluate the platform.

## Transitions
- **ACTIVE → SUSPENDED:** Triggered by Super Admin or automated billing system.
- **SUSPENDED → ACTIVE:** Triggered by Super Admin after resolution.
- **ACTIVE → DEACTIVATED:** Permanent closure of a school account.

## Audit
Every lifecycle transition is logged with:
- `actorId`
- `timestamp`
- `previousStatus`
- `newStatus`
- `reason`
