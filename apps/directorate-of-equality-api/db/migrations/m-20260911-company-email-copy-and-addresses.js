'use strict'

/**
 * Two additions to the custom-email flow: several addresses on a single-company
 * send, and one copy of the message to an address of the sender's choosing.
 *
 * ## Why the recipient uniqueness moves
 *
 * `m-20260908-company-email` made (company_email_id, company_id) unique, and
 * that was right while a company could only ever be written to once per batch.
 * The compose step can now name several addresses for one company — the CEO and
 * the HR contact, say — and each is **its own message**: its own row, its own
 * send, its own timeline entry, and no recipient sees the others.
 *
 * The constraint still has to do its original job, which is to make a resumed
 * batch unable to insert a second row for something already written to. So it
 * moves to (company_email_id, company_id, email) rather than being dropped.
 *
 * Two partial indexes rather than one, because `email` is nullable and a NULL
 * never equals a NULL: a plain three-column unique index would let a company
 * with no address on file collect unlimited skipped rows. `NULLS NOT DISTINCT`
 * would express this in one index, but it is Postgres 15+, and this schema has
 * no other 15-only dependency.
 *
 * ## Why the copy is two columns on the batch and not a recipient row
 *
 * A copy belongs to the *message*, not to a company. It has no company timeline
 * to be written to and must not be counted among the companies that were
 * mailed, so `company_email_recipient` — whose `company_id` is NOT NULL — is
 * the wrong table for it.
 *
 * ⚠️ It is deliberately one copy per batch and not a BCC header on every
 * message. A send addressed at the whole register would otherwise deliver
 * ~1 700 identical copies into one inbox.
 *
 * `copy_sent_at` is what keeps it to one: a resumed batch sends the copy only
 * if it is still null. Null after a failed copy too, so a resume retries it.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_email
        ADD COLUMN IF NOT EXISTS copy_to_email TEXT,
        ADD COLUMN IF NOT EXISTS copy_sent_at TIMESTAMPTZ;

      ALTER TABLE company_email_recipient
        DROP CONSTRAINT IF EXISTS company_email_recipient_unique;

      -- One row per address per company per batch.
      CREATE UNIQUE INDEX IF NOT EXISTS company_email_recipient_unique_address
        ON company_email_recipient (company_email_id, company_id, email)
        WHERE email IS NOT NULL;

      -- And exactly one address-less row per company per batch — the skip.
      CREATE UNIQUE INDEX IF NOT EXISTS company_email_recipient_unique_no_address
        ON company_email_recipient (company_email_id, company_id)
        WHERE email IS NULL;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    /*
     * ⚠️ The old constraint is restored only if the data still allows it. A
     * batch sent to two addresses at one company has two rows sharing a
     * company_id, and recreating (company_email_id, company_id) as unique would
     * fail on them — so the rollback drops back to a non-unique index rather
     * than destroying the record of mail that was genuinely sent. The
     * constraint's job is resume safety on rows that are only ever written
     * once; an index is enough to keep the lookup it also served.
     */
    await queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS company_email_recipient_unique_address;
      DROP INDEX IF EXISTS company_email_recipient_unique_no_address;

      CREATE INDEX IF NOT EXISTS company_email_recipient_company_idx
        ON company_email_recipient (company_email_id, company_id);

      ALTER TABLE company_email
        DROP COLUMN IF EXISTS copy_sent_at,
        DROP COLUMN IF EXISTS copy_to_email;

      COMMIT;
    `)
  },
}
