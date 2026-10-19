'use strict'

/**
 * Adds `EXEMPT` to `report.equality_source`.
 *
 * Sveitarfélög may file a salary report whatever the state of their equality
 * report. Every other employer still has to be covered by an APPROVED report or
 * an unexpired legacy certificate (m-20260916). A municipality covered by
 * neither now files anyway, and its salary row has no report to link and no
 * certificate date to copy.
 *
 * EXEMPT records that, so the null `equality_report_id` is not left to be
 * interpreted. Without it the row would have to claim REPORT with no link,
 * which `resolveEqualityReport` treats as a data-integrity error, or LEGACY
 * with no date, which the coherence CHECK forbids.
 *
 * EXEMPT is recorded only when nothing covers the company. A municipality that
 * holds a plan still links it as REPORT or LEGACY. The sector the rule was
 * applied under is the company's sector at filing, which m-20261019 snapshots
 * on `company_report.sector`.
 *
 * The coherence CHECK gains an EXEMPT arm that mirrors LEGACY: SALARY only, no
 * link and no legacy date. The two existing arms are unchanged.
 *
 * `down` refuses while EXEMPT rows exist rather than rewriting them. There is
 * no truthful REPORT or LEGACY value to give a report that was filed under
 * neither.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_check;

      ALTER TABLE report
        ADD CONSTRAINT report_equality_source_check
        CHECK (equality_source IN ('REPORT', 'LEGACY', 'EXEMPT'));

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_coherence_check;

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
            equality_source = 'EXEMPT'
            AND type = 'SALARY'
            AND equality_report_id IS NULL
            AND equality_legacy_valid_until IS NULL
          )
          OR
          (
            equality_source = 'REPORT'
            AND equality_legacy_valid_until IS NULL
          )
        );

      COMMENT ON COLUMN report.equality_source IS 'What the equality obligation was met by when this salary report was filed: REPORT (an APPROVED report in this system, linked via equality_report_id), LEGACY (an unexpired certificate from the retired SharePoint register, which mints no report row — see legacy_report) or EXEMPT (nothing covered the company, and as a sveitarfélag it may file a salary report without equality coverage; no link, no date). Always REPORT on equality reports and on every row filed before the legacy basis was accepted.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM report WHERE equality_source = 'EXEMPT') THEN
          RAISE EXCEPTION 'report has EXEMPT salary rows; they have no REPORT or LEGACY value to fall back to';
        END IF;
      END $$;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_coherence_check;

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

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_source_check;

      ALTER TABLE report
        ADD CONSTRAINT report_equality_source_check
        CHECK (equality_source IN ('REPORT', 'LEGACY'));

      COMMENT ON COLUMN report.equality_source IS 'What the equality obligation was met by when this salary report was filed: REPORT (an APPROVED report in this system, linked via equality_report_id) or LEGACY (an unexpired certificate from the retired SharePoint register, which mints no report row — see legacy_report). Always REPORT on equality reports and on every row filed before the legacy basis was accepted.';

      COMMIT;
    `)
  },
}
