'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- company.next_equality_report_due_at / next_salary_report_due_at
    --
    -- The date a company is next due to submit its equality report and its
    -- salary report (launagreining). Populated from the release seed file;
    -- nullable until then and for companies with no obligation.
    -- ============================================================

    ALTER TABLE company
      ADD COLUMN next_equality_report_due_at TIMESTAMPTZ DEFAULT NULL;
    ALTER TABLE company
      ADD COLUMN next_salary_report_due_at TIMESTAMPTZ DEFAULT NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE company
      DROP COLUMN next_salary_report_due_at;
    ALTER TABLE company
      DROP COLUMN next_equality_report_due_at;

    COMMIT;
    `)
  },
}
