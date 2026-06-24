'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Daily fines move from a report-level timestamp to a
    -- company-level boolean flag.
    --
    -- A company in the daily-fines process is being handled OUTSIDE
    -- this system; the flag just lets admins know not to act on it
    -- through the normal flow. The "when" + reason are captured on
    -- the company_event audit row, so no timestamp is stored here.
    --
    -- The old report-level model (timestamp + accrual cron index) is
    -- removed entirely; the planned report_fine accrual table is
    -- abandoned.
    -- ============================================================

    ALTER TABLE company
      ADD COLUMN fines_started BOOLEAN NOT NULL DEFAULT false;

    DROP INDEX IF EXISTS report_fines_cron_idx;

    ALTER TABLE report
      DROP COLUMN fines_started_at;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report
      ADD COLUMN fines_started_at TIMESTAMPTZ DEFAULT NULL;

    CREATE INDEX report_fines_cron_idx
      ON report (fines_started_at)
      WHERE fines_started_at IS NOT NULL
        AND status NOT IN ('APPROVED', 'SUPERSEDED');

    ALTER TABLE company
      DROP COLUMN fines_started;

    COMMIT;
    `)
  },
}
