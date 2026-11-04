-- Staff Data Integrity: establish one standard staff data structure.
-- All columns are additive and nullable so existing staff records (e.g.
-- STA-2026-000006) are preserved. No data is dropped or recreated.
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "primary_phone" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "alt_phone" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "date_of_birth" DATE;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergency_contact_relationship" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "employment_type" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "appointment_date" DATE;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "commencement_date" DATE;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "contract_end_date" DATE;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "responsibilities" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "supervisor_staff_id" TEXT;

-- Reporting-supervisor relationship (self reference, within the same school).
DO $$
BEGIN
  ALTER TABLE "staff"
    ADD CONSTRAINT "staff_supervisor_staff_id_fkey"
    FOREIGN KEY ("supervisor_staff_id") REFERENCES "staff"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Speed up staff-directory search/contact lookups by school + email.
CREATE INDEX IF NOT EXISTS "staff_school_id_email_idx" ON "staff"("school_id", "email");
