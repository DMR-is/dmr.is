'use strict'

/**
 * Adds `report.equality_report_pdf_key`: the staged upload key that delivered
 * the report's current plan PDF, when it arrived by presigned upload.
 *
 * The application portal registers a plan by key (`equalityReportPdfKey`), and
 * the API deletes the staged object once the plan is stored. A client that
 * retries after a lost response resends the same key; without a record of it
 * the API can only look for an object that is gone and answer 500 for a plan
 * that was saved. With it, a resend of the key that delivered the current plan
 * is recognised and answered as the success it was.
 *
 * Null for a plan that arrived any other way (inline base64, HTML, partner API,
 * admin), and reset to null by every write that replaces the plan — so a key
 * whose plan has since been replaced is never mistaken for a replay. Existing
 * rows are left null: none of them can be replayed, their objects are gone.
 *
 * No CHECK tying it to `equality_report_content_type = 'PDF'`: code without
 * this column in its model (a rollback, or an old task during a rolling
 * deploy) writes the plan without clearing the key, and the CHECK would turn
 * that HTML correction into a 500. The resolver is the only writer that sets
 * it. To roll back, revert the code and clear the column
 * (`UPDATE report SET equality_report_pdf_key = NULL`), so a later
 * roll-forward cannot mistake a key left beside a replaced plan for a replay.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS equality_report_pdf_key TEXT DEFAULT NULL;

      COMMENT ON COLUMN report.equality_report_pdf_key IS 'Staged upload key (doe-imports/equality-plan/...) that delivered the current plan PDF, so a client retrying with the same key is answered as the success it was. Null when the plan arrived any other way; reset by every plan write.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report DROP COLUMN IF EXISTS equality_report_pdf_key;

      COMMIT;
    `)
  },
}
