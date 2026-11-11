'use strict'

/**
 * `report_attachment`: supporting files (fylgiskjöl) a company sends with its
 * equality report, alongside the one main plan stored on `report` itself.
 * Companies asked for this because some keep their action plans in Excel.
 *
 * The bytes live here, not in S3. Volume is small (a few thousand reports per
 * three-year cycle, few with attachments, at most 6 × 4 MB each), so a `bytea`
 * column costs nothing that object storage would save, and keeps access behind
 * the API's own authorization, inside the same backups and the same delete.
 * The upload itself is staged through the DOE imports bucket and moved here by
 * the API, which deletes the staged object.
 *
 * Insert-and-delete only — an attachment is replaced by deleting it and
 * uploading another — so there is no `updated_at`.
 *
 * `ON DELETE CASCADE`: an attachment means nothing without its report, and a
 * report deleted for privacy reasons must take its files with it.
 *
 * The 6-per-report cap is enforced in the service under a row lock on the
 * report; a CHECK cannot count rows.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS report_attachment (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        report_id UUID NOT NULL REFERENCES report(id) ON DELETE CASCADE,
        -- The name the company uploaded it under, which is what the reviewer sees.
        filename TEXT NOT NULL,
        -- Matches the bytes: the API checks the file signature against it before
        -- inserting. The download's content type is derived from this, never from
        -- anything the client sent.
        extension TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        content BYTEA NOT NULL,

        CONSTRAINT report_attachment_extension_check
          CHECK (extension IN ('pdf', 'docx', 'xlsx', 'xls')),
        CONSTRAINT report_attachment_size_check
          CHECK (size_bytes > 0 AND size_bytes <= 4194304),
        CONSTRAINT report_attachment_filename_check
          CHECK (length(filename) BETWEEN 1 AND 255)
      );

      CREATE INDEX IF NOT EXISTS report_attachment_report_idx
        ON report_attachment (report_id);

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Destroys every uploaded attachment. Intended for local development only.
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS report_attachment;
    `)
  },
}
