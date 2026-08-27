'use strict'

/**
 * `report.contact_title` — the job title (starfsheiti) of the company contact
 * (tengiliður). The contact was already snapshotted on the report as name /
 * email / phone; the title was missing, so neither the detail view nor the PDF
 * could show what the contact does at the company.
 *
 * Mirrors `company_admin_title` (m-20260729): nullable, because every existing
 * report predates the field and the submitting clients (island.is application +
 * admin web) may omit it.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS contact_title TEXT;

      COMMENT ON COLUMN report.contact_title IS 'Job title (starfsheiti) of the company contact, snapshotted at submission time. Nullable — not collected for reports created before the field existed.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE report DROP COLUMN IF EXISTS contact_title;
      COMMIT;
    `)
  },
}
