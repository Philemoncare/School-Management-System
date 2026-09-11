# Results & Report Cards

## Overview
The Results module processes approved scores into official academic records.

## Data Flow
1. **Source:** `StudentAssessmentScore` (must be `APPROVED`).
2. **Calculation:** `SubjectResult` is derived by applying weights to contributing assessments.
3. **Aggregation:** `OverallResult` summarizes performance across all subjects for a term or year.

## Statuses
- `DRAFT`: Initial calculation, not yet reviewed.
- `CALCULATED`: Ready for approval.
- `APPROVED`: Validated by academic administration.
- `PUBLISHED`: Visible to students and parents.
- `LOCKED`: Archived for historical records.

## Calculation Engine
Authoritative calculations are handled in the `ResultsService`. 
- **Weighted Score:** `Sum(Assessment % * Assessment Weight)`.
- **Grade Lookup:** Percentages are matched against the active `GradingScale`.

## Access Control
- **Students/Guardians:** Can only view `PUBLISHED` results.
- **Teachers:** Can view results for their assigned classes.
- **Admins:** Full control over calculation, approval, and publication.
