'use strict'

/**
 * `report.company_admin_title` — the job title (starfsheiti) of the company
 * executive (æðsti stjórnandi). The executive was already snapshotted on the
 * report as name / email / gender; the title was missing, so the detail view
 * and the PDF could only show who the executive is, not what they do.
 *
 * Nullable: every existing report predates the field, and the submitting
 * clients (island.is application + admin web) may omit it.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS company_admin_title TEXT;

      COMMENT ON COLUMN report.company_admin_title IS 'Job title (starfsheiti) of the company executive, snapshotted at submission time. Nullable — not collected for reports created before the field existed.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE report DROP COLUMN IF EXISTS company_admin_title;
      COMMIT;
    `)
  },
}
