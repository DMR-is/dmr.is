'use strict'

/**
 * Adds `company_report.sector`: the company's sector as it stood at filing.
 *
 * Since m-20261015 the sector decides whether a salary report may be filed with
 * no equality coverage (SVEITARFELAG files as EXEMPT). The live
 * `company.sector` can change afterwards — by hand through
 * `PATCH /company/:id/sector`, or by an RSK refresh — and a change leaves only a
 * log line. Without this column an EXEMPT row could not be traced to the
 * sector that allowed it once the company had been reclassified.
 *
 * Copied from the live `company` row at submission, like
 * `employee_count_category`, never from the submission payload: a caller that
 * could state its own sector could claim the exemption.
 *
 * Nullable, and existing rows are left null. The sector those reports were
 * filed under was never recorded, and back-filling today's value would pass a
 * guess off as a snapshot.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_report
        ADD COLUMN sector company_sector_enum DEFAULT NULL;

      COMMENT ON COLUMN company_report.sector IS 'The company''s sector at submission, copied from company.sector. Records the basis of an EXEMPT salary filing (see report.equality_source). Null on rows filed before this column existed.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE company_report DROP COLUMN sector;
    `)
  },
}
