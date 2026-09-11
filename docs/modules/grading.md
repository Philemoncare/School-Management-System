# Grading Configuration

## Overview
The Grading module provides a flexible way for schools to define how raw scores are converted into letter grades and grade points.

## Grading Scales
A `GradingScale` is a collection of `GradeBands`. Schools can define multiple scales (e.g., one for Primary, one for Secondary).

## Grade Bands
Each band defines:
- **Grade:** The letter or symbol (A, B+, etc).
- **Percentage Range:** The minimum and maximum percentage required for this grade.
- **Grade Point:** Numeric value for GPA calculation (e.g., 4.0).
- **Remark:** Qualitative feedback (e.g., "Excellent").

## Calculation Logic
The system calculates grades based on:
1. **Weighted Average:** Sum of (Component Score * Component Weight).
2. **Band Lookup:** Find the band where the calculated percentage falls between `min` and `max`.

## Rounding
By default, the system retains raw precision for internal calculations and rounds to 2 decimal places for display and final grade lookup.
