'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so no
    // BEGIN/COMMIT — the same as m-20260923-company-event-partner-delegation.
    //
    // An admin moving a company's next-due date by hand (e.g. an extension).
    // The old and new date get their own columns rather than `reason`, which
    // the reminder events already use for a single ISO date.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DUE_DATE_CHANGED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DUE_DATE_CHANGED';
    `)

    // Separate statement: a new enum value is only usable once the ADD VALUE
    // that created it has committed.
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_event
        ADD COLUMN IF NOT EXISTS from_due_at TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS to_due_at TIMESTAMPTZ DEFAULT NULL;

      COMMENT ON COLUMN company_event.from_due_at IS 'Next-due date before a *_DUE_DATE_CHANGED event; null when the company had none, and on every other event.';
      COMMENT ON COLUMN company_event.to_due_at IS 'Next-due date after a *_DUE_DATE_CHANGED event; null on every other event.';

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'company_event_due_date_changed_chk'
        ) THEN
          ALTER TABLE company_event
            ADD CONSTRAINT company_event_due_date_changed_chk CHECK (
              event_type NOT IN ('EQUALITY_REPORT_DUE_DATE_CHANGED', 'SALARY_REPORT_DUE_DATE_CHANGED')
              OR to_due_at IS NOT NULL
            );
        END IF;
      END $$;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // The enum values stay, for the reason m-20260821-company-event-api-key
    // gives: Postgres cannot drop an enum value in place.
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE company_event DROP CONSTRAINT IF EXISTS company_event_due_date_changed_chk;
      ALTER TABLE company_event DROP COLUMN IF EXISTS from_due_at;
      ALTER TABLE company_event DROP COLUMN IF EXISTS to_due_at;
      COMMIT;
    `)
  },
}
