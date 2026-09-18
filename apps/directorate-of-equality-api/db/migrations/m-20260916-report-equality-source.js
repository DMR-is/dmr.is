'use strict'

/**
 * Records WHY a salary report's `equality_report_id` is null.
 *
 * Until now the answer was "it never is" — `db/README.md` → "Gating rule"
 * states the invariant, `resolveEqualityReport` throws a 500 on a salary row
 * without the link, and every submit path resolved an APPROVED `report` row or
 * refused the submission. That refusal is the bug this migration is part of:
 * at hand-over 1 507 of the 1 753 loaded companies at 25+ hold no `report` row
 * at all, and ~540 of them hold an equality plan the Directorate itself records
 * as in force — on `legacy_report.equality_valid_until`, because the register
 * load mints no `report` rows (see `LegacyReportModel`). The admin register has
 * counted that as coverage since m-20260901; the application portal did not, so
 * a legacy-certified company was told it had no equality plan and could file
 * nothing.
 *
 * Widening the portal to accept legacy coverage means a salary report can now
 * be filed with nothing to point `equality_report_id` at — a legacy certificate
 * is a date on an archived sheet row, not a report with an id. Two columns say
 * so explicitly rather than leaving a null to be interpreted:
 *
 * `equality_source` is the discriminator. `NOT NULL DEFAULT 'REPORT'` makes
 * this a non-event for existing rows: every report filed before today WAS
 * audited against a real equality report, so the backfill is correct rather
 * than merely convenient, and no read path has to handle a null.
 *
 * `equality_legacy_valid_until` snapshots the certificate's stated expiry as it
 * read at filing time. It is a copy, not a reference, and deliberately so:
 * `legacy_report` has no natural upsert key and the register load replaces it
 * wholesale (`DELETE` then insert), so an FK into it would either block that
 * load or leave the audit trail to be rewritten by the next re-export. The
 * salary report's record of what covered it has to outlive the archive, for the
 * same reason `company_report` snapshots the company rather than joining to it.
 *
 * The CHECK ties the three columns together in both directions, so neither a
 * LEGACY row carrying a report link nor a REPORT row carrying a legacy date can
 * be written. LEGACY is confined to `type = 'SALARY'` for the same reason
 * `report_equality_fk_type_chk` confines the FK: an equality report is not
 * audited against anything.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS equality_source TEXT NOT NULL DEFAULT 'REPORT',
        ADD COLUMN IF NOT EXISTS equality_legacy_valid_until DATE DEFAULT NULL;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_check;

      ALTER TABLE report
        ADD CONSTRAINT report_equality_source_check
        CHECK (equality_source IN ('REPORT', 'LEGACY'));

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_coherence_check;

      -- LEGACY is a salary report audited against an archived certificate:
      -- there is no report row to link, and the date is the only thing that
      -- evidences the coverage, so it has to be there. REPORT is every other
      -- row, and a legacy date on one would claim a basis it did not use.
      ALTER TABLE report
        ADD CONSTRAINT report_equality_source_coherence_check
        CHECK (
          (
            equality_source = 'LEGACY'
            AND type = 'SALARY'
            AND equality_report_id IS NULL
            AND equality_legacy_valid_until IS NOT NULL
          )
          OR
          (
            equality_source = 'REPORT'
            AND equality_legacy_valid_until IS NULL
          )
        );

      COMMENT ON COLUMN report.equality_source IS 'What the equality obligation was met by when this salary report was filed: REPORT (an APPROVED report in this system, linked via equality_report_id) or LEGACY (an unexpired certificate from the retired SharePoint register, which mints no report row — see legacy_report). Always REPORT on equality reports and on every row filed before the legacy basis was accepted.';
      COMMENT ON COLUMN report.equality_legacy_valid_until IS 'Snapshot of legacy_report.equality_valid_until as it read when this salary report was filed. Non-null exactly when equality_source = LEGACY. A copy rather than an FK because the register load replaces legacy_report wholesale, and this audit trail must outlive the next re-export.';

      COMMENT ON TABLE legacy_report IS 'Archive of the Directorate''s retired SharePoint register (Adda eftirlit Gagnasafn), one row per sheet row. Written once by the company-register load. The compliance status derives from it: companyReportStatusCaseSql counts an unexpired equality_valid_until / salary_valid_until as coverage beside an APPROVED report, because 1 507 of the loaded companies at 25+ hold no report row. buildCompanyExpiryWhere reads the same two dates for the "expires within" queue. The application portal reads equality_valid_until too, as of m-20260916: an unexpired legacy equality certificate satisfies the precondition for filing a salary report, and the resulting report row records that with equality_source = LEGACY rather than a link. Only the dates are read, plus validity on the salary side — an Útrunnið row is a surrendered certificate, not coverage.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_coherence_check;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_check;

      ALTER TABLE report
        DROP COLUMN IF EXISTS equality_legacy_valid_until,
        DROP COLUMN IF EXISTS equality_source;

      COMMENT ON TABLE legacy_report IS 'Archive of the Directorate''s retired SharePoint register (Adda eftirlit Gagnasafn), one row per sheet row. Written once by the company-register load. The compliance status derives from it: companyReportStatusCaseSql counts an unexpired equality_valid_until / salary_valid_until as coverage beside an APPROVED report, because 1 507 of the loaded companies at 25+ hold no report row. buildCompanyExpiryWhere reads the same two dates for the "expires within" queue. Only the dates are read, plus validity on the salary side — an Útrunnið row is a surrendered certificate, not coverage.';

      COMMIT;
    `)
  },
}
