'use strict'

/**
 * Re-issues `COMMENT ON TABLE legacy_report`.
 *
 * ## Why a migration for a comment
 *
 * `m-20260901-legacy-report.js` created the table with a comment stating that
 * "nothing derives from it — compliance status still comes from
 * report/company_report". That stopped being true in the release that followed:
 * `companyReportStatusCaseSql` now counts an unexpired `equality_valid_until` /
 * `salary_valid_until` as coverage beside an APPROVED `report`, because the
 * first production register load leaves 1 507 of 1 753 companies at 25+ with no
 * `report` row and they would otherwise all read MISSING_EQUALITY_REPORT.
 *
 * Editing the string in the original migration would fix it only for a database
 * created from scratch. That migration has already run wherever the register
 * load has — the load commits its `company` rows and its `legacy_report` rows
 * in one transaction under `ON_ERROR_STOP`, so seeded companies imply the table
 * exists — and that includes production. Correcting it in place would leave
 * every already-migrated database on the old text while new ones got the new
 * one, which is worse than either.
 *
 * `COMMENT ON` is the one kind of DDL where re-issuing is the entire change: no
 * lock of consequence, no rewrite, nothing to back-fill, and safe to run on a
 * database that already holds the corrected text.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      COMMENT ON TABLE legacy_report IS 'Archive of the Directorate''s retired SharePoint register (Adda eftirlit Gagnasafn), one row per sheet row. Written once by the company-register load. The compliance status derives from it: companyReportStatusCaseSql counts an unexpired equality_valid_until / salary_valid_until as coverage beside an APPROVED report, because 1 507 of the loaded companies at 25+ hold no report row. Only the dates are read, plus validity on the salary side — an Útrunnið row is a surrendered certificate, not coverage.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      COMMENT ON TABLE legacy_report IS 'Archive of the Directorate''s retired SharePoint register (Adda eftirlit Gagnasafn), one row per sheet row. Written once by the company-register load, read only by the company detail view''s legacy tab. Nothing derives from it — compliance status still comes from report/company_report.';

      COMMIT;
    `)
  },
}
