# Examinations & Assessments

## Overview
The Assessments module allows schools to define and manage various types of academic evaluations, from daily quizzes to final examinations.

## Data Model
- **AssessmentType:** Categories of assessment (e.g., QUIZ, EXAM).
- **Assessment:** A specific evaluation task for a class and subject.
- **AssessmentComponent:** Sub-parts of an assessment (e.g., Theory vs Practical).
- **StudentAssessmentScore:** The individual result for a student.

## Assessment Lifecycle
1. **DRAFT:** Initial creation.
2. **SCHEDULED:** Dates and venues set.
3. **OPEN:** Evaluation is currently happening.
4. **SUBMISSION_OPEN:** Teachers can enter scores.
5. **SUBMITTED:** Scores entered and sent for review.
6. **APPROVED:** Scores validated by Principal/Admin.
7. **PUBLISHED:** Visible to students/parents.
8. **LOCKED:** No further changes allowed.

## Score Statuses
- `NOT_ENTERED`
- `ABSENT`
- `EXCUSED`
- `DRAFT`
- `SUBMITTED`
- `VALIDATED`
- `APPROVED`
- `LOCKED`

## Validation Rules
- Scores must be within the range [0, totalMarks].
- Only students active in the corresponding Class/Section/Subject can be marked.
- Locked assessments prevent all score modifications.
