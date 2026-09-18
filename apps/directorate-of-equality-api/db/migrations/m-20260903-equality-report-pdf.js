'use strict'

/**
 * Lets an equality report's content BE a PDF instead of rich text.
 *
 * `equality_report_content` keeps holding the content either way — HTML as
 * before, or the base64-encoded PDF verbatim — and the new
 * `equality_report_content_type` says which of the two is in there. One column
 * rather than two because the two are mutually exclusive: a report has one
 * content, in one of two representations, and a second column would only create
 * a state where both are set and nothing says which one counts.
 *
 * `NOT NULL DEFAULT 'HTML'` is what makes this a non-event for the existing
 * rows: every report written before today IS html, so the backfill is correct
 * rather than merely convenient, and no read path has to handle a null
 * discriminator.
 *
 * `equality_report_content_filename` carries the name of the file the company
 * uploaded, which is the only human-readable handle a PDF has — the admin UI
 * renders it above the embedded document. Meaningless for HTML content (the
 * .docx it was converted from is not what we stored), hence the CHECK that ties
 * it to the PDF case rather than a blanket NOT NULL.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS equality_report_content_type TEXT NOT NULL DEFAULT 'HTML',
        ADD COLUMN IF NOT EXISTS equality_report_content_filename TEXT;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_report_content_type_check;

      ALTER TABLE report
        ADD CONSTRAINT report_equality_report_content_type_check
        CHECK (equality_report_content_type IN ('HTML', 'PDF'));

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_report_content_filename_check;

      -- A PDF without a filename has nothing to display; a filename on HTML
      -- content would name a file we did not keep.
      ALTER TABLE report
        ADD CONSTRAINT report_equality_report_content_filename_check
        CHECK (
          (equality_report_content_type = 'PDF' AND equality_report_content_filename IS NOT NULL)
          OR
          (equality_report_content_type = 'HTML' AND equality_report_content_filename IS NULL)
        );

      COMMENT ON COLUMN report.equality_report_content_type IS 'How to read equality_report_content: HTML (rich text, the original representation) or PDF (the base64-encoded bytes the company uploaded, stored verbatim).';
      COMMENT ON COLUMN report.equality_report_content_filename IS 'Name of the PDF the company uploaded, shown in the admin review UI. Non-null exactly when equality_report_content_type = PDF.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_report_content_filename_check;

      ALTER TABLE report
        DROP CONSTRAINT IF EXISTS report_equality_report_content_type_check;

      ALTER TABLE report
        DROP COLUMN IF EXISTS equality_report_content_filename,
        DROP COLUMN IF EXISTS equality_report_content_type;

      COMMIT;
    `)
  },
}
