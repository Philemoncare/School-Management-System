/**
 * Shared staff profile rules used by both the Staff module and the HR profile
 * endpoint so there is exactly one definition of "profile completeness" and of
 * the independent employment vs login-account statuses.
 */

/** Core fields that make up the standard staff data structure. */
export const CORE_COMPLETENESS_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email address' },
  { key: 'phone', label: 'Primary phone' },
  { key: 'departmentId', label: 'Department' },
  { key: 'positionId', label: 'Position' },
  { key: 'employmentType', label: 'Employment type' },
  { key: 'commencementDate', label: 'Employment commencement date' },
];

export type StaffCompletion = {
  percent: number;
  complete: boolean;
  missingFields: string[];
};

/**
 * Compute how complete a staff/teacher record is against the standard data
 * structure. Returns the missing core field labels so the UI can show an
 * accurate status instead of falsely presenting the record as complete.
 */
export function computeStaffCompletion(record: any): StaffCompletion {
  const missing = CORE_COMPLETENESS_FIELDS.filter(({ key }) => {
    const value = record?.[key];
    return value === undefined || value === null || String(value).trim() === '';
  });
  const total = CORE_COMPLETENESS_FIELDS.length;
  const completeCount = total - missing.length;
  return {
    percent: Math.round((completeCount / total) * 100),
    complete: missing.length === 0,
    missingFields: missing.map((field) => field.label),
  };
}

/**
 * Derive the login-account status independently from the employment status.
 * A staff member may be an ACTIVE employee with no login account yet.
 */
export function deriveAccountStatus(record: any): 'NOT_CREATED' | 'ACTIVE' | 'SUSPENDED' {
  if (!record?.user) return 'NOT_CREATED';
  if (record.user.isActive === false) return 'SUSPENDED';
  return 'ACTIVE';
}
