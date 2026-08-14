'use strict'

/**
 * Partial unique index on `report.identifier`.
 *
 * The identifier is the short pseudonymous handle (`KTPQZW`) reviewers and
 * applicants quote instead of a kennitala, and it is what the admin report
 * search matches on (`report/utils/filters.ts`). Two reports sharing a code
 * would make that search permanently ambiguous, with no error anywhere to say
 * so — the reviewer just gets two rows and no way to tell which the applicant
 * meant.
 *
 * `ReportIdentifierService.allocate` probes with `count` before minting, which
 * removes the birthday collision against committed rows (~17k reports for a 50%
 * chance across six letters). It cannot close the concurrent window: the probe
 * runs inside the request's CLS transaction, so an insert another request has
 * not committed is invisible to it, and no amount of retrying helps. This index
 * is what makes a duplicate impossible — a true concurrent collision is
 * rejected at write time instead of being stored.
 *
 * DRAFT rows legitimately carry no identifier (it is minted at submit, since a
 * draft is invisible to reviewers until then and drafts are reaped), so the
 * index is partial: nulls coexist freely.
 *
 * The DO block fails the migration with something readable if the pre-index data
 * already contains a duplicate. Every historical code came from a 309M space, so
 * this should never fire; if it does, the raw index error would not say which
 * code was at fault.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DO $$
    DECLARE
      duplicates text;
    BEGIN
      SELECT string_agg(identifier, ', ')
        INTO duplicates
        FROM (
          SELECT identifier
            FROM report
           WHERE identifier IS NOT NULL
           GROUP BY identifier
          HAVING count(*) > 1
        ) dupes;

      IF duplicates IS NOT NULL THEN
        RAISE EXCEPTION
          'Cannot add report_identifier_unique_idx: identifier already duplicated on % — reassign one of each pair first',
          duplicates;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS report_identifier_unique_idx
      ON report (identifier)
      WHERE identifier IS NOT NULL;

    COMMENT ON COLUMN report.identifier IS 'Short pseudonymous handle (six uppercase letters) used to refer to a report without quoting a kennitala. Minted server-side at creation, or at submit for a draft-born report; never supplied by a caller. NULL while the report is a DRAFT. Unique among non-null values.';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP INDEX IF EXISTS report_identifier_unique_idx;

    -- Restore the pre-migration comment. Leaving the one written by \`up\` would
    -- have the schema documenting a uniqueness guarantee nothing enforces.
    COMMENT ON COLUMN report.identifier IS NULL;

    COMMIT;
    `)
  },
}
