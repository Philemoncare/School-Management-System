# Examinations, Grading & Results Architecture

## 1. Overview
The Examinations and Results module manages the entire academic assessment lifecycle, from exam scheduling and score entry to result calculation and report card generation. It is designed to ensure data integrity, historical stability, and multi-tenant isolation.

## 2. Core Entities
- **ExaminationPeriod**: High-level exam windows (e.g., "End of Term Exams").
- **ExaminationSession**: Individual subject-level exams scheduled within a period, linked to rooms and invigilators.
- **Assessment**: Configurable tasks (tests, projects, exams) with specific weights.
- **SubjectResult**: Authoritative terminal calculation for a single subject, including grade and grade point.
- **OverallResult**: Terminal calculation for a student's entire performance in a term/year, including class ranking.
- **ReportCard**: Published statement of results, preserving snapshots of scores and teacher comments.

## 3. Workflow Lifecycle
1. **Setup**: Admins define `ExaminationPeriods` and `GradingScales`.
2. **Assessment**: Teachers create `Assessments` and enter `Scores`.
3. **Submission**: Teachers submit scores for review. Status moves to `SUBMITTED`.
4. **Approval**: Department heads or coordinators approve scores. Status moves to `APPROVED`.
5. **Calculation**: Admin triggers the `ResultCalculationService` to compute terminal totals and class ranks.
6. **Publication**: Admin publishes results, making them visible in Student/Guardian portals. This step locks the results and takes a snapshot for report cards.

## 4. Integrity & Security
- **Snapshot Pattern**: Once published, results are copied into a snapshot record (`ReportCardSubjectResultSnapshot`) to ensure historical reports remain unchanged even if grading policies are updated later.
- **Locking**: Published results can only be modified via a formal `ResultCorrectionRequest` workflow.
- **Tenant Isolation**: All calculations and views are strictly scoped to the logged-in `schoolId`.
- **Ranking**: Class rankings are calculated server-side using precise numeric logic to handle ties and dense ranking policies.

## 5. Report Card Generation
The system supports bulk generation of PDF report cards. These documents reference the authoritative published snapshots and include teacher/principal commentary and attendance summaries.
