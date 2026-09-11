# Architectural Decisions (ADR)

## ADR 001: Monorepo Structure
**Status:** Accepted
**Context:** Need to manage multiple applications and shared packages.
**Decision:** Use a standard monorepo structure with `apps/` and `packages/`.
**Consequences:** Better code sharing, unified linting/formatting, but slightly more complex CI/CD setup.

## ADR 002: Modular Monolith vs Microservices
**Status:** Accepted
**Context:** Product complexity vs development speed.
**Decision:** Start with a Modular Monolith.
**Consequences:** Easier development and deployment initially; boundaries are enforced via module structures to allow future extraction if needed.

## ADR 003: Multi-Tenancy - Logical Isolation
**Status:** Accepted
**Context:** Need to support thousands of schools.
**Decision:** Logical isolation with `schoolId`.
**Consequences:** Simplified infrastructure; requires rigorous backend checks to prevent data leakage.
