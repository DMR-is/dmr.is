'use strict'

/**
 * Several addresses on a single-company send, and one copy of the message to an
 * address of the sender's choosing.
 *
 * The recipient uniqueness moves from (company_email_id, company_id) to
 * (company_email_id, company_id, email): one company can now be named by
 * several addresses, each its own message and its own row, and the constraint
 * still has to stop a resumed batch inserting a duplicate. Two partial indexes
 * because `email` is nullable and NULL never equals NULL — `NULLS NOT DISTINCT`
 * would be one index but needs Postgres 15+.
 *
 * The copy is two columns on the batch rather than a recipient row: it belongs
 * to the message, has no company timeline, and must not be counted among the
 * companies mailed. One copy per batch, not a BCC on every message, which on a
 * register-wide send would deliver ~1700 copies to one inbox. `copy_sent_at`
 * keeps it to one, and stays null after a failure so a resume retries.
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
    // The old constraint is restored only as a non-unique index: a batch sent to
    // two addresses at one company shares a company_id, and recreating the unique
    // constraint would fail on exactly the rows recording mail that was sent.
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
